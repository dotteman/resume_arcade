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
| `4` | **Resume Maze** | Explore a 3D world built from the resume text. Dodge the robot, the cracked marble and the magnet. |

Deep links skip the menu: `?game=invaders`, `?game=breakout`, `?game=asteroids`, `?game=maze`.

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

The resume lives in **[`resume.md`](resume.md)**, a plain markdown file. Edit it, commit, and every game and the READ RESUME view update automatically. No code changes needed.

```markdown
# Your Name

- Title: Your Job Title
- Location: City, ST
- Email: you@example.com
- LinkedIn: linkedin.com/in/your-profile
- GitHub: github.com/your-username
- PDF: your-resume.pdf

## Summary

A short paragraph. Each sentence unlocks separately in the games.

## Skills

- Skill One
- Skill Two

## Experience

### Job Title | Company | Month Year – Present

- An achievement, ideally with a number in it.

## Education

### Degree | School | Year
```

| Markdown | Meaning |
|---|---|
| `# Name` | Your name (one, at the top) |
| `- Key: value` | Contact details before the first `##`: Title, Location, Email, Phone, LinkedIn, GitHub, Website, PDF. Other keys are shown as written; blank values are hidden. |
| `## Section` | Any section you like (Summary, Skills, Experience, Certifications…). Each one becomes a game level. |
| `### A \| B \| C` | An entry: `Title \| Company \| Dates`, `Degree \| School \| Year`, `Project \| Tech` |
| `- bullet` / paragraph | Achievements under an entry, or a list / text directly under a section |

Write in normal sentence case: the games convert to upper case for you, and the resume view shows the text as written. `**bold**`, `*italic*`, `` `code` `` and `[links](https://…)` work in the resume view.

The full commented template is in [`examples/resume.template.md`](examples/resume.template.md). To preview any resume file without replacing yours, add `?resume=` to the URL, e.g. `index.html?resume=examples/resume.template.md`.

Game settings (default game, colors, speeds, lives, and which resume file to load) are in [`config.js`](config.js).

## 🍴 Use it for your own resume

1. **Fork** this repo (or click *Use this template*).
2. Replace `resume.md` with your own. Start from `examples/resume.template.md`.
3. Optionally add a PDF of your resume and set `- PDF: your-file.pdf`.
4. In `index.html`, update the `<title>`, `description` and `og:` meta tags. Link previews on LinkedIn/Slack read those, and they can't come from the markdown.
5. **Settings → Pages →** deploy from the `main` branch. Keep the `.nojekyll` file: it stops GitHub Pages from converting `resume.md` into a web page, so the site can read it.

CI checks your `resume.md` on every push (`node tests/validate-resume.js`) and points out problems like a missing name heading or an empty section.

## 📁 Files

```
index.html          Page shell, menu, reveal panel, resume view, meta tags
style.css           CRT/neon styling, responsive layout, print styles
resume.md           ⭐ YOUR RESUME (markdown)
config.js           Game settings and which resume file to load
resume-parser.js    resume.md → resume data → game sections (also used by CI)
engine.js           Shared engine: HiDPI canvas, dt game loop, input, banners, particles, game registry
game-invaders.js    Invaders
game-breakout.js    Breakout
game-asteroids.js   Asteroids
game-maze.js        3D maze
ui.js               Start screen, reveal panel, readable resume, keyboard shortcuts
examples/           resume.template.md — blank, commented resume to copy
tests/              validate-resume.js — format check run by CI
.nojekyll           Serve files as-is on GitHub Pages (needed for resume.md)
IMPROVEMENTS.md     Review notes and remaining to-dos
```

> **Cache tip:** GitHub Pages lets browsers cache files for ~10 minutes. When you change any `.js` or `.css` file, bump the `?v=` number on its tag in `index.html` so visitors never get a mix of old and new files. `resume.md` is always re-checked, so resume edits need no version bump.

## 🧪 Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
node tests/validate-resume.js # check resume.md
```

A web server is required. Browsers won't let a page opened straight from disk (`file://`) read `resume.md`, and the page will tell you so.

CI (`.github/workflows/lint.yml`) syntax-checks every script, validates `resume.md`, and lints the HTML on each push and pull request.

## ➕ Adding a game

1. Create `game-yourgame.js` with `class YourGame extends GameEngine` implementing `update(dt)` and `draw()`. Use `this.currentSection()` for content, call `this.reveal(line)` when a piece of a line is hit, and `this.advanceSection()` when a wave/level ends.
2. Register it in the `GAMES` object at the bottom of `engine.js`.
3. Add the `<script>` tag to `index.html` (before `ui.js`).

---

Built with vanilla JavaScript — no frameworks, no build step.
