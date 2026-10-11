// ============================================
// GAME ENGINE - shared base for every game
// ============================================
// Handles: HiDPI canvas sizing, frame-rate independent loop (dt = 1.0 at 60 fps),
// keyboard + pointer/touch input, pause, banners, particles, HUD, and the
// "reveal" hook that unlocks resume lines in the side panel.

const FONT = '"Press Start 2P", monospace';

const ArcadeAudio = {
    enabled: true,
    context: null,
    voices: new Set(),
    lastHit: -Infinity,
    sounds: {
        select: [[440, 440, 0.07, 0], [880, 880, 0.1, 0.08]],
        jump: [[180, 950, 0.22, 0]],
        land: [[140, 65, 0.08, 0]],
        hit: [[900, 1300, 0.06, 0], [1500, 1500, 0.06, 0.06]],
        fire: [[620, 110, 0.08, 0]],
        hurt: [[180, 55, 0.28, 0]],
        over: [[330, 300, 0.16, 0], [260, 230, 0.16, 0.18], [196, 90, 0.4, 0.36]],
        win: [[523, 523, 0.1, 0], [659, 659, 0.1, 0.12], [784, 784, 0.1, 0.24], [1047, 1047, 0.3, 0.36]]
    },

    unlock() {
        if (!this.enabled || this.context) return;
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        try { this.context = new Audio(); } catch (_) { return; }
    },

    stop() {
        this.voices.forEach(voice => voice.stop());
        this.voices.clear();
    },

    async play(name) {
        if (!this.enabled || !this.context || document.hidden) return;
        const ctx = this.context;
        if (ctx.state === 'suspended') {
            try { await ctx.resume(); } catch (_) { return; }
        }
        if (!this.enabled || ctx.state !== 'running' || document.hidden) return;
        const now = ctx.currentTime;
        if (name === 'hit') {
            if (now - this.lastHit < 0.055) return;
            this.lastHit = now;
        }
        this.sounds[name].forEach(([frequency, end, duration, delay]) => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = name === 'hurt' || name === 'over' ? 'sawtooth' : 'square';
            oscillator.frequency.setValueAtTime(frequency, now + delay);
            oscillator.frequency.exponentialRampToValueAtTime(end, now + delay + duration);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.035, now + delay + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            this.voices.add(oscillator);
            oscillator.onended = () => {
                this.voices.delete(oscillator);
                oscillator.disconnect();
                gain.disconnect();
            };
            oscillator.start(now + delay);
            oscillator.stop(now + delay + duration + 0.01);
        });
    }
};

class GameEngine {
    constructor(canvas, ui) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = ui;
        this.sections = ui.sections;
        this.theme = GAME_CONFIG.theme;
        this.palette = [this.theme.primary, this.theme.secondary, this.theme.accent, this.theme.warning];

        this.keys = {};
        this.pointers = new Map();      // active pointers (touch / pen / pressed mouse)
        this.mouse = null;              // last mouse position over the canvas
        this.score = 0;
        this.hits = 0;
        this.particles = [];
        this.banner = null;
        this.paused = false;
        this.running = true;
        this.width = 0;
        this.height = 0;
        this.dpr = 1;
        this.isTouch = window.matchMedia('(pointer: coarse)').matches;
        this.sectionIndex = ui.firstIncompleteSection();
        this.abort = new AbortController();

        this.setupCanvas();
        this.setupInput();
        this.ui.setScore(0, 0);
    }

    // ---------- canvas ----------
    setupCanvas() {
        const resize = () => {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 3);
            const w = Math.max(1, Math.round(rect.width));
            const h = Math.max(1, Math.round(rect.height));
            if (w === this.width && h === this.height && dpr === this.dpr) return;
            this.width = w;
            this.height = h;
            this.dpr = dpr;
            this.canvas.width = Math.round(w * dpr);
            this.canvas.height = Math.round(h * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (this.onResize) this.onResize();
        };
        this.resizeObserver = new ResizeObserver(resize);
        this.resizeObserver.observe(this.canvas);
        resize();
    }

    // ---------- input ----------
    setupInput() {
        const opts = { signal: this.abort.signal };
        const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];

        window.addEventListener('keydown', (e) => {
            if (this.ui.modalOpen) return;
            if (gameKeys.includes(e.code)) e.preventDefault();
            this.keys[e.code] = true;
            if (!this.paused && this.onKeyDown) this.onKeyDown(e);
        }, opts);
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; }, opts);
        window.addEventListener('blur', () => { this.keys = {}; this.pointers.clear(); }, opts);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && !this.paused) this.togglePause();
        }, opts);

        const pos = (e) => {
            const r = this.canvas.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top, type: e.pointerType };
        };
        this.canvas.addEventListener('pointerdown', (e) => {
            this.canvas.focus({ preventScroll: true });
            const p = pos(e);
            this.pointers.set(e.pointerId, p);
            if (e.pointerType === 'mouse') this.mouse = p;
            try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
            if (this.paused) { this.togglePause(); return; }
            if (this.onPointerDown) this.onPointerDown(p);
        }, opts);
        this.canvas.addEventListener('pointermove', (e) => {
            const p = pos(e);
            if (e.pointerType === 'mouse') this.mouse = p;
            if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, p);
        }, opts);
        const up = (e) => this.pointers.delete(e.pointerId);
        this.canvas.addEventListener('pointerup', up, opts);
        this.canvas.addEventListener('pointercancel', up, opts);
        this.canvas.addEventListener('pointerleave', (e) => {
            if (e.pointerType === 'mouse') this.mouse = null;
        }, opts);
    }

    keyLeft() { return this.keys.ArrowLeft || this.keys.KeyA; }
    keyRight() { return this.keys.ArrowRight || this.keys.KeyD; }
    keyUp() { return this.keys.ArrowUp || this.keys.KeyW; }
    keyFire() { return this.keys.Space; }

    // ---------- loop ----------
    start() {
        let last = performance.now();
        const tick = (t) => {
            if (!this.running) return;
            const dt = Math.min(Math.max((t - last) / (1000 / 60), 0), 3);
            last = t;
            if (!this.paused) {
                if (this.banner && this.banner.time !== Infinity) {
                    this.banner.time -= dt;
                    if (this.banner.time <= 0) {
                        const b = this.banner;
                        this.banner = null;
                        if (b.onDone) b.onDone();
                    }
                }
                if (this.update) this.update(dt);
                this.updateParticles(dt);
            }
            this.clear();
            if (this.draw) this.draw();
            this.drawParticles();
            this.drawHud();
            this.drawBanner();
            if (this.paused) this.drawCenterText('PAUSED', this.isTouch ? 'TAP TO RESUME' : 'P TO RESUME');
            this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
    }

    destroy() {
        this.running = false;
        ArcadeAudio.stop();
        cancelAnimationFrame(this.raf);
        this.abort.abort();
        this.resizeObserver.disconnect();
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) ArcadeAudio.stop();
        this.keys = {};
        this.ui.onPauseChanged(this.paused);
    }

    // Gameplay freezes during level-transition banners
    get frozen() { return this.paused || (this.banner && this.banner.freeze); }

    clear() {
        this.ctx.fillStyle = 'rgba(0, 10, 10, 0.35)';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // ---------- resume progress ----------
    reveal(line, missed = false) {
        const res = this.ui.revealLine(line.id, missed);
        if (res.complete) {
            this.showBanner('RESUME COMPLETE!', 'PRESS R TO READ IT ALL', 200, null, false);
        }
        return res.isNew;
    }

    updateScore(points) {
        ArcadeAudio.play('hit');
        this.score += points;
        this.hits++;
        this.ui.setScore(this.score, this.hits);
    }

    currentSection() { return this.sections[this.sectionIndex]; }

    advanceSection() {
        this.sectionIndex = (this.sectionIndex + 1) % this.sections.length;
        return this.sectionIndex;
    }

    colorForLine(line) {
        const section = this.sections[line.section];
        return this.palette[section.lines.indexOf(line) % this.palette.length];
    }

    // ---------- banners & text ----------
    showBanner(text, sub = '', frames = 90, onDone = null, freeze = true) {
        if (text.includes('CLEARED') || text.includes('COMPLETE')) ArcadeAudio.play('win');
        if (text === 'GAME OVER' || text === 'CAUGHT!') ArcadeAudio.play('over');
        this.banner = { text, sub, time: frames, onDone, freeze };
    }

    drawBanner() {
        if (!this.banner) return;
        this.drawCenterText(this.banner.text, this.banner.sub);
    }

    drawCenterText(text, sub) {
        const ctx = this.ctx;
        const size = this.fitFont(text, 22, this.width * 0.9);
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, this.height / 2 - size * 2.2, this.width, size * 4.4 + (sub ? 14 : 0));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${size}px ${FONT}`;
        ctx.shadowColor = this.theme.secondary;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.theme.secondary;
        ctx.fillText(text, this.width / 2, this.height / 2 - (sub ? size * 0.6 : 0));
        if (sub) {
            const subSize = this.fitFont(sub, 11, this.width * 0.9);
            ctx.font = `${subSize}px ${FONT}`;
            ctx.shadowColor = this.theme.warning;
            ctx.fillStyle = this.theme.warning;
            ctx.fillText(sub, this.width / 2, this.height / 2 + size * 1.1);
        }
        ctx.restore();
    }

    // Largest font size <= max that fits text in width
    fitFont(text, max, width, min = 6) {
        let size = max;
        this.ctx.font = `${size}px ${FONT}`;
        while (size > min && this.ctx.measureText(text).width > width) {
            size--;
            this.ctx.font = `${size}px ${FONT}`;
        }
        return size;
    }

    drawHud() {
        const ctx = this.ctx;
        const section = this.currentSection();
        if (!section) return;
        ctx.save();
        ctx.textBaseline = 'top';
        ctx.shadowBlur = 0;
        const label = `${this.sectionIndex + 1}/${this.sections.length} ${section.title}`;
        const size = this.fitFont(label, 10, this.width * 0.6);
        ctx.font = `${size}px ${FONT}`;
        ctx.fillStyle = this.theme.warning;
        ctx.textAlign = 'left';
        ctx.fillText(label, 10, 10);
        if (typeof this.lives === 'number') {
            ctx.fillStyle = this.theme.primary;
            for (let i = 0; i < this.lives; i++) {
                ctx.fillRect(this.width - 18 - i * 16, 10, 10, 10);
            }
        }
        ctx.restore();
    }

    // ---------- particles ----------
    createParticles(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                life: 1,
                gravity: 0.2,
                color
            });
        }
    }

    updateParticles(dt) {
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity ?? 0.2) * dt;
            p.life -= 0.02 * dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);
    }

    drawParticles() {
        const ctx = this.ctx;
        ctx.save();
        ctx.shadowBlur = 8;
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(p.life, 0);
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.restore();
    }
}

// Registry used by the start screen
const GAMES = {
    invaders: {
        title: 'RESUME INVADERS',
        key: '1',
        create: (c, ui) => new InvadersGame(c, ui),
        help: '◄ ► / A D MOVE • SPACE FIRE (HOLD) • TOUCH: DRAG + AUTO-FIRE',
        blurb: 'SHOOT THE LETTERS TO UNLOCK EACH LINE'
    },
    breakout: {
        title: 'RESUME BREAKOUT',
        key: '2',
        create: (c, ui) => new BreakoutGame(c, ui),
        help: '◄ ► / MOUSE MOVE • SPACE LAUNCH • TOUCH: DRAG PADDLE',
        blurb: 'BREAK THE WORDS, ONE SECTION PER LEVEL'
    },
    asteroids: {
        title: 'RESUME ASTEROIDS',
        key: '3',
        create: (c, ui) => new AsteroidsGame(c, ui),
        help: '◄ ► ROTATE • ▲ THRUST • SPACE FIRE • TOUCH: L/R ROTATE, MIDDLE THRUST',
        blurb: 'BLAST THE FLOATING WORDS'
    },
    maze: {
        title: 'RESUME MAZE',
        key: '4',
        create: (c, ui) => new MazeGame(c, ui),
        help: 'ARROWS / WASD MOVE • SPACE JUMP • CLICK OR TAP A PATH • COLLECT DATA, AVOID THE CHASERS',
        blurb: 'EXPLORE A 3D WORLD BUILT FROM MY RESUME'
    }
};
