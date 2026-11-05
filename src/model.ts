import {
  record,
  str,
  cycle,
  text,
  requiredNumber,
  requiredText,
  duration,
  source,
  timestamp,
  Feed,
  type View,
  type HttpSpec,
} from "./lib.ts";

export class AppModel extends Feed {
  action = 0;
  actions = ["Play / pause", "Next track", "Previous track"];
  position = 0;
  duration = 0;
  playing = false;
  received = 0;
  entity(): string {
    const v = str(this.settings, "entity");
    if (!/^media_player\.[a-z0-9_]+$/.test(v))
      throw new Error("Invalid media player entity");
    return v;
  }
  request(_now: number): HttpSpec {
    if (str(this.settings, "provider") === "home_assistant")
      return source(this.settings, "/api/states/" + this.entity());
    return source(this.settings);
  }
  receive(value: unknown, now: number, kind?: string): void {
    if (kind === "command") {
      if (
        str(this.settings, "provider") !== "home_assistant" &&
        record(value).result !== "ok"
      )
        throw new Error("Command was not accepted");
      this.error = "";
      return;
    }
    let v = record(value);
    const stamp = v.updated_at === undefined ? now : timestamp(v.updated_at);
    if (stamp < this.updated) return;
    if (str(this.settings, "provider") === "home_assistant") {
      const attrs = record(v.attributes);
      if (v.state === "unavailable" || v.state === "unknown")
        throw new Error("Player unavailable");
      v = {
        title: attrs.media_title || "No track",
        artist: attrs.media_artist || "",
        playing: v.state === "playing",
        position_s:
          (typeof attrs.media_position === "number"
            ? attrs.media_position
            : 0) +
          (v.state === "playing" && attrs.media_position_updated_at
            ? Math.max(
                0,
                (now - timestamp(attrs.media_position_updated_at)) / 1000,
              )
            : 0),
        duration_s: attrs.media_duration || 0,
      };
    }
    if (typeof v.playing !== "boolean")
      throw new Error("Missing playback status");
    const position = requiredNumber(v.position_s),
      length = requiredNumber(v.duration_s);
    if (position < 0 || length < 0 || (length > 0 && position > length + 2))
      throw new Error("Invalid playback position");
    this.commit(
      [{ title: requiredText(v.title), artist: text(v.artist) }],
      now,
      stamp,
    );
    this.position = position;
    this.duration = length;
    this.playing = v.playing;
    this.received = now;
  }
  key(key: string, delta: number, _now: number): boolean {
    if (key === "wheel") this.action = cycle(this.action, delta, 3);
    if (key === "ok") {
      const ha = str(this.settings, "provider") === "home_assistant";
      const commands = ["play_pause", "next", "previous"];
      const services = [
        "media_play_pause",
        "media_next_track",
        "media_previous_track",
      ];
      const request = source(
        this.settings,
        ha ? "/api/services/media_player/" + services[this.action] : "/command",
      );
      this.send({
        ...request,
        method: "POST",
        headers: { ...request.headers, "Content-Type": "application/json" },
        body: JSON.stringify(
          ha
            ? { entity_id: this.entity() }
            : { command: commands[this.action] },
        ),
        kind: "command",
      });
    }
    return false;
  }
  view(now: number): View {
    if (!this.items.length) return this.empty("Now Playing", now);
    const v = this.items[0];
    const elapsed =
      this.position +
      (this.playing ? Math.max(0, now - this.received) / 1000 : 0);
    const position =
      this.duration > 0 ? Math.min(this.duration, elapsed) : elapsed;
    return {
      ...this.feedView(
        this.playing ? "Playing" : "Paused",
        str(v, "title"),
        [
          str(v, "artist"),
          this.duration > 0
            ? duration(position * 1000) + " / " + duration(this.duration * 1000)
            : "Live stream",
          this.actions[this.action],
        ],
        now,
      ),
      progress: this.duration ? position / this.duration : 0,
    };
  }
}
