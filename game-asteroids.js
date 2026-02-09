// ============================================
// ASTEROIDS GAME - Classic asteroids style
// ============================================

class AsteroidsGame extends GameEngine {
    constructor(canvasId) {
        super(canvasId);
        
        this.ship = {
            x: 0,
            y: 0,
            angle: -Math.PI / 2,
            vx: 0,
            vy: 0,
            size: 20,
            rotationSpeed: 0.08,
            thrust: 0.15,
            friction: 0.99,
            color: GAME_CONFIG.theme.primary
        };
        
        this.bullets = [];
        this.words = [];
        this.particles = [];
        this.resumeText = formatResumeForGame();
        
        this.onResize = () => this.resetShipPosition();
        this.resetShipPosition();
        this.createWords();
        
        this.onKeyDown = (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.shoot();
            }
        };
    }
    
    resetShipPosition() {
        this.ship.x = this.canvas.width / 2;
        this.ship.y = this.canvas.height / 2;
        this.ship.vx = 0;
        this.ship.vy = 0;
    }
    
    createWords() {
        this.words = [];
        
        // Filter and split resume into words
        const words = this.resumeText
            .filter(line => line.trim() !== '')
            .join(' ')
            .split(' ')
            .filter(word => word.length > 0);
        
        words.forEach((word, index) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1;
            
            this.words.push({
                text: word,
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                size: Math.min(word.length * 10, 80),
                hit: false,
                color: index % 3 === 0 ? GAME_CONFIG.theme.primary :
                       index % 3 === 1 ? GAME_CONFIG.theme.secondary :
                       GAME_CONFIG.theme.accent
            });
        });
    }
    
    shoot() {
        const bulletSpeed = 8;
        this.bullets.push({
            x: this.ship.x + Math.cos(this.ship.angle) * this.ship.size,
            y: this.ship.y + Math.sin(this.ship.angle) * this.ship.size,
            vx: Math.cos(this.ship.angle) * bulletSpeed + this.ship.vx,
            vy: Math.sin(this.ship.angle) * bulletSpeed + this.ship.vy,
            life: 60,
            color: GAME_CONFIG.theme.accent
        });
    }
    
    update() {
        if (!this.isRunning) return;
        
        // Rotate ship
        if (this.keys['ArrowLeft']) {
            this.ship.angle -= this.ship.rotationSpeed;
        }
        if (this.keys['ArrowRight']) {
            this.ship.angle += this.ship.rotationSpeed;
        }
        
        // Thrust
        if (this.keys['ArrowUp']) {
            this.ship.vx += Math.cos(this.ship.angle) * this.ship.thrust;
            this.ship.vy += Math.sin(this.ship.angle) * this.ship.thrust;
            
            // Thrust particles
            if (Math.random() < 0.5) {
                const exhaustAngle = this.ship.angle + Math.PI;
                this.particles.push({
                    x: this.ship.x + Math.cos(exhaustAngle) * this.ship.size * 0.5,
                    y: this.ship.y + Math.sin(exhaustAngle) * this.ship.size * 0.5,
                    vx: Math.cos(exhaustAngle) * 2 + (Math.random() - 0.5),
                    vy: Math.sin(exhaustAngle) * 2 + (Math.random() - 0.5),
                    size: 2,
                    life: 0.5,
                    color: GAME_CONFIG.theme.warning
                });
            }
        }
        
        // Apply friction
        this.ship.vx *= this.ship.friction;
        this.ship.vy *= this.ship.friction;
        
        // Move ship
        this.ship.x += this.ship.vx;
        this.ship.y += this.ship.vy;
        
        // Wrap around screen
        if (this.ship.x < 0) this.ship.x = this.canvas.width;
        if (this.ship.x > this.canvas.width) this.ship.x = 0;
        if (this.ship.y < 0) this.ship.y = this.canvas.height;
        if (this.ship.y > this.canvas.height) this.ship.y = 0;
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Wrap bullets
            if (bullet.x < 0) bullet.x = this.canvas.width;
            if (bullet.x > this.canvas.width) bullet.x = 0;
            if (bullet.y < 0) bullet.y = this.canvas.height;
            if (bullet.y > this.canvas.height) bullet.y = 0;
            
            return bullet.life > 0;
        });
        
        // Update words
        this.words.forEach(word => {
            word.x += word.vx;
            word.y += word.vy;
            word.rotation += word.rotationSpeed;
            
            // Wrap words
            if (word.x < -word.size) word.x = this.canvas.width + word.size;
            if (word.x > this.canvas.width + word.size) word.x = -word.size;
            if (word.y < -word.size) word.y = this.canvas.height + word.size;
            if (word.y > this.canvas.height + word.size) word.y = -word.size;
        });
        
        // Collision detection
        this.bullets.forEach((bullet, bulletIndex) => {
            this.words.forEach((word) => {
                if (word.hit) return;
                
                const dx = bullet.x - word.x;
                const dy = bullet.y - word.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < word.size / 2) {
                    word.hit = true;
                    this.bullets.splice(bulletIndex, 1);
                    
                    this.particles.push(...this.createParticles(word.x, word.y, word.color, 20));
                    this.updateScore(word.text.length * 5);
                }
            });
        });
        
        // Remove hit words
        this.words = this.words.filter(word => !word.hit);
        
        // Respawn words if all destroyed
        if (this.words.length === 0) {
            this.createWords();
        }
        
        this.particles = this.updateParticles(this.particles);
    }
    
    draw() {
        // Clear with trail effect
        this.ctx.fillStyle = 'rgba(0, 10, 10, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw words
        this.ctx.font = '16px "Press Start 2P"';
        this.words.forEach(word => {
            this.ctx.save();
            this.ctx.translate(word.x, word.y);
            this.ctx.rotate(word.rotation);
            
            this.ctx.shadowColor = word.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = word.color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(word.text, 0, 0);
            
            this.ctx.restore();
        });
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            this.ctx.shadowColor = bullet.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
        });
        
        // Draw ship
        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.angle);
        
        this.ctx.shadowColor = this.ship.color;
        this.ctx.shadowBlur = 20;
        this.ctx.strokeStyle = this.ship.color;
        this.ctx.lineWidth = 2;
        
        // Ship triangle
        this.ctx.beginPath();
        this.ctx.moveTo(this.ship.size, 0);
        this.ctx.lineTo(-this.ship.size * 0.6, this.ship.size * 0.6);
        this.ctx.lineTo(-this.ship.size * 0.3, 0);
        this.ctx.lineTo(-this.ship.size * 0.6, -this.ship.size * 0.6);
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // Draw particles
        this.drawParticles(this.particles);
    }
}
