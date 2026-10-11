// ============================================
// ASTEROIDS - resume words drift in space, one section per wave
// ============================================

class AsteroidsGame extends GameEngine {
    constructor(canvas, ui) {
        super(canvas, ui);
        const d = GAME_CONFIG.difficulty;

        this.ship = {
            x: 0, y: 0, angle: -Math.PI / 2, vx: 0, vy: 0, size: 16,
            rotationSpeed: 0.075, thrust: 0.14, friction: 0.99, invulnerable: 0, alive: true
        };
        this.maxLives = d.lives;
        this.lives = d.lives;
        this.gameOver = false;
        this.bullets = [];
        this.rocks = [];
        this.queue = [];
        this.cooldown = 0;
        this.rockFont = 14;
        this.thrusting = false;

        this.onResize = () => this.clampShip();
        this.onKeyDown = (e) => {
            if (e.code !== 'Space') return;
            if (this.gameOver) this.continueGame();
            else if (!e.repeat) this.shoot();
        };
        this.onPointerDown = () => { if (this.gameOver) this.continueGame(); };

        this.resetShip();
        this.loadSection(this.sectionIndex);
    }

    resetShip() {
        Object.assign(this.ship, {
            x: this.width / 2, y: this.height / 2, vx: 0, vy: 0,
            angle: -Math.PI / 2, invulnerable: 150, alive: true
        });
    }

    clampShip() {
        this.ship.x = Math.min(this.ship.x, this.width);
        this.ship.y = Math.min(this.ship.y, this.height);
    }

    // ---------- waves ----------
    loadSection(index) {
        const section = this.sections[index];
        this.queue = [];
        section.lines.forEach(line => {
            const color = this.colorForLine(line);
            line.text.split(' ')
                .filter(w => /[A-Z0-9]/i.test(w))          // drop "*", "-", "&", "|"
                .forEach(text => this.queue.push({ text, line, color }));
        });
        this.spawnBatch();
    }

    spawnBatch() {
        const maxRocks = this.width < 600 ? 14 : 26;
        const batch = this.queue.splice(0, maxRocks);
        this.rockFont = this.width < 600 ? 11 : 14;
        this.ctx.font = `${this.rockFont}px ${FONT}`;
        batch.forEach(w => {
            const textW = this.ctx.measureText(w.text).width;
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.35 + Math.random() * 0.8;
            const pos = this.spawnPoint();
            this.rocks.push({
                ...w,
                x: pos.x,
                y: pos.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rot: Math.random() * Math.PI * 2,
                rs: (Math.random() - 0.5) * 0.03,
                hw: Math.max(textW / 2, 12) + 4,   // generous minimum hit box
                hh: Math.max(this.rockFont / 2, 10) + 4
            });
        });
    }

    // Random point at a safe distance from the ship
    spawnPoint() {
        const minDist = Math.min(this.width, this.height) * 0.3;
        for (let tries = 0; tries < 30; tries++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            if (Math.hypot(x - this.ship.x, y - this.ship.y) > minDist) return { x, y };
        }
        return { x: Math.random() * this.width, y: 30 };
    }

    // Is point (px, py) inside the rock's rotated text box (+pad)?
    hitsRock(rock, px, py, pad = 0) {
        const dx = px - rock.x;
        const dy = py - rock.y;
        const c = Math.cos(-rock.rot);
        const s = Math.sin(-rock.rot);
        const lx = dx * c - dy * s;
        const ly = dx * s + dy * c;
        return Math.abs(lx) < rock.hw + pad && Math.abs(ly) < rock.hh + pad;
    }

    shoot() {
        if (this.frozen || this.gameOver || !this.ship.alive || this.cooldown > 0 || this.bullets.length >= 8) return;
        ArcadeAudio.play('fire');
        const s = this.ship;
        const speed = GAME_CONFIG.difficulty.bulletSpeed;
        this.bullets.push({
            x: s.x + Math.cos(s.angle) * s.size,
            y: s.y + Math.sin(s.angle) * s.size,
            vx: Math.cos(s.angle) * speed + s.vx,
            vy: Math.sin(s.angle) * speed + s.vy,
            life: 55,
            dead: false
        });
        this.cooldown = 8;
    }

    continueGame() {
        this.gameOver = false;
        this.banner = null;
        this.lives = this.maxLives;
        this.resetShip();
    }

    wrap(o, m = 0) {
        if (o.x < -m) o.x = this.width + m;
        else if (o.x > this.width + m) o.x = -m;
        if (o.y < -m) o.y = this.height + m;
        else if (o.y > this.height + m) o.y = -m;
    }

    // ---------- update ----------
    update(dt) {
        // Rocks keep drifting even while a banner shows
        for (const r of this.rocks) {
            r.x += r.vx * dt;
            r.y += r.vy * dt;
            r.rot += r.rs * dt;
            this.wrap(r, r.hw);
        }
        if (this.frozen || this.gameOver) return;

        const s = this.ship;
        this.cooldown -= dt;
        if (s.invulnerable > 0) s.invulnerable -= dt;

        // Touch: left third rotates left, right third rotates right, middle thrusts; any touch fires
        let left = this.keyLeft();
        let right = this.keyRight();
        let thrust = this.keyUp();
        let fire = this.keyFire();
        for (const p of this.pointers.values()) {
            if (p.type === 'mouse') continue;
            if (p.x < this.width / 3) left = true;
            else if (p.x > this.width * 2 / 3) right = true;
            else thrust = true;
            fire = true;
        }

        if (left) s.angle -= s.rotationSpeed * dt;
        if (right) s.angle += s.rotationSpeed * dt;
        this.thrusting = thrust;
        if (thrust) {
            s.vx += Math.cos(s.angle) * s.thrust * dt;
            s.vy += Math.sin(s.angle) * s.thrust * dt;
            if (Math.random() < 0.5 * dt) {
                const a = s.angle + Math.PI;
                this.particles.push({
                    x: s.x + Math.cos(a) * s.size * 0.5,
                    y: s.y + Math.sin(a) * s.size * 0.5,
                    vx: Math.cos(a) * 2 + (Math.random() - 0.5),
                    vy: Math.sin(a) * 2 + (Math.random() - 0.5),
                    size: 2, life: 0.5, gravity: 0, color: this.theme.warning
                });
            }
        }
        if (fire) this.shoot();

        const friction = Math.pow(s.friction, dt);
        s.vx *= friction;
        s.vy *= friction;
        const maxSpeed = 7;
        const v = Math.hypot(s.vx, s.vy);
        if (v > maxSpeed) { s.vx *= maxSpeed / v; s.vy *= maxSpeed / v; }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        this.wrap(s);

        for (const b of this.bullets) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;
            this.wrap(b);
            if (b.life <= 0) b.dead = true;
        }

        // Bullet vs rock: one rock per bullet
        for (const b of this.bullets) {
            if (b.dead) continue;
            const rock = this.rocks.find(r => !r.dead && this.hitsRock(r, b.x, b.y, 2));
            if (!rock) continue;
            b.dead = true;
            rock.dead = true;
            this.createParticles(rock.x, rock.y, rock.color, 18);
            this.updateScore(rock.text.length * 5);
            this.reveal(rock.line);
        }

        // Ship vs rock
        if (s.invulnerable <= 0 && this.rocks.some(r => !r.dead && this.hitsRock(r, s.x, s.y, s.size * 0.5))) {
            this.shipDestroyed();
        }

        this.bullets = this.bullets.filter(b => !b.dead);
        this.rocks = this.rocks.filter(r => !r.dead);

        if (this.rocks.length === 0) {
            if (this.queue.length) this.spawnBatch();
            else {
                const title = this.currentSection().title;
                this.showBanner('SECTION CLEARED', title, 100, () => this.loadSection(this.advanceSection()));
            }
        }
    }

    shipDestroyed() {
        if (this.lives > 1) ArcadeAudio.play('hurt');
        const s = this.ship;
        this.createParticles(s.x, s.y, this.theme.primary, 30);
        this.lives--;
        if (this.lives <= 0) {
            s.alive = false;
            this.gameOver = true;
            this.showBanner('GAME OVER', this.isTouch ? 'TAP TO CONTINUE' : 'SPACE TO CONTINUE', Infinity);
        } else {
            this.resetShip();
        }
    }

    // ---------- draw ----------
    draw() {
        const ctx = this.ctx;
        ctx.save();
        ctx.font = `${this.rockFont}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 12;
        for (const r of this.rocks) {
            ctx.save();
            ctx.translate(r.x, r.y);
            ctx.rotate(r.rot);
            ctx.shadowColor = r.color;
            ctx.fillStyle = r.color;
            ctx.fillText(r.text, 0, 1);
            ctx.restore();
        }

        ctx.shadowColor = this.theme.accent;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.theme.accent;
        for (const b of this.bullets) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);

        // Ship (blinks while invulnerable)
        const s = this.ship;
        const blink = s.invulnerable > 0 && Math.floor(s.invulnerable / 6) % 2 === 0;
        if (s.alive && !blink) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);
            ctx.shadowColor = this.theme.primary;
            ctx.shadowBlur = 20;
            ctx.strokeStyle = this.theme.primary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(s.size, 0);
            ctx.lineTo(-s.size * 0.6, s.size * 0.6);
            ctx.lineTo(-s.size * 0.3, 0);
            ctx.lineTo(-s.size * 0.6, -s.size * 0.6);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        // Touch zone hints
        if (this.isTouch) {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = this.theme.primary;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.moveTo(this.width / 3, this.height - 60);
            ctx.lineTo(this.width / 3, this.height);
            ctx.moveTo(this.width * 2 / 3, this.height - 60);
            ctx.lineTo(this.width * 2 / 3, this.height);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 0.5;
            ctx.font = `10px ${FONT}`;
            ctx.fillStyle = this.theme.primary;
            ctx.fillText('ROTATE <', this.width / 6, this.height - 20);
            ctx.fillText('THRUST', this.width / 2, this.height - 20);
            ctx.fillText('> ROTATE', this.width * 5 / 6, this.height - 20);
        }
        ctx.restore();
    }
}
