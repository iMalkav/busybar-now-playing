# Data source

JSON mode reads Source URL and posts commands to Source URL/command. The adapter must return {"result":"ok"} only after accepting the command. Home Assistant mode uses a media_player entity and its REST services. This app displays metadata and controls an existing player; audio remains with that player.

Source responses use application/json and must fit within 24 KiB. Access tokens use the Authorization: Bearer header.

## Response example

```json
{
  "title": "Evening Walk",
  "artist": "Local library",
  "playing": true,
  "position_s": 45,
  "duration_s": 180
}
```

Feeds may include updated_at in Unix milliseconds or ISO 8601 with a timezone. Older snapshots are ignored. A newer empty list clears the list. Maximum list size is 32 entries.

## Serve your own JSON

Run python examples/serve.py --host 0.0.0.0 on a computer or home server. Set Source URL to that host LAN address on port 8765. Edit the JSON file to publish new values, or choose another file with --file. FEED_TOKEN optionally enables Bearer authentication. The --writable option allows PUT updates. This example serves metadata only; playback commands need the adapter described above.
