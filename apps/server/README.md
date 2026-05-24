# Ticket to Ride Hannover — Multiplayer relay server

Thin Go server that sequences and broadcasts game actions for the web client.
Does **not** run the engine; clients hold authoritative state, the server only
assigns monotonic `seq` numbers per room and broadcasts to peers.

The web app's single-player flow (hot-seat, vs AI) works fully without this
server — `VITE_MP_SERVER_URL` unset hides the Online entry tile.

## Run locally

```sh
go run ./cmd/server serve --port 8080 --cors-origin http://localhost:5173
```

Then run the web app with `VITE_MP_SERVER_URL=ws://localhost:8080/ws bun run dev`.

## Configuration

All flags accept env equivalents prefixed `TTR_` (e.g. `TTR_PORT`).

| Flag              | Default                  | Description                            |
| ----------------- | ------------------------ | -------------------------------------- |
| `--port`          | `8080`                   | HTTP port                              |
| `--cors-origin`   | `http://localhost:5173`  | Comma-separated allowed WS origins     |
| `--room-ttl`      | `1h`                     | Idle room TTL before sweep             |
| `--sweep-interval`| `1m`                     | Sweeper period                         |
| `--max-rooms`     | `500`                    | Concurrent room cap                    |
| `--log-level`     | `info`                   | `debug` / `info` / `warn` / `error`    |

## Test, lint, build

```sh
go test ./...
golangci-lint run ./...
go build ./...
```

## Deploy to Fly.io

One-time:

```sh
flyctl auth login
flyctl launch --copy-config --no-deploy
flyctl secrets set TTR_CORS_ORIGIN="https://your-pages-host"
```

The CI workflow `.github/workflows/server-deploy.yml` deploys on `workflow_dispatch`
or pushes to `main` that touch `apps/server/**`. It needs a `FLY_API_TOKEN`
repository secret:

```sh
flyctl tokens create deploy
# paste into Settings → Secrets and variables → Actions → New repository secret
```

## Protocol

JSON over WS, lowerCamelCase keys, discriminated by `type`. See
`apps/web/src/net/protocol.ts` for the canonical TypeScript shapes that mirror
the Go structs in `internal/ws/protocol.go`.
