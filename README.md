# 🕹️ Resume Arcade — Dave Otteman, DevOps Engineer

**▶ Play it / read it: https://dotteman.github.io/resume_arcade/**

My resume as a retro arcade cabinet. Pick a game and every hit **unlocks** a line of the resume in the side panel — clear the whole thing to "complete" the resume. In a hurry? Press **R** (or the **READ RESUME** button) for a plain, printable version.

<!-- TODO: add a gameplay GIF here, e.g. ![gameplay](docs/gameplay.gif) -->

## 🎮 Games

| Key | Game | How it works |
|---|---|---|
| `1` | **Resume Invaders** | Each resume section descends as a wave of letters. Shoot letters to unlock their line; lines that get past you show up dimmed. |
| `2` | **Resume Breakout** | One brick per word, one section per level. Clear a level to move to the next section. |
| `3` | **Resume Asteroids** | The section's words drift in space. Blast them, don't crash into them. |

Deep links skip the menu: `?game=invaders`, `?game=breakout`, `?game=asteroids`.

## ⌨️ Controls

| | Keyboard | Mouse / touch |
|---|---|---|
| Move | `←` `→` or `A` `D` | Breakout/Invaders: mouse or drag |
| Fire / launch | `Space` (hold to auto-fire) | Invaders: touch auto-fires · Breakout: tap to launch |
| Asteroids | `←` `→` rotate, `↑` thrust, `Space` fire | Left third rotate left, right third rotate right, middle thrust |
| Read resume | `R` | **READ RESUME** button |
| Pause | `P` or `Esc` | **PAUSE** button / tap to resume |
| Menu | `M` | **MENU** button |
| CRT effect on/off | `C` | **CRT** button (remembered) |

Respects `prefers-reduced-motion`, and the resume view prints cleanly.

## ✏️ Editing the resume

Everything lives in [`config.js`](config.js):

- `RESUME_CONFIG` — name, contact links, skills, experience, education, projects. Write it in normal case if you like: the games upper-case text automatically, the resume view shows it as written.
- `personal.resumePdf` — set to a PDF file in this repo (e.g. `"Dave_Otteman_Resume.pdf"`) to show a **DOWNLOAD PDF** button.
- `GAME_CONFIG` — default menu selection, colors, speeds (pixels per frame at 60 fps; frame-rate independent) and lives.

## 📁 Files

```
index.html          Page shell, menu, reveal panel, resume view, meta tags
style.css           CRT/neon styling, responsive layout, print styles
config.js           ⭐ Resume data, game settings, resume → sections builder
engine.js           Shared engine: HiDPI canvas, dt game loop, input, banners, particles, game registry
game-invaders.js    Invaders
game-breakout.js    Breakout
game-asteroids.js   Asteroids
ui.js               Start screen, reveal panel, readable resume, keyboard shortcuts
examples/           Sample resume configs
IMPROVEMENTS.md     Review notes and remaining to-dos
```

## 🧪 Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

CI (`.github/workflows/lint.yml`) syntax-checks every script and lints the HTML on each push and pull request.

## ➕ Adding a game

1. Create `game-yourgame.js` with `class YourGame extends GameEngine` implementing `update(dt)` and `draw()`. Use `this.currentSection()` for content, call `this.reveal(line)` when a piece of a line is hit, and `this.advanceSection()` when a wave/level ends.
2. Register it in the `GAMES` object at the bottom of `engine.js`.
3. Add the `<script>` tag to `index.html` (before `ui.js`).

---

Built with vanilla JavaScript — no frameworks, no build step.
