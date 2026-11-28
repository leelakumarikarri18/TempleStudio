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

Preview composition, text layout, custom-image resizing, animation, and video recording run in the browser. This design avoids serverless filesystem, FFmpeg, timeout, background-job, and cross-invocation state problems. Chrome or Edge first records H.264 MP4, then the pinned Mediabunny browser muxer losslessly rebuilds it as a regular, video-only Fast Start MP4 with `ftyp`, `moov`, and `mdat` metadata in YouTube-friendly order. Fragmented and edit-list MP4 structures are rejected before download. The finalized export is validated in an on-page video preview and can be downloaded or passed to Android's share sheet; music can then be added in the YouTube Shorts editor. Export runs in real time, followed by a short finalization step. Keep the browser open and the screen awake until recording, finalization, preview preparation, and download finish.

User edits and resized replacement images stay in browser storage. They are never uploaded to the server.

## Verification

```sh
go test ./...
go vet ./...
```

Health endpoint: `/api/health`

Temple data endpoint: `/api/temples`

## Continuous story update

The embedded library uses the supplied `source/Temple_Content.xlsx` (90 Days English and 90 Days Telugu). Each language has an opening question and one complete narration. The browser splits the narration into three ordered clips, preferring balanced sentence boundaries. The original wording is kept; text appears one line at a time on the existing template. The export records the opening and all three clips into one vertical video.

Auto duration is the default and estimates reading time from the text (180 words/min English, 125 words/min Telugu, plus pauses). The original fixed-duration presets remain available for faster clips, but may be too short for comfortable reading of longer stories. English/Telugu are exported separately as before. The script editor allows editing the whole story; Reset restores the new workbook version. Existing browser image overrides are carried forward, but old script drafts are intentionally not loaded over the updated content.

The MP4 files in `samples/` are legacy examples from the previous version, not new workbook exports.

Run `node tests/story.test.cjs` to verify that all 180 narration variants split into three complete, ordered parts.

## YouTube Shorts upload details

Below the video export/download controls, **YouTube Shorts details** automatically generates a title, description and comma-separated tags for each of the 90 temples in English and Telugu. Use the shortcut next to Customize short to jump to the panel. Copy each field into YouTube Studio, or use Copy all details for a combined text block. Metadata follows the selected day, language, script and image; changing the video settings clears the old download link to avoid attaching the wrong metadata to an earlier export.

Titles use the opening question, temple name when needed, and #Shorts where it fits. Descriptions include the temple name, question, a story excerpt, a natural engagement prompt, relevant hashtags and an illustration notice where appropriate. Tags include English/Telugu names, locally curated topic phrases, region and related temple search terms. Limits: 100 title characters, 5,000 description characters, 500 tag characters (including separator/space overhead). The generator runs locally without any API key, paid service or live keyword-volume data. Custom script edits update the title and excerpt and omit the default story-specific topic tags to avoid mismatched keywords.

Guidance consulted: [Shorts search and discovery](https://support.google.com/youtube/answer/11914225), [title tips](https://support.google.com/youtube/answer/12340300), [description tips](https://support.google.com/youtube/answer/12948449), [tags](https://support.google.com/youtube/answer/146402), [hashtags](https://support.google.com/youtube/answer/6390658). Metadata cannot guarantee views or subscribers; audience retention and viewer relevance matter more than tag volume.

Run `node tests/metadata.test.cjs` to verify all 180 metadata sets and custom edit behavior.
