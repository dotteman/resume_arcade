class MazeGame extends GameEngine {
    constructor(canvas, ui) {
        super(canvas, ui);
        this.cell = 24;
        this.cols = 34;
        this.lives = GAME_CONFIG.difficulty.lives;
        this.clock = 0;
        this.onKeyDown = e => {
            if (e.code === 'Space' && this.gameOver) this.restart();
        };
        this.onPointerDown = p => {
            if (this.gameOver) { this.restart(); return; }
            const world = this.unproject(p.x, p.y);
            const target = { x: Math.round(world.x), y: Math.round(world.y) };
            this.route = this.path(this.player, target);
        };
        this.loadSection();
    }

    loadSection() {
        this.walls = [];
        this.solid = new Set();
        this.tokens = [];
        let row = 3;
        this.currentSection().lines.forEach(line => {
            let x = 3;
            line.text.split(/\s+/).filter(Boolean).forEach(word => {
                const span = Math.min(27, Math.ceil(word.length * 0.58) + 1);
                if (x + span > this.cols - 3) { x = 3; row += 3; }
                this.walls.push({ x: x - 0.5, y: row - 0.5, w: span, word, line });
                for (let i = x; i < x + span; i++) this.solid.add(`${i},${row}`);
                this.tokens.push({ x: x + Math.floor((span - 1) / 2), y: row + 1, line, taken: false });
                x += span + 2;
            });
            row += 3;
        });
        this.rows = row + 1;
        this.player = { x: 1, y: 1, color: '#ffff78' };
        this.enemies = [
            { x: this.cols - 2, y: this.rows - 2, color: '#ff58ae' },
            { x: 1, y: this.rows - 2, color: '#aa80ff' }
        ];
        this.camera = { x: this.cols / 2, y: 0 };
        this.updateCamera(1);
        this.route = [];
        this.invincible = 150;
        this.gameOver = false;
    }

    restart() {
        this.lives = GAME_CONFIG.difficulty.lives;
        this.banner = null;
        this.loadSection();
    }

    walkable(x, y) {
        return x >= 1 && x < this.cols - 1 && y >= 1 && y < this.rows - 1 && !this.solid.has(`${x},${y}`);
    }

    path(from, to) {
        const start = { x: Math.round(from.x), y: Math.round(from.y) };
        if (!this.walkable(to.x, to.y)) return [];
        const queue = [start];
        const visited = new Map([[`${start.x},${start.y}`, null]]);
        for (let i = 0; i < queue.length; i++) {
            const p = queue[i];
            if (p.x === to.x && p.y === to.y) {
                const result = [];
                let current = p;
                while (current) {
                    result.push(current);
                    current = visited.get(`${current.x},${current.y}`);
                }
                const route = result.reverse();
                return Math.hypot(from.x - start.x, from.y - start.y) > 0.01 ? route : route.slice(1);
            }
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const next = { x: p.x + dx, y: p.y + dy };
                const key = `${next.x},${next.y}`;
                if (this.walkable(next.x, next.y) && !visited.has(key)) {
                    visited.set(key, p);
                    queue.push(next);
                }
            }
        }
        return [];
    }

    move(actor, dx, dy) {
        const r = 0.28;
        const fits = (x, y) => [-r, r].every(ox => [-r, r].every(oy =>
            this.walkable(Math.round(x + ox), Math.round(y + oy))));
        if (fits(actor.x + dx, actor.y)) actor.x += dx;
        if (fits(actor.x, actor.y + dy)) actor.y += dy;
    }

    follow(actor, route, speed) {
        let budget = speed;
        while (route.length && budget > 0) {
            const next = route[0];
            const distance = Math.hypot(next.x - actor.x, next.y - actor.y);
            if (distance <= budget) {
                this.move(actor, next.x - actor.x, next.y - actor.y);
                budget -= distance;
                route.shift();
            } else {
                this.move(actor, (next.x - actor.x) / distance * budget, (next.y - actor.y) / distance * budget);
                break;
            }
        }
    }

    update(dt) {
        if (this.frozen || this.gameOver) return;
        this.clock += dt;
        this.invincible = Math.max(0, this.invincible - dt);
        let dx = Number(!!this.keyRight()) - Number(!!this.keyLeft());
        let dy = Number(!!(this.keys.ArrowDown || this.keys.KeyS)) - Number(!!this.keyUp());
        if (dx || dy) {
            this.route = [];
            const length = Math.hypot(dx, dy);
            this.move(this.player, dx / length * 0.105 * dt, dy / length * 0.105 * dt);
        } else {
            this.follow(this.player, this.route, 0.105 * dt);
        }
        this.updateCamera(Math.min(1, dt * 0.1));
        for (const token of this.tokens) {
            if (!token.taken && Math.hypot(token.x - this.player.x, token.y - this.player.y) < 0.65) {
                token.taken = true;
                this.updateScore(25);
                this.reveal(token.line);
            }
        }
        if (this.tokens.every(token => token.taken)) {
            this.showBanner('MAZE CLEARED', this.currentSection().title, 110, () => {
                this.advanceSection();
                this.loadSection();
            });
            return;
        }
        for (const enemy of this.enemies) {
            if (!enemy.route || !enemy.route.length) {
                enemy.route = this.path(enemy, { x: Math.round(this.player.x), y: Math.round(this.player.y) });
            }
            this.follow(enemy, enemy.route, 0.046 * dt);
            if (!this.invincible && Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) < 0.65) {
                this.lives--;
                if (!this.lives) {
                    this.gameOver = true;
                    this.showBanner('CAUGHT!', this.isTouch ? 'TAP TO TRY AGAIN' : 'SPACE TO TRY AGAIN', Infinity);
                    return;
                }
                this.player.x = 1;
                this.player.y = 1;
                this.route = [];
                this.invincible = 180;
                this.enemies.forEach(e => { e.route = []; });
            }
        }
    }

    get zoom() { return Math.min(1.2, this.width / ((this.cols + 7) * this.cell)); }

    updateCamera(blend) {
        const visibleRows = (this.height - 100) / (this.cell * this.zoom * 0.74);
        const half = Math.max(1, visibleRows / 2);
        const target = visibleRows >= this.rows ? this.rows / 2
            : Math.max(half, Math.min(this.rows - half, this.player.y));
        this.camera.y += (target - this.camera.y) * blend;
        this.camera.x = this.cols / 2 + (this.rows / 2 - this.camera.y) * 0.28;
    }

    project(x, y, z = 0) {
        const s = this.cell * this.zoom;
        const dx = x - this.camera.x;
        const dy = y - this.camera.y;
        return { x: this.width / 2 + (dx + dy * 0.28) * s, y: this.height * 0.48 + (dy * 0.74 - z) * s };
    }

    unproject(x, y) {
        const s = this.cell * this.zoom;
        const dy = (y - this.height * 0.48) / (s * 0.74);
        return { x: this.camera.x + (x - this.width / 2) / s - dy * 0.28, y: this.camera.y + dy };
    }

    clear() {
        this.ctx.fillStyle = '#040b18';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    polygon(points, fill, stroke) {
        const ctx = this.ctx;
        ctx.beginPath();
        points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    }

    drawWord(wall) {
        const ctx = this.ctx;
        const p = this.project(wall.x, wall.y + 0.65);
        const s = this.cell * this.zoom;
        const color = this.colorForLine(wall.line);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.transform(1, 0, 0.28 / 0.74, 0.74, 0, 0);
        ctx.font = `bold ${s * 0.9}px "VT323", monospace`;
        ctx.textBaseline = 'alphabetic';
        const width = ctx.measureText(wall.word).width;
        ctx.scale((wall.w * s - s * 0.15) / width, 1);
        ctx.fillStyle = '#000711';
        ctx.fillText(wall.word, s * 0.13, s * 0.22);
        for (let depth = 0; depth < 13; depth++) {
            ctx.fillStyle = depth < 8 ? '#16335a' : '#28567e';
            ctx.fillText(wall.word, 0, -depth * s * 0.035);
        }
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.fillText(wall.word, 0, -13 * s * 0.035);
        ctx.restore();
    }

    drawCharacter(actor, player) {
        const ctx = this.ctx;
        const p = this.project(actor.x, actor.y);
        const r = this.cell * this.zoom * 0.31;
        ctx.save();
        ctx.fillStyle = '#0008';
        ctx.beginPath();
        ctx.ellipse(p.x + 3, p.y + 4, r * 1.3, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = player && this.invincible && Math.floor(this.clock / 7) % 2 ? 0.35 : 1;
        const gradient = ctx.createRadialGradient(p.x - r * 0.3, p.y - r, 1, p.x, p.y - r * 0.5, r * 1.4);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, actor.color);
        gradient.addColorStop(1, player ? '#ae7900' : '#532861');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y - r * 0.65 + Math.sin(this.clock * 0.15) * r * 0.1, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10152a';
        ctx.fillRect(p.x - r * 0.5, p.y - r, r * 0.25, r * 0.4);
        ctx.fillRect(p.x + r * 0.2, p.y - r, r * 0.25, r * 0.4);
        ctx.restore();
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();
        this.polygon([[0, 0], [this.cols - 1, 0], [this.cols - 1, this.rows - 1], [0, this.rows - 1]].map(([x, y]) => this.project(x, y)), '#0a172b', '#387791');
        ctx.strokeStyle = '#162c43';
        for (let x = 0; x < this.cols; x++) {
            const a = this.project(x, 0), b = this.project(x, this.rows - 1);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (let y = 0; y < this.rows; y++) {
            const a = this.project(0, y), b = this.project(this.cols - 1, y);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (const token of this.tokens) {
            if (token.taken) continue;
            const p = this.project(token.x, token.y, 0.12);
            if (p.y < 25 || p.y > this.height + 30) continue;
            const r = 3 * this.zoom;
            this.polygon([{ x: p.x, y: p.y - r }, { x: p.x + r, y: p.y }, { x: p.x, y: p.y + r }, { x: p.x - r, y: p.y }], '#b5ffff');
        }
        const objects = [
            ...this.walls.map(w => ({ y: w.y + 1, draw: () => this.drawWord(w) })),
            ...this.enemies.map(e => ({ y: e.y, draw: () => this.drawCharacter(e, false) })),
            { y: this.player.y, draw: () => this.drawCharacter(this.player, true) }
        ];
        objects.sort((a, b) => a.y - b.y).forEach(o => {
            const p = this.project(0, o.y);
            if (p.y > -40 && p.y < this.height + 50) o.draw();
        });
        this.drawMap();
        ctx.font = `10px "VT323", monospace`;
        ctx.fillStyle = '#c5ffff';
        ctx.textAlign = 'left';
        ctx.fillText(`DATA ${this.tokens.filter(t => t.taken).length}/${this.tokens.length}  •  TAP A PATH TO WALK`, 10, this.height - 12);
        ctx.restore();
    }

    drawMap() {
        const ctx = this.ctx;
        const size = Math.min(2.6, 100 / this.rows, this.width / 450);
        const left = this.width - this.cols * size - 12;
        const top = 34;
        ctx.fillStyle = '#020711dd';
        ctx.fillRect(left - 4, top - 4, this.cols * size + 8, this.rows * size + 8);
        ctx.fillStyle = '#43849a';
        this.walls.forEach(w => ctx.fillRect(left + (w.x + 0.5) * size, top + (w.y + 0.5) * size, w.w * size, size));
        this.tokens.filter(t => !t.taken).forEach(t => {
            ctx.fillStyle = '#9fffff';
            ctx.fillRect(left + t.x * size, top + t.y * size, size, size);
        });
        [...this.enemies, this.player].forEach(a => {
            ctx.fillStyle = a.color;
            ctx.fillRect(left + a.x * size - 1, top + a.y * size - 1, 3, 3);
        });
    }
}
