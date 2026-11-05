# Now Playing for BUSY Bar

[![CI](https://github.com/iMalkav/busybar-now-playing/actions/workflows/ci.yml/badge.svg)](https://github.com/iMalkav/busybar-now-playing/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<img src="src/appmeta/icon_front_8x8.png" width="64" height="64" alt="Now Playing icon">

Track information and playback controls for your desk.

Category: **Music**.

## Screenshots

<img src="screenshots/front.png" width="576" height="128" alt="Now Playing on the BUSY Bar front display">

<img src="screenshots/back.png" width="480" height="240" alt="Now Playing on the BUSY Bar rear display">

Captured from a physical BUSY Bar. See [capture details](docs/SCREENSHOTS.md)
for firmware, settings and sample-data provenance.

## Controls

Wheel selects Play/pause, Next or Previous. OK sends the command. Back exits.

## Settings

Open **Apps → Now Playing → Setup**. Saved settings are read when the app starts.

| Setting | Type | Default |
| --- | --- | --- |
| Source URL | string |  |
| Access token | string |  |
| Refresh (sec) | integer | 30 |
| Provider | enum | json |
| Media player entity | string | media_player.office |

JSON mode reads Source URL and posts commands to Source URL/command. The adapter must return {"result":"ok"} only after accepting the command. Home Assistant mode uses a media_player entity and its REST services. This app displays metadata and controls an existing player; audio remains with that player.

Access token is sent as a Bearer token. Configure URLs and credentials in the web settings. Remote sources require Wi-Fi.

Failed refreshes retain the last valid data and show an error. Values older than three refresh intervals are marked stale.

See [docs/DATA.md](docs/DATA.md) for the response format and [examples/response.json](examples/response.json) for a sample.

## Install and build

Use the Node.js version in [.nvmrc](.nvmrc) and the pnpm version in [package.json](package.json).

    corepack pnpm install --frozen-lockfile
    corepack pnpm check
    corepack pnpm app:install
    corepack pnpm app:run

Pass --addr <host> to an app command to select a device. See [INSTALL.md](INSTALL.md).
The minimum firmware HTTP API is specified in [src/appmeta/manifest.json](src/appmeta/manifest.json).

## Development

Each project contains its own runtime, state model, assets, tests and build scripts.
Run pnpm check for metadata validation, type checking, unit tests, packaging and bundle smoke checks.
Run pnpm release to prepare a versioned archive and SHA256SUMS locally.
Generated files under dist/ are excluded from Git.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/RELEASING.md](docs/RELEASING.md).

## License

Code, pixel icons, geometric artwork and synthesized sound assets: [MIT](LICENSE).
Assets can be recreated with python art/generate_assets.py. Rendering uses fonts supplied by the BUSY Bar firmware.

## AI assistance

See [AI_ASSISTANCE.md](docs/AI_ASSISTANCE.md) for the role of AI in this project.
