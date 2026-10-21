# Resume Arcade — Review & Improvement Plan

Review of `dotteman/resume_arcade` (live at https://dotteman.github.io/resume_arcade/).

**Core finding:** the resume is the *target*, so the more someone plays, the less of the resume they can read. The fixes below flip that: playing should *reveal* the resume, and anyone in a hurry should be able to read it in one click.

Legend: ✅ done in the `arcade-improvements` PR · ⬜ left for Dave (content decisions or follow-ups)

---

## 1. Make the resume readable (highest priority)

| | Item | Why |
|---|---|---|
| ✅ | **Readable resume view** — `R` key / "READ RESUME" button opens a plain HTML resume generated from `resume.md` | Recruiters give a page ~10 seconds; canvas text is invisible to screen readers and ATS |
| ✅ | **Reveal-as-you-play** — every hit "unlocks" its resume line into a side panel; sections show `UNLOCKED` when complete | Gameplay builds the resume instead of erasing it |
| ✅ | **Start screen / game select** (`1` `2` `3` or click), plus `?game=invaders\|breakout\|asteroids` deep links | Visitors choose; "INSERT COIN" now actually does something |
| ✅ | **LinkedIn + GitHub links shown** (were in config but never rendered) | |
| ✅ | **GitHub link corrected** to `github.com/dotteman` (config said `daveotteman`) | ⚠️ verify — and confirm the LinkedIn slug too |
| ⬜ | **PDF download** — drop `Dave_Otteman_Resume.pdf` in the repo and set `- PDF: Dave_Otteman_Resume.pdf` in `resume.md`; the button appears automatically | |

## 2. Gameplay bugs

| | Game | Issue | Fix |
|---|---|---|---|
| ✅ | Breakout | 44 rows × 25px ≈ 1,180px of bricks; canvas is ~750px → bottom third rendered below the paddle/off-screen. Lines > ~55 chars made bricks narrower than the font, so letters overlapped | One brick per **word**, one **resume section per level**, rows wrap to canvas width, bricks rebuilt on resize, lives + level banner, mouse control, sub-stepped collisions (no tunnelling), minimum bounce angle and an endgame aim-assist so the last few bricks don't drag on |
| ✅ | Invaders | Whole resume took ~185 s to scroll in at `letterSpeed: 0.2`; no fail state | Resume arrives in **waves** (one section each); next wave launches when the current one is cleared or passes the player |
| ✅ | Invaders, Asteroids | `bullets.splice()` inside nested `forEach` skipped bullets and let one bullet hit several targets | Bullets marked dead and filtered after the loop |
| ✅ | Asteroids | 183 words at once; 26 were 1–2 chars (`*`, `-`, `&`) with ~5px hit radius; `---` markers became asteroids; no ship collision; no touch controls (README claimed there were) | Punctuation tokens dropped, min hit radius, section waves (≤ ~30 rocks), spawn away from ship, ship collision + respawn invulnerability, touch zones |
| ✅ | All | No delta-time → 2–2.4× speed on 120/144 Hz monitors | `update(dt)` normalised to 60 fps |
| ✅ | All | Blurry on Retina/phones | Canvas scaled by `devicePixelRatio` |
| ✅ | All | Fallback-font flash on first frames | Wait for `document.fonts.ready` |
| ✅ | All | Pause | `P` / `Esc` pauses; `M` returns to menu |

## 3. Accessibility, SEO, sharing

| | Item |
|---|---|
| ✅ | `prefers-reduced-motion` disables flicker, glitch, scanline drift and blink |
| ✅ | CRT effect toggle (`C` key / button) |
| ✅ | `<noscript>` fallback with contact links |
| ✅ | Resume view is semantic HTML (`<main>`, `<h2>`, `<ul>`) |
| ✅ | Open Graph / Twitter meta tags + inline SVG favicon |
| ✅ | `<title>` and header update to match the selected game |
| ⬜ | Add `og-image.png` (1200×630 gameplay screenshot) — tag already points to it |
| ⬜ | For full SEO, the resume view is JS-rendered; if you want crawlers to see it without JS, generate a static copy into `index.html` with a small build step |

## 4. Resume content (Dave to decide — not changed in the PR)

- ⬜ **Outcomes over duties.** Most bullets read as responsibilities ("MANAGE VMWARE VSPHERE…"). Add numbers where you have them: VM count, pipelines built, deploy time cut, cost saved, users moved to MFA, repos migrated.
- ⬜ **Current BBSI work is under-represented.** Candidate bullets (keep generic as needed):
  - Standardised HCP Terraform workspace/project naming linked to Azure DevOps repos
  - Terraform-based backup solution for PostgreSQL and Azure SQL
  - Modernised VM builds with Packer + Ansible + Terraform on vSphere
  - Salesforce CI/CD with Salesforce CLI in Azure DevOps Pipelines
  - Automated RBAC/entitlement provisioning with Entra ID Governance (PowerShell)
  - Led Azure DevOps security-assessment remediation across two tenants
  - Windows Server 2025 build/provisioning automation
- ⬜ **Title:** consider "CLOUD / DEVOPS ENGINEER" if that matches how BBSI frames the role.
- ⬜ **Skills:** consider adding AZURE DEVOPS, PACKER, ENTRA ID, HCP TERRAFORM.
- ✅ **Case handling:** the games now upper-case automatically, so the resume can be written in normal sentence case (easier to read in the resume view and for recruiters). ✅ Done.
- ⬜ **Graduation year:** many resume guides suggest omitting it. Your call.
- ⬜ **Projects section:** link this repo itself — it's a nice portfolio piece.

## 5. Repo housekeeping

| | Item |
|---|---|
| ✅ | README rewritten around *your* resume: live link, controls, how to edit |
| ✅ | `TEMPLATES.js` moved to `examples/` (it was never loaded); later replaced by `examples/resume.template.md` |
| ✅ | **Resume in markdown:** `resume.md` is the single source for the games and resume view; commented template in `examples/`; CI validates the format; `?resume=` preview |
| ✅ | GitHub Action: syntax-checks all JS and lints HTML on every push/PR |
| ⬜ | Add a gameplay GIF to the README |

## 6. Ideas for later

- Sound effects (WebAudio blips, muted by default)
- High score in `localStorage`
- Konami code easter egg (e.g. unlocks everything instantly)
- QR code on the resume view linking back to the live page
