// ============================================
// BREAKOUT - one brick per word, one resume section per level
// ============================================

class BreakoutGame extends GameEngine {
    constructor(canvas, ui) {
        super(canvas, ui);
        const d = GAME_CONFIG.difficulty;

        this.paddle = { x: 0, y: 0, w: 110, h: 14, speed: d.playerSpeed };
        this.ball = { x: 0, y: 0, r: 7, vx: 0, vy: 0, stuck: true, launchTimer: 90 };
        this.baseSpeed = d.ballSpeed;
        this.maxLives = d.lives;
        this.lives = d.lives;
        this.levelsCleared = 0;
        this.gameOver = false;
        this.bricks = [];

        this.onResize = () => this.layout();
        this.onKeyDown = (e) => {
            if (e.code === 'Space') this.gameOver ? this.continueGame() : this.launch();
        };
        this.onPointerDown = () => (this.gameOver ? this.continueGame() : this.launch());

        this.loadSection(this.sectionIndex);
        this.layout();
    }

    get speed() {
        return this.baseSpeed * Math.min(1 + this.levelsCleared * 0.06, 1.5);
    }

    // ---------- level setup ----------
    loadSection(index) {
        const section = this.sections[index];
        this.bricks = [];
        section.lines.forEach(line => {
            const color = this.colorForLine(line);
            line.text.split(' ').filter(Boolean).forEach(word => {
                this.bricks.push({ word, line, color, alive: true, x: 0, y: 0, w: 0, h: 0 });
            });
        });
        this.layoutBricks();
        this.resetBall();
    }

    layout() {
        this.paddle.w = Math.max(70, Math.min(130, this.width * 0.14));
        this.paddle.y = this.height - 30;
        if (!this.paddlePlaced) {
            this.paddle.x = (this.width - this.paddle.w) / 2;
            this.paddlePlaced = true;
        }
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, this.paddle.x));
        this.layoutBricks();
        if (this.ball.stuck) this.stickBall();
    }

    // Wrap word-bricks into rows (each resume line starts a new row) and
    // shrink the font until the whole section fits in the top ~55% of the screen.
    layoutBricks() {
        if (!this.bricks.length || !this.width) return;
        const margin = 16;
        const gap = 4;
        const top = 34;
        const maxWidth = this.width - margin * 2;
        const maxHeight = this.height * 0.55;

        let font = 14;
        let rows;
        for (; font >= 6; font--) {
            this.ctx.font = `${font}px ${FONT}`;
            const h = font + 12;
            rows = [];
            let row = null;
            let lastLine = null;
            this.bricks.forEach(b => {
                b.w = Math.min(this.ctx.measureText(b.word).width + 14, maxWidth);
                b.h = h;
                const rowWidth = row ? row.width + gap + b.w : b.w;
                if (!row || b.line !== lastLine || rowWidth > maxWidth) {
                    row = { items: [b], width: b.w };
                    rows.push(row);
                } else {
                    row.items.push(b);
                    row.width = rowWidth;
                }
                lastLine = b.line;
            });
            if (rows.length * (h + gap) <= maxHeight) break;
        }
        this.brickFont = Math.max(font, 6);

        rows.forEach((row, ri) => {
            let x = (this.width - row.width) / 2;
            row.items.forEach(b => {
                b.x = x;
                b.y = top + ri * (b.h + gap);
                x += b.w + gap;
            });
        });
    }

    resetBall() {
        this.ball.stuck = true;
        this.ball.launchTimer = 120;
        this.stickBall();
    }

    stickBall() {
        this.ball.x = this.paddle.x + this.paddle.w / 2;
        this.ball.y = this.paddle.y - this.ball.r - 1;
    }

    launch() {
        if (!this.ball.stuck || this.frozen) return;
        const angle = (-90 + (Math.random() * 50 - 25)) * Math.PI / 180;
        this.ball.vx = Math.cos(angle) * this.speed;
        this.ball.vy = Math.sin(angle) * this.speed;
        this.ball.stuck = false;
    }

    continueGame() {
        this.gameOver = false;
        this.banner = null;
        this.lives = this.maxLives;
        this.resetBall();
    }

    // ---------- update ----------
    update(dt) {
        if (this.frozen || this.gameOver) return;
        this.movePaddle(dt);

        if (this.ball.stuck) {
            this.stickBall();
            this.ball.launchTimer -= dt;
            if (this.ball.launchTimer <= 0) this.launch();
            return;
        }

        // Sub-step so a fast ball never tunnels through a brick
        const travel = Math.hypot(this.ball.vx, this.ball.vy) * dt;
        const steps = Math.max(1, Math.ceil(travel / (this.ball.r * 0.75)));
        for (let i = 0; i < steps; i++) {
            if (this.stepBall(dt / steps)) break;
        }
    }

    movePaddle(dt) {
        const p = this.paddle;
        let target = null;
        const touch = [...this.pointers.values()].find(q => q.type !== 'mouse');
        if (touch) target = touch.x;
        else if (this.mouse) target = this.mouse.x;

        if (this.keyLeft()) p.x -= p.speed * dt;
        else if (this.keyRight()) p.x += p.speed * dt;
        else if (target !== null) p.x += (target - p.w / 2 - p.x) * Math.min(1, 0.35 * dt);

        p.x = Math.max(0, Math.min(this.width - p.w, p.x));
    }

    // Returns true when the step ended the rally (ball lost / level cleared)
    stepBall(dt) {
        const b = this.ball;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x + b.r > this.width) { b.x = this.width - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }

        // Paddle: bounce angle depends on where the ball lands
        const p = this.paddle;
        if (b.vy > 0 && b.y + b.r >= p.y && b.y - b.r <= p.y + p.h &&
            b.x >= p.x - b.r && b.x <= p.x + p.w + b.r) {
            const hit = Math.max(-1, Math.min(1, (b.x - (p.x + p.w / 2)) / (p.w / 2)));
            // Keep at least ~10° off vertical so the ball can't loop straight up and down forever
            let deg = hit * 60;
            if (Math.abs(deg) < 10) deg = (deg < 0 || (deg === 0 && Math.random() < 0.5) ? -10 : 10);
            let angle = deg * Math.PI / 180;

            // Endgame assist: after several bounces with no brick hit, aim at a remaining brick
            this.dryBounces = (this.dryBounces || 0) + 1;
            if (this.dryBounces >= 3) {
                const left = this.bricks.filter(br => br.alive);
                const t = left[Math.floor(Math.random() * left.length)];
                if (t) {
                    const aim = Math.atan2(t.x + t.w / 2 - b.x, b.y - (t.y + t.h / 2));
                    angle = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, aim));
                }
            }
            b.vx = Math.sin(angle) * this.speed;
            b.vy = -Math.cos(angle) * this.speed;
            b.y = p.y - b.r;
        }

        // Bricks (circle vs rect, one brick per sub-step)
        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            const cx = Math.max(brick.x, Math.min(b.x, brick.x + brick.w));
            const cy = Math.max(brick.y, Math.min(b.y, brick.y + brick.h));
            const dx = b.x - cx;
            const dy = b.y - cy;
            if (dx * dx + dy * dy > b.r * b.r) continue;

            if (cx === b.x) b.vy = dy > 0 || (dy === 0 && b.vy < 0) ? Math.abs(b.vy) : -Math.abs(b.vy);
            else if (cy === b.y) b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx);
            else { b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx); b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy); }

            this.hitBrick(brick);
            break;
        }

        if (!this.bricks.some(br => br.alive)) {
            this.levelCleared();
            return true;
        }

        if (b.y - b.r > this.height) {
            this.loseLife();
            return true;
        }
        return false;
    }

    hitBrick(brick) {
        brick.alive = false;
        this.dryBounces = 0;
        this.createParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 12);
        this.updateScore(10);
        this.reveal(brick.line);
    }

    levelCleared() {
        this.levelsCleared++;
        const title = this.currentSection().title;
        this.showBanner('SECTION CLEARED', title, 110, () => {
            this.loadSection(this.advanceSection());
        });
        this.ball.stuck = true;
        this.ball.launchTimer = Infinity;
    }

    loseLife() {
        this.lives--;
        this.createParticles(this.ball.x, this.height - 10, this.theme.secondary, 25);
        if (this.lives <= 0) {
            this.gameOver = true;
            this.ball.stuck = true;
            this.showBanner('GAME OVER', this.isTouch ? 'TAP TO CONTINUE' : 'SPACE TO CONTINUE', Infinity);
        } else {
            this.resetBall();
        }
    }

    // ---------- draw ----------
    draw() {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = `${this.brickFont || 12}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = brick.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(brick.x + 0.5, brick.y + 0.5, brick.w - 1, brick.h - 1);
            ctx.globalAlpha = 1;
            ctx.shadowColor = brick.color;
            ctx.shadowBlur = 6;
            ctx.fillText(brick.word, brick.x + brick.w / 2, brick.y + brick.h / 2 + 1);
        }

        // Paddle
        const p = this.paddle;
        ctx.shadowColor = this.theme.primary;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.theme.primary;
        ctx.fillRect(p.x, p.y, p.w, p.h);

        // Ball
        if (!this.gameOver) {
            ctx.shadowColor = this.theme.accent;
            ctx.shadowBlur = 15;
            ctx.fillStyle = this.theme.accent;
            ctx.beginPath();
            ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.ball.stuck && !this.banner && !this.gameOver) {
            ctx.shadowBlur = 0;
            ctx.font = `8px ${FONT}`;
            ctx.fillStyle = this.theme.warning;
            ctx.fillText(this.isTouch ? 'TAP TO LAUNCH' : 'SPACE TO LAUNCH', this.width / 2, p.y - 34);
        }
        ctx.restore();
    }
}
