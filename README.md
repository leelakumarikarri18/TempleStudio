# Andhra Temples — Shorts Studio

A Go-powered, Vercel-compatible studio for creating English and Telugu temple shorts. The Go binary embeds the complete website, 90-temple dataset, templates, photos, and illustrations, so deployment does not depend on runtime files or persistent server storage.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import it into Vercel, or redeploy the existing project.
3. Keep the project root as `.`. No build command, output directory, environment variables, Python runtime, or FFmpeg installation is needed.

`vercel.json` selects the **Other** framework preset and routes every request to the single Go function in `api/index.go`. The function serves the embedded application and API routes.

## Run locally

Install Go 1.20 or newer, then run:

```sh
go run ./cmd/server
```

Open <http://localhost:8080>. On Windows, `start.bat` performs the same action. You can also run:

```sh
docker compose up --build
```

## Architecture

- `api/index.go` — Vercel Go Function entry point.
- `studio/studio.go` — embedded-file HTTP handler shared by Vercel and local execution.
- `cmd/server/main.go` — local/Docker server.
- `studio/static/` — browser application and all visual assets.
- `studio/data/temples.json` — the 90-temple English/Telugu content library.
- `vercel.json` — explicit catch-all routing to the Go function.

Preview composition, text layout, custom-image resizing, animation, and video recording run in the browser. This design avoids serverless filesystem, FFmpeg, timeout, background-job, and cross-invocation state problems. Chrome and Edge normally export MP4 when their MediaRecorder supports it; other browsers fall back to WebM. Export runs in real time, so an 18-second short takes approximately 18 seconds to record.

User edits and resized replacement images stay in browser storage. They are never uploaded to the server.

## Verification

```sh
go test ./...
go vet ./...
```

Health endpoint: `/api/health`

Temple data endpoint: `/api/temples`
