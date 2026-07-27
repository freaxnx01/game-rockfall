# Rockfall ⛏️💎

A Boulder-Dash-style cave-digging arcade game — dig through dirt, collect gems to open the exit, and dodge falling rocks and patrolling enemies across 5 handcrafted caves.

**▶ Play it here: `https://github.freaxnx01.ch/game-rockfall/`**

![CRT arcade pixel-art](https://img.shields.io/badge/style-CRT%20pixel--art-3ad6e8) ![Single file](https://img.shields.io/badge/build-none%20needed-8fd8e8) ![License](https://img.shields.io/badge/license-MIT-bfe3b2)

## Features

- **5 handcrafted caves** — First Steps, Rockslide, Firefly Den, The Mill, Butterfly Farm — each with its own gem quota, timer and hazards
- **Physics-driven digging** — push rocks, trigger cascades, fall through gaps; rocks and gems roll and tumble realistically
- **Enemies** — wall-following fireflies (explode plain) and butterflies (explode into a burst of gems)
- **Magic wall** — feed it rocks or gems for 45 seconds to transmute one into the other
- **CRT scanline aesthetic** with pixel-art sprites drawn programmatically at runtime — no image assets
- **Chiptune audio** — synthesized music and SFX via the Web Audio API
- **Persistent progress** — unlocked caves and hi-score saved to `localStorage`

## Controls

| Input | Action |
|---|---|
| Arrows / WASD | Move / dig |
| Enter | Start / confirm |
| P | Pause |
| R | Sacrifice a life (escape a soft-lock) |
| M | Toggle sound |
| Esc | Back to title |

## Running locally

Open `index.html` in any modern browser — that's it. No build step, no dependencies, no internet connection required.

## Tech

Dependency-free Web Component (`<boulder-game>` in `game.js`): a single `<canvas>`, deterministic per-tick physics (140 ms tick), programmatically-drawn 16×16 pixel-art sprites, and synthesized chiptune music/SFX via Web Audio. No build tools, no framework.

## License

MIT — see [LICENSE](LICENSE).
