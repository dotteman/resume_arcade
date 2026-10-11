// ============================================
// INVADERS - each resume section arrives as a wave of letters
// ============================================

class InvadersGame extends GameEngine {
    constructor(canvas, ui) {
        super(canvas, ui);
        const d = GAME_CONFIG.difficulty;

        this.player = { x: 0, y: 0, w: 36, h: 24, speed: d.playerSpeed };
        this.bullets = [];
        this.letters = [];        // letters still in formation
        this.falling = [];        // letters that were hit and are tumbling away
        this.cooldown = 0;
        this.formation = { x: 0, y: 0, w: 0, h: 0, phase: 0 };
        this.waveOver = false;

        this.onResize = () => this.layout();
        this.onKeyDown = (e) => { if (e.code === 'Space' && !e.repeat) this.shoot(); };
        this.onPointerDown = (p) => { if (p.type === 'mouse') this.shoot(); };

        this.layout();
        this.loadSection(this.sectionIndex);
    }

    layout() {
        this.player.x = Math.max(0, Math.min(this.width - this.player.w,
            this.playerPlaced ? this.player.x : (this.width - this.player.w) / 2));
        this.playerPlaced = true;
        this.player.y = this.height - this.player.h - 16;
        if (this.letters.length) this.layoutLetters();
    }

    // ---------- waves ----------
    loadSection(index) {
        const section = this.sections[index];
        this.waveLines = section.lines.map(line => ({ line, chars: line.text, color: this.colorForLine(line) }));
        // Expand lines into individual letter objects
        this.letters = [];
        this.waveLines.forEach(l => {
            [...l.chars].forEach((ch, i) => {
                if (ch !== ' ') this.letters.push({ ch, i, line: l.line, color: l.color, rx: 0, ry: 0 });
            });
        });
        this.layoutLetters();
        this.formation.y = -this.formation.h - 20;
        this.formation.phase = 0;
        this.waveOver = false;
    }

    // Word-wrap each resume line to the screen width; shrink font to fit.
    layoutLetters() {
        const maxW = this.width * 0.9;
        const maxH = this.height * 0.5;
        let font = 16;
        let placed;
        for (; font >= 8; font--) {
            const cell = font * 1.2;
            const rowH = font * 2;
            const perRow = Math.max(1, Math.floor(maxW / cell));
            placed = [];
            let row = 0;
            let widest = 0;
            this.waveLines.forEach(l => {
                // word-wrap: list of [startIndex, endIndex) chunks
                const words = [];
                l.chars.replace(/\S+/g, (w, at) => { words.push([at, at + w.length]); return w; });
                let lineStart = null;
                let lastEnd = 0;
                const chunks = [];
                words.forEach(([s, e]) => {
                    if (lineStart === null) { lineStart = s; lastEnd = e; return; }
                    if (e - lineStart > perRow) { chunks.push([lineStart, lastEnd]); lineStart = s; }
                    lastEnd = e;
                });
                if (lineStart !== null) chunks.push([lineStart, lastEnd]);
                chunks.forEach(([s, e]) => {
                    placed.push({ line: l.line, s, e, row, width: (e - s) * cell });
                    widest = Math.max(widest, (e - s) * cell);
                    row++;
                });
            });
            this.cell = cell;
            this.rowH = rowH;
            this.font = font;
            this.formation.w = widest;
            this.formation.h = row * rowH;
            if (this.formation.h <= maxH && widest <= maxW) break;
        }

        for (const letter of this.letters) {
            const chunk = placed.find(c => c.line === letter.line && letter.i >= c.s && letter.i < c.e);
            if (!chunk) continue;
            letter.rx = (this.formation.w - chunk.width) / 2 + (letter.i - chunk.s) * this.cell;
            letter.ry = chunk.row * this.rowH;
        }
    }

    shoot() {
        if (this.frozen || this.cooldown > 0 || this.bullets.length >= 6) return;
        ArcadeAudio.play('fire');
        this.bullets.push({
            x: this.player.x + this.player.w / 2 - 2,
            y: this.player.y,
            w: 4,
            h: 14,
            dead: false
        });
        this.cooldown = 9;
    }

    // ---------- update ----------
    update(dt) {
        this.updateFalling(dt);
        if (this.frozen) return;

        this.cooldown -= dt;
        this.movePlayer(dt);
        if (this.keyFire() || [...this.pointers.values()].some(p => p.type !== 'mouse')) this.shoot();

        // Formation: quick entry, then a slow descent with a side-to-side sway
        const f = this.formation;
        const entering = f.y + f.h < this.height * 0.3;
        const descent = Math.max(GAME_CONFIG.difficulty.letterSpeed, this.height * 0.6 / (60 * 35));
        f.y += (entering ? 4 : descent) * dt;
        f.phase += 0.015 * dt;
        const sway = Math.max(0, Math.min(40, (this.width - f.w) / 2 - 10));
        f.x = (this.width - f.w) / 2 + Math.sin(f.phase) * sway;

        // Bullets
        const speed = GAME_CONFIG.difficulty.bulletSpeed;
        for (const b of this.bullets) {
            b.y -= speed * dt;
            if (b.y < -b.h) b.dead = true;
        }

        // Collisions: each bullet can destroy at most one letter
        const size = this.font;
        for (const b of this.bullets) {
            if (b.dead) continue;
            for (const l of this.letters) {
                if (l.hit) continue;
                const lx = f.x + l.rx;
                const ly = f.y + l.ry;
                if (ly < 0) continue;
                if (b.x < lx + size && b.x + b.w > lx && b.y < ly + size && b.y + b.h > ly) {
                    b.dead = true;
                    l.hit = true;
                    this.falling.push({ ch: l.ch, x: lx, y: ly, vy: -4, rot: 0, color: this.theme.secondary });
                    this.createParticles(lx + size / 2, ly + size / 2, this.theme.secondary, 10);
                    this.updateScore(10);
                    this.reveal(l.line);
                    break;
                }
            }
        }
        this.bullets = this.bullets.filter(b => !b.dead);
        this.letters = this.letters.filter(l => !l.hit);

        if (this.waveOver) return;
        if (this.letters.length === 0) {
            this.endWave('WAVE CLEARED', this.currentSection().title);
            return;
        }
        // Lowest surviving row reached the player: wave passes, remaining lines show as "missed"
        const lowest = Math.max(...this.letters.map(l => l.ry)) + f.y + size;
        if (lowest >= this.player.y - 6) {
            const missed = new Set(this.letters.map(l => l.line));
            missed.forEach(line => this.reveal(line, true));
            this.letters.forEach(l => this.createParticles(f.x + l.rx, f.y + l.ry, this.theme.warning, 2));
            this.letters = [];
            this.endWave('WAVE PASSED', 'MISSED LINES SHOWN DIM');
        }
    }

    endWave(text, sub) {
        this.waveOver = true;
        this.bullets = [];
        this.showBanner(text, sub, 100, () => this.loadSection(this.advanceSection()));
    }

    movePlayer(dt) {
        const p = this.player;
        const touch = [...this.pointers.values()].find(q => q.type !== 'mouse');
        const target = touch ? touch.x : (this.mouse ? this.mouse.x : null);
        if (this.keyLeft()) p.x -= p.speed * dt;
        else if (this.keyRight()) p.x += p.speed * dt;
        else if (target !== null) p.x += (target - p.w / 2 - p.x) * Math.min(1, 0.3 * dt);
        p.x = Math.max(0, Math.min(this.width - p.w, p.x));
    }

    updateFalling(dt) {
        for (const l of this.falling) {
            l.vy += 0.5 * dt;
            l.y += l.vy * dt;
            l.rot += 0.2 * dt;
        }
        this.falling = this.falling.filter(l => l.y < this.height + 40);
    }

    // ---------- draw ----------
    draw() {
        const ctx = this.ctx;
        const f = this.formation;
        const size = this.font;
        ctx.save();
        ctx.font = `${size}px ${FONT}`;
        ctx.textBaseline = 'top';

        ctx.shadowBlur = 8;
        for (const l of this.letters) {
            const y = f.y + l.ry;
            if (y < -size) continue;
            ctx.shadowColor = l.color;
            ctx.fillStyle = l.color;
            ctx.fillText(l.ch, f.x + l.rx, y);
        }

        ctx.shadowBlur = 18;
        for (const l of this.falling) {
            ctx.save();
            ctx.translate(l.x + size / 2, l.y + size / 2);
            ctx.rotate(l.rot);
            ctx.shadowColor = l.color;
            ctx.fillStyle = l.color;
            ctx.fillText(l.ch, -size / 2, -size / 2);
            ctx.restore();
        }

        ctx.shadowColor = this.theme.accent;
        ctx.shadowBlur = 12;
        ctx.fillStyle = this.theme.accent;
        for (const b of this.bullets) ctx.fillRect(b.x, b.y, b.w, b.h);

        // Player ship
        const p = this.player;
        ctx.shadowColor = this.theme.primary;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.theme.primary;
        ctx.beginPath();
        ctx.moveTo(p.x + p.w / 2, p.y);
        ctx.lineTo(p.x, p.y + p.h);
        ctx.lineTo(p.x + p.w, p.y + p.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(p.x - 6, p.y + p.h - 5, 6, 5);
        ctx.fillRect(p.x + p.w, p.y + p.h - 5, 6, 5);
        ctx.restore();
    }
}
