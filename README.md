# Andhra Temples — Shorts Studio

## Run with Docker (recommended)

Extract the ZIP, open a terminal in `AP_Temple_Shorts_Studio`, and run:

```sh
docker compose up --build -d
```

Open **http://localhost:8080**. Stop: `docker compose down`.

## Run directly on Windows

Install Python 3.11+ and FFmpeg (with `libx264`). For FFmpeg, run `winget install Gyan.FFmpeg` and reopen the terminal so it is on PATH. Double-click `start.bat`, or run:

```powershell
python -m pip install -r requirements.txt
python server.py
```

Open **http://localhost:8080**. Windows uses locally installed Georgia and Nirmala UI where available. Docker uses Noto Serif and Noto Serif Telugu. Telugu requires a Pillow build with RAQM shaping; `/api/health` reports availability. No font files are included. On Linux, install `ffmpeg`, `fonts-noto-core` and `fontconfig`, then run `./start.sh`.

## Included

- 90 daily temple records, imported from English and Telugu workbook sheets; each retains hook, mystery, about, history and original source metadata. The original workbook and all four original template/example images are in `source/`.
- Opening template: full-width temple image with original cream header; 30 supplied photos matched by day. The other 60 use original region-inspired representative illustrations, not photographs or reconstructions of the specific temples. An explicit label is burned into the opening card whenever an illustration is used. Replace an illustration with your own verified photo anytime.
- The three content cards use the supplied Image 2 template unchanged. Full original text remains editable. Text is auto-wrapped and fitted, reveals in groups at one-second intervals, and floats/fades into place. Preview and export share the same server-rendered line graphics.
- 18s default = 3s opening + 5s each content card; 24s = 3s + 7s each. The 33s, 39s and 48s modes provide additional reading time. Longer original passages may be difficult to read in the 18s mode; use a longer mode or manually shorten them. Nothing is silently shortened.
- Silent portrait H.264 MP4, 1080×1920, 30 fps (15 fps rendering with duplicated output frames). One export runs at a time. Download starts when ready; cancelled or failed exports are not retained. Exports and custom images are in `runtime/` (Docker named volume). Browser edits are stored locally per day/language; uploaded image overrides apply to both languages. Export jobs are held in server memory; restarting the server clears active job status, not the files.
- This is a single-user local studio, not a public authenticated service. If hosting on a remote server, place it behind an authenticated reverse proxy and HTTPS; do not expose it directly to the internet.

## Files

`server.py` — preview layout, image upload and MP4 renderer; `static/` — responsive website and assets; `data/temples.json` — imported source data; `source/` — supplied workbook and examples. `TEMPLE_FONT_EN`, `TEMPLE_FONT_TE`, `FFMPEG`, `HOST`, `PORT` can be set in the environment.

## Verification

All 720 text cards were checked for layout fit. The `samples/` directory contains two actual exported MP4s (18-second Telugu and 24-second English). Browser navigation in the build environment was blocked by an administrator policy, so interactive browser testing was not completed; Python API and FFmpeg exports were tested.
# TempleStudio
