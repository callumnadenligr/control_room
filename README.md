# LIGR Control Room

Faithful local implementation of the LIGR Control Room interface.
Figma source: `https://www.figma.com/design/8Uhd5yZPoieEBz9VJkTyOC/Final-Designs?node-id=8339-40690`

## Run Locally

```bash
cd control-room
python3 -m http.server 8766
# Then open: http://localhost:8766
```

Or with any static server (npx serve, live-server, etc.).

## Interactions Implemented

- **AUTO GFX toggle** — click to enable/disable
- **Sidebar sections** — click headers to collapse/expand (Score, Clock, Quick Events, Match Events)
- **Clock field** — click the time display to start/stop the match clock
- **Score +/−** — click buttons to increment/decrement team scores
- **Clock period** — click 1st/HT/2nd/FT/ET quick buttons
- **Team selector** — Melbourne / Sydney tabs in Quick Events
- **Event buttons** — flash feedback on click (Goal, Yellow, Red, etc.)
- **Group collapse** — click chevron buttons on graphic groups
- **To Air** — click to put a graphic on-air (card goes red)
- **Off Air** — click to take a graphic off-air (card returns to default)
- **Content type tabs** — Graphics / Media / Data / Overlays
- **Category tabs** — Break / In Game / Clock / Lower Third

## Font Note

The design uses **PF DinText Pro** (commercial font). If not installed locally,
the browser falls back to Inter (loaded from Google Fonts) which closely matches.
