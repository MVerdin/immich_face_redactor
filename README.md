# Immich Face Redactor

A desktop Electron application for selecting people from an Immich library and
choosing a redaction style. This first stage connects to Immich and provides the
selection workflow; it does **not** modify or upload photos yet.

## Requirements

- Node.js 18 or newer
- npm
- A running Immich server and API key

## Run

Install dependencies and start the Electron application from the repository root:

```bash
npm install
npm start
```

The application keeps the API token in memory only. Enter the server URL (for
example, `https://photos.example.com`) and an API key with permission to read
people and assets. The URL may include a path prefix, but should not end with
`/api`.

The application uses Immich's `/api/people` endpoint and falls back to the
older `/api/person` endpoint when necessary. Thumbnails are retrieved per
person. The redaction selector and review action are planning controls in this
version: photos are not downloaded, modified, or uploaded.

Application errors and diagnostic information are written to a rotating log file
(maximum 2 MiB, with three backups). The default locations are:

- Linux: `~/.local/state/immich-face-redactor/immich-face-redactor.log`
- macOS: `~/Library/Logs/ImmichFaceRedactor/immich-face-redactor.log`
- Windows: `%LOCALAPPDATA%\ImmichFaceRedactor\logs\immich-face-redactor.log`

The API token is never written to the log.

## Development

```bash
npm test
```
