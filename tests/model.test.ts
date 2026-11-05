import assert from "node:assert/strict";
import test from "node:test";
import schema from "../src/appmeta/settings.json" with { type: "json" };
import { AppModel } from "../src/model.ts";
import { schemaDefaults, type Settings } from "../src/lib.ts";
const NOW = 1700000000000;
const make = (values: Settings = {}, saved: Settings = {}, now = NOW) =>
  new AppModel({ ...schemaDefaults(schema.fields), ...values }, saved, now);

test("paused position stays fixed while playing position advances", () => {
  const a = make();
  a.receive(
    {
      title: "Song",
      artist: "Artist",
      playing: false,
      position_s: 10,
      duration_s: 100,
    },
    NOW,
  );
  assert.match(a.view(NOW + 10000).rows?.[1] || "", /^0:10/);
  a.receive(
    { title: "Song", playing: true, position_s: 10, duration_s: 100 },
    NOW,
  );
  assert.match(a.view(NOW + 10000).rows?.[1] || "", /^0:20/);
});
test("playback commands are not duplicated while one is pending", () => {
  const a = make({ source_url: "https://player.example" });
  a.key("ok", 0, NOW);
  const first = a.pendingCommand;
  a.key("ok", 0, NOW);
  assert.equal(a.pendingCommand, first);
  assert.equal(a.commandBusy, true);
});
