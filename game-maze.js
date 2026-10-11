class MazeGame extends GameEngine {
    constructor(canvas, ui) {
        super(canvas, ui);
        this.cell = 24;
        this.cols = 34;
        this.lives = GAME_CONFIG.difficulty.lives;
        this.clock = 0;
        this.onKeyDown = e => {
            if (e.code !== 'Space' || e.repeat) return;
            if (this.gameOver) { this.restart(); return; }
            if (!this.frozen && this.player.height === 0) {
                this.player.jumpVelocity = 0.115;
                ArcadeAudio.play('jump');
            }
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
                for (let column = x; column < x + span; column += 2) {
                    this.tokens.push({ x: column, y: row + 1, line, taken: false });
                }
                x += span + 2;
            });
            row += 3;
        });
        this.rows = row + 1;
        this.player = { x: 1, y: 1, color: '#ffff78', height: 0, jumpVelocity: 0 };
        this.enemies = [
            { type: 'robot', x: this.cols - 2, y: this.rows - 2, color: '#ef9b46', speed: 0.035 },
            { type: 'cracked', x: 1, y: this.rows - 2, color: '#ba73ff', speed: 0.052 },
            { type: 'steel', x: this.cols - 2, y: 1, color: '#7beaff', speed: 0.04 }
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
        const oldX = actor.x, oldY = actor.y;
        if (fits(actor.x + dx, actor.y)) actor.x += dx;
        if (fits(actor.x, actor.y + dy)) actor.y += dy;
        const travelX = actor.x - oldX, travelY = actor.y - oldY;
        const distance = Math.hypot(travelX, travelY);
        if (distance > 0) {
            actor.travel = (actor.travel || 0) + distance;
            const angle = distance / 0.36 / 2;
            const ax = -travelY / distance * Math.sin(angle);
            const ay = travelX / distance * Math.sin(angle);
            const aw = Math.cos(angle);
            const [x, y, z, w] = actor.roll || [0, 0, 0, 1];
            const roll = [ax * w + aw * x + ay * z, ay * w + aw * y - ax * z,
                aw * z + ax * y - ay * x, aw * w - ax * x - ay * y];
            const length = Math.hypot(...roll);
            actor.roll = roll.map(value => value / length);
        }
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
        if (this.player.jumpVelocity || this.player.height) {
            this.player.height = Math.max(0, this.player.height + this.player.jumpVelocity * dt - 0.0022 * dt * dt);
            this.player.jumpVelocity -= 0.0044 * dt;
            if (this.player.height === 0) {
                this.player.jumpVelocity = 0;
                ArcadeAudio.play('land');
            }
        }
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
                let target = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
                if (enemy.type === 'robot' && Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) > 8) {
                    const patrol = [{ x: 1, y: this.rows - 2 }, { x: 1, y: 1 },
                        { x: this.cols - 2, y: 1 }, { x: this.cols - 2, y: this.rows - 2 }];
                    enemy.patrolIndex = enemy.patrolIndex || 0;
                    target = patrol[enemy.patrolIndex];
                    if (Math.hypot(enemy.x - target.x, enemy.y - target.y) < 0.1) {
                        enemy.patrolIndex = (enemy.patrolIndex + 1) % patrol.length;
                        target = patrol[enemy.patrolIndex];
                    }
                }
                enemy.route = this.path(enemy, target);
            }
            this.follow(enemy, enemy.route, enemy.speed * dt);
            const distance = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
            if (enemy.type === 'steel' && !this.invincible && this.player.height === 0 && distance > 0.05 && distance < 4.2) {
                const strength = 1 - distance / 4.2;
                const pull = 0.04 * strength * strength * dt;
                this.move(this.player, (enemy.x - this.player.x) / distance * pull, (enemy.y - this.player.y) / distance * pull);
            }
            const caught = enemy.type === 'robot'
                ? distance < 0.7 && this.player.height < 1.05
                : Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y, this.player.height) < 0.65;
            if (!this.invincible && caught) {
                this.lives--;
                if (!this.lives) {
                    this.gameOver = true;
                    this.showBanner('CAUGHT!', this.isTouch ? 'TAP TO TRY AGAIN' : 'SPACE TO TRY AGAIN', Infinity);
                    return;
                }
                ArcadeAudio.play('hurt');
                this.player.x = 1;
                this.player.y = 1;
                this.player.height = 0;
                this.player.jumpVelocity = 0;
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
        const s = this.cell * this.zoom;
        if (!wall.sprite || wall.spriteScale !== s || wall.spriteDpr !== this.dpr) {
            const mask = document.createElement('canvas');
            const ink = mask.getContext('2d');
            ink.font = '900 18px Arial Black, Arial, sans-serif';
            mask.width = Math.ceil(ink.measureText(wall.word).width) + 4;
            mask.height = 22;
            ink.font = '900 18px Arial Black, Arial, sans-serif';
            ink.lineWidth = 0.8;
            ink.strokeText(wall.word, 2, 18);
            ink.fillText(wall.word, 2, 18);
            const pixels = ink.getImageData(0, 0, mask.width, mask.height).data;
            const occupied = (x, y) => x >= 0 && y >= 0 && x < mask.width && y < mask.height
                && pixels[(y * mask.width + x) * 4 + 3] > 110;
            const height = 1.15;
            const margin = 5;
            const sprite = document.createElement('canvas');
            const dpr = this.dpr;
            const width = Math.ceil((wall.w + 0.6) * s + margin * 2);
            const spriteHeight = Math.ceil((height + 1) * s + margin * 2);
            sprite.width = width * dpr;
            sprite.height = spriteHeight * dpr;
            const ctx = sprite.getContext('2d');
            ctx.scale(dpr, dpr);
            const point = (x, y, z) => ({
                x: margin + (x + 0.28 * y) * s,
                y: margin + (height + 0.74 * y - z) * s
            });
            const face = points => {
                points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
                ctx.closePath();
            };
            const sx = wall.w / mask.width;
            const sy = 1 / mask.height;
            ctx.fillStyle = '#000812';
            ctx.beginPath();
            face([point(0.15, 0.25, 0), point(wall.w + 0.15, 0.25, 0),
                point(wall.w + 0.4, 1.4, 0), point(0.4, 1.4, 0)]);
            ctx.fill();
            const front = ctx.createLinearGradient(0, margin, 0, margin + height * s);
            front.addColorStop(0, '#527a96');
            front.addColorStop(1, '#21394c');
            ctx.fillStyle = front;
            ctx.beginPath();
            for (let y = 0; y < mask.height; y++) {
                for (let x = 0; x < mask.width; x++) {
                    if (!occupied(x, y) || occupied(x, y + 1)) continue;
                    const start = x;
                    while (x + 1 < mask.width && occupied(x + 1, y) && !occupied(x + 1, y + 1)) x++;
                    const left = start * sx, right = (x + 1) * sx, edge = (y + 1) * sy;
                    face([point(left, edge, 0), point(right, edge, 0),
                        point(right, edge, height), point(left, edge, height)]);
                }
            }
            ctx.fill();
            ctx.fillStyle = '#172b40';
            ctx.beginPath();
            for (let x = 0; x < mask.width; x++) {
                for (let y = 0; y < mask.height; y++) {
                    if (!occupied(x, y) || occupied(x + 1, y)) continue;
                    const start = y;
                    while (y + 1 < mask.height && occupied(x, y + 1) && !occupied(x + 1, y + 1)) y++;
                    const edge = (x + 1) * sx, back = start * sy, frontY = (y + 1) * sy;
                    face([point(edge, back, 0), point(edge, frontY, 0),
                        point(edge, frontY, height), point(edge, back, height)]);
                }
            }
            ctx.fill();
            ctx.fillStyle = this.colorForLine(wall.line);
            ctx.beginPath();
            for (let y = 0; y < mask.height; y++) {
                for (let x = 0; x < mask.width; x++) {
                    if (!occupied(x, y)) continue;
                    const start = x;
                    while (x + 1 < mask.width && occupied(x + 1, y)) x++;
                    const left = start * sx, right = (x + 1) * sx;
                    face([point(left, y * sy, height), point(right, y * sy, height),
                        point(right, (y + 1) * sy, height), point(left, (y + 1) * sy, height)]);
                }
            }
            ctx.fill();
            wall.sprite = sprite;
            wall.spriteScale = s;
            wall.spriteDpr = this.dpr;
            wall.spriteWidth = width;
            wall.spriteHeight = spriteHeight;
        }
        const p = this.project(wall.x, wall.y);
        this.ctx.drawImage(wall.sprite, p.x - 5, p.y - 5 - s * 1.15, wall.spriteWidth, wall.spriteHeight);
    }

    drawCharacter(actor, player) {
        if (actor.type === 'robot') { this.drawRobot(actor); return; }
        const ctx = this.ctx;
        const p = this.project(actor.x, actor.y);
        const r = this.cell * this.zoom * 0.36;
        const height = player ? actor.height : 0;
        const cy = p.y - r - height * this.cell * this.zoom;
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${0.65 / (1 + height)})`;
        ctx.beginPath();
        const shadowScale = 1 + height * 0.25;
        ctx.ellipse(p.x + r * 0.25, p.y + r * 0.1, r * 1.2 * shadowScale, r * 0.35 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = player && this.invincible && Math.floor(this.clock / 7) % 2 ? 0.35 : 1;
        const gradient = ctx.createRadialGradient(p.x - r * 0.35, cy - r * 0.4, r * 0.08, p.x, cy, r);
        if (actor.type === 'steel') {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.22, '#dbe9f3');
            gradient.addColorStop(0.45, '#344458');
            gradient.addColorStop(0.52, '#102238');
            gradient.addColorStop(0.65, '#c2e0ec');
            gradient.addColorStop(0.85, '#667783');
            gradient.addColorStop(1, '#152338');
        } else if (actor.type === 'cracked') {
            gradient.addColorStop(0, '#715096');
            gradient.addColorStop(0.3, '#19142b');
            gradient.addColorStop(0.75, '#070912');
            gradient.addColorStop(1, '#262039');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.25, actor.color);
            gradient.addColorStop(0.72, '#c4a42a');
            gradient.addColorStop(1, '#101c32');
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.clip();
        const [qx, qy, qz, qw] = actor.roll || [0, 0, 0, 1];
        ctx.lineWidth = r * 0.3;
        ctx.lineCap = 'round';
        for (const latitude of actor.type === 'steel' ? [] : [-0.55, 0.35]) {
            ctx.beginPath();
            let visible = false;
            for (let i = 0; i <= 100; i++) {
                const t = i / 100 * Math.PI * 2;
                const lat = latitude + (actor.type === 'cracked'
                    ? Math.sin(t * 11) * 0.1 + Math.sin(t * 19) * 0.06
                    : Math.sin(t * 2) * 0.18);
                const x = Math.cos(t) * Math.cos(lat), y = Math.sin(t) * Math.cos(lat), z = Math.sin(lat);
                const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
                const rx = x + qw * tx + qy * tz - qz * ty;
                const ry = y + qw * ty + qz * tx - qx * tz;
                const rz = z + qw * tz + qx * ty - qy * tx;
                const facing = ry * 0.673 + rz * 0.74;
                if (facing < 0.05) { visible = false; continue; }
                const px = p.x + rx * r, py = cy + (ry * 0.74 - rz * 0.673) * r;
                if (visible) ctx.lineTo(px, py);
                else ctx.moveTo(px, py);
                visible = true;
            }
            ctx.strokeStyle = actor.type === 'cracked' ? '#d695ff' : latitude < 0 ? '#ffffffb8' : '#132441b0';
            ctx.lineWidth = actor.type === 'cracked' ? Math.max(0.7, r * 0.1) : r * 0.3;
            ctx.shadowColor = '#b44aff';
            ctx.shadowBlur = actor.type === 'cracked' ? r * 0.4 : 0;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        const glass = ctx.createRadialGradient(p.x - r * 0.35, cy - r * 0.45, 0, p.x - r * 0.35, cy - r * 0.45, r * 0.5);
        glass.addColorStop(0, '#fffffff0');
        glass.addColorStop(0.3, '#ffffff70');
        glass.addColorStop(1, '#ffffff00');
        ctx.fillStyle = glass;
        ctx.fillRect(p.x - r, cy - r, r * 2, r * 2);
        ctx.strokeStyle = '#bcefff90';
        ctx.lineWidth = Math.max(0.6, r * 0.07);
        ctx.beginPath();
        ctx.arc(p.x, cy, r * 0.91, Math.PI * 0.1, Math.PI * 0.75);
        ctx.stroke();
        ctx.restore();
    }

    drawRobot(actor) {
        const ctx = this.ctx;
        const p = this.project(actor.x, actor.y);
        const step = Math.sin((actor.travel || 0) * 12);
        ctx.save();
        ctx.translate(p.x, p.y);
        const unit = this.cell * this.zoom;
        ctx.scale(unit, unit);
        ctx.fillStyle = '#0009';
        ctx.beginPath(); ctx.ellipse(0, 0.04, 0.65, 0.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(0.4, -0.84);
        ctx.rotate((actor.travel || 0) * 2);
        ctx.fillStyle = '#ca983b';
        ctx.fillRect(-0.05, -0.3, 0.1, 0.6);
        ctx.lineWidth = 0.07;
        ctx.strokeStyle = '#ffe1a2';
        for (const y of [-0.22, 0.22]) {
            ctx.beginPath(); ctx.ellipse(0, y, 0.12, 0.1, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = '#d27b35';
        ctx.fillRect(-0.32, -0.13 + step * 0.035, 0.25, 0.16);
        ctx.fillRect(0.08, -0.13 - step * 0.035, 0.25, 0.16);
        ctx.fillStyle = '#173442';
        ctx.fillRect(-0.34, -0.02 + step * 0.035, 0.29, 0.08);
        ctx.fillRect(0.06, -0.02 - step * 0.035, 0.29, 0.08);
        const body = ctx.createLinearGradient(-0.3, 0, 0.35, 0);
        body.addColorStop(0, '#58b3b5'); body.addColorStop(0.65, '#27737d'); body.addColorStop(1, '#143f50');
        ctx.fillStyle = body;
        ctx.fillRect(-0.31, -0.69, 0.62, 0.56);
        ctx.strokeStyle = '#e5974c'; ctx.lineWidth = 0.045;
        ctx.strokeRect(-0.31, -0.69, 0.62, 0.56);
        ctx.fillStyle = '#102b3b';
        ctx.fillRect(-0.18, -0.56, 0.36, 0.28);
        ctx.fillStyle = '#b3a46c';
        for (let i = 0; i < 3; i++) ctx.fillRect(-0.14, -0.52 + i * 0.08, 0.28, 0.025);
        ctx.fillStyle = body;
        ctx.fillRect(-0.34, -1.18, 0.68, 0.43);
        ctx.strokeRect(-0.34, -1.18, 0.68, 0.43);
        ctx.fillStyle = '#163342'; ctx.fillRect(-0.25, -1.1, 0.5, 0.23);
        ctx.fillStyle = '#ff70dc'; ctx.shadowColor = '#ff21d5'; ctx.shadowBlur = unit * 0.15;
        for (const x of [-0.14, 0.14]) {
            ctx.beginPath(); ctx.arc(x, -0.99, 0.075, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#e5974c'; ctx.lineWidth = 0.09;
        for (const side of [-1, 1]) {
            const reach = step * 0.04 * side;
            ctx.beginPath(); ctx.moveTo(side * 0.34, -0.58); ctx.lineTo(side * 0.5, -0.4 + reach); ctx.stroke();
            ctx.strokeStyle = '#89b2b3'; ctx.lineWidth = 0.065;
            ctx.beginPath(); ctx.arc(side * 0.55, -0.29 + reach, 0.14, Math.PI * 0.15, Math.PI * 1.8); ctx.stroke();
            ctx.strokeStyle = '#e5974c'; ctx.lineWidth = 0.09;
        }
        ctx.restore();
    }

    drawMagnet(actor) {
        const ctx = this.ctx;
        const p = this.project(actor.x, actor.y);
        const s = this.cell * this.zoom;
        const distance = Math.hypot(actor.x - this.player.x, actor.y - this.player.y);
        const active = !this.invincible && this.player.height === 0 && distance < 4.2;
        ctx.save();
        ctx.strokeStyle = active ? '#7cefffaa' : '#53d9ff40';
        ctx.lineWidth = active ? 1.5 : 1;
        for (let i = 0; i < 3; i++) {
            const radius = (0.55 + ((this.clock / 90 + i / 3) % 1) * 3.65) * s;
            ctx.beginPath(); ctx.ellipse(p.x, p.y, radius, radius * 0.55, -0.1, 0, Math.PI * 2); ctx.stroke();
        }
        for (let i = 0; i < 5; i++) {
            const t = i / 5 * Math.PI * 2 + this.clock * 0.025;
            ctx.fillStyle = '#c4e9f7';
            ctx.fillRect(p.x + Math.cos(t) * s * 0.75, p.y - s * 0.3 + Math.sin(t) * s * 0.4, s * 0.07, s * 0.07);
        }
        ctx.restore();
    }

    drawToken(token) {
        const ctx = this.ctx;
        const p = this.project(token.x, token.y);
        const r = this.cell * this.zoom * 0.24;
        const cy = p.y - r;
        ctx.save();
        ctx.fillStyle = '#0009';
        ctx.beginPath();
        ctx.ellipse(p.x + r * 0.25, p.y + r * 0.1, r * 1.1, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        const bead = ctx.createRadialGradient(p.x - r * 0.35, cy - r * 0.4, 0, p.x, cy, r);
        bead.addColorStop(0, '#ffffff');
        bead.addColorStop(0.3, '#b9ffff');
        bead.addColorStop(0.6, '#39cbdc');
        bead.addColorStop(1, '#14445e');
        ctx.fillStyle = bead;
        ctx.beginPath(); ctx.arc(p.x, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d9ffffa0';
        ctx.lineWidth = Math.max(0.5, r * 0.08);
        ctx.stroke();
        ctx.fillStyle = '#ffffffd0';
        ctx.beginPath(); ctx.arc(p.x - r * 0.32, cy - r * 0.38, r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    draw() {
        const magnet = this.enemies.find(e => e.type === 'steel');
        const proximity = magnet ? Math.max(0, 1 - Math.hypot(magnet.x - this.player.x, magnet.y - this.player.y) / 8) : 0;
        ArcadeAudio.setMagnet(this.frozen || this.gameOver ? 0 : proximity);
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
        this.enemies.filter(e => e.type === 'steel').forEach(e => this.drawMagnet(e));
        const objects = [
            ...this.tokens.filter(t => !t.taken).map(t => ({ y: t.y, draw: () => this.drawToken(t) })),
            ...this.walls.map(w => ({ y: w.y + 1, draw: () => this.drawWord(w) })),
            ...this.enemies.map(e => ({ y: e.y, draw: () => this.drawCharacter(e, false) })),
            { y: this.player.y + this.player.height * 0.7, draw: () => this.drawCharacter(this.player, true) }
        ];
        objects.sort((a, b) => a.y - b.y).forEach(o => {
            const p = this.project(0, o.y);
            if (p.y > -40 && p.y < this.height + 50) o.draw();
        });
        this.drawMap();
        ctx.font = `10px "VT323", monospace`;
        ctx.fillStyle = '#c5ffff';
        ctx.textAlign = 'left';
        ctx.fillText(`DATA ${this.tokens.filter(t => t.taken).length}/${this.tokens.length}  •  SPACE: JUMP FREE OF MAGNETS`, 10, this.height - 12);
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
