// ============================================
// INVADERS GAME - Space Invaders style
// ============================================

class InvadersGame extends GameEngine {
    constructor(canvasId) {
        super(canvasId);
        
        this.player = {
            x: 0,
            y: 0,
            width: 40,
            height: 30,
            speed: GAME_CONFIG.difficulty.playerSpeed,
            color: GAME_CONFIG.theme.primary
        };
        
        this.bullets = [];
        this.letters = [];
        this.particles = [];
        this.resumeText = formatResumeForGame();
        this.touchStartX = 0;
        
        this.onResize = () => this.resetPlayerPosition();
        this.resetPlayerPosition();
        this.createLetters();
        
        this.onKeyDown = (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.shoot();
            }
        };
        
        this.onTouchStart = (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.shoot();
        };
        
        this.onTouchMove = (e) => {
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - this.touchStartX;
            this.player.x += deltaX * 0.5;
            this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
            this.touchStartX = touchX;
        };
    }
    
    resetPlayerPosition() {
        this.player.x = this.canvas.width / 2 - this.player.width / 2;
        this.player.y = this.canvas.height - this.player.height - 20;
    }
    
    createLetters() {
        this.letters = [];
        let letterIndex = 0;
        
        this.resumeText.forEach((line, lineIndex) => {
            if (line.trim() === '') return;
            
            const chars = line.split('');
            const lineWidth = chars.length * 20;
            const startX = (this.canvas.width - lineWidth) / 2;
            
            chars.forEach((char, charIndex) => {
                this.letters.push({
                    char: char,
                    x: startX + charIndex * 20,
                    y: -lineIndex * 40 - 100,
                    width: 16,
                    height: 16,
                    speed: GAME_CONFIG.difficulty.letterSpeed,
                    hit: false,
                    fallSpeed: 0,
                    rotation: 0,
                    lineIndex: lineIndex,
                    index: letterIndex++
                });
            });
        });
    }
    
    shoot() {
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y,
            width: 4,
            height: 15,
            speed: GAME_CONFIG.difficulty.bulletSpeed,
            color: GAME_CONFIG.theme.accent
        });
    }
    
    update() {
        if (!this.isRunning) return;
        
        // Move player
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
        
        // Update letters
        this.letters.forEach(letter => {
            if (!letter.hit) {
                letter.y += letter.speed;
            } else {
                letter.y += letter.fallSpeed;
                letter.fallSpeed += 0.5;
                letter.rotation += 0.2;
            }
        });
        
        this.letters = this.letters.filter(letter => letter.y < this.canvas.height + 50);
        
        if (this.letters.length === 0) {
            this.createLetters();
        }
        
        // Collision detection
        this.bullets.forEach((bullet, bulletIndex) => {
            this.letters.forEach((letter) => {
                if (!letter.hit &&
                    bullet.x < letter.x + letter.width &&
                    bullet.x + bullet.width > letter.x &&
                    bullet.y < letter.y + letter.height &&
                    bullet.y + bullet.height > letter.y) {
                    
                    letter.hit = true;
                    letter.fallSpeed = -5;
                    this.bullets.splice(bulletIndex, 1);
                    
                    this.particles.push(...this.createParticles(
                        letter.x + letter.width / 2,
                        letter.y + letter.height / 2,
                        GAME_CONFIG.theme.secondary
                    ));
                    
                    this.updateScore(10);
                }
            });
        });
        
        this.particles = this.updateParticles(this.particles);
    }
    
    draw() {
        // Clear with trail effect
        this.ctx.fillStyle = 'rgba(0, 10, 10, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw letters
        this.ctx.font = '16px "Press Start 2P"';
        this.letters.forEach(letter => {
            this.ctx.save();
            this.ctx.translate(letter.x + letter.width / 2, letter.y + letter.height / 2);
            this.ctx.rotate(letter.rotation);
            
            this.ctx.shadowColor = letter.hit ? GAME_CONFIG.theme.secondary : GAME_CONFIG.theme.primary;
            this.ctx.shadowBlur = letter.hit ? 20 : 10;
            this.ctx.fillStyle = letter.hit ? GAME_CONFIG.theme.secondary : GAME_CONFIG.theme.primary;
            this.ctx.fillText(letter.char, -letter.width / 2, letter.height / 2);
            
            this.ctx.restore();
        });
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            this.ctx.shadowColor = GAME_CONFIG.theme.accent;
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw particles
        this.drawParticles(this.particles);
        
        // Draw player ship
        this.ctx.save();
        this.ctx.shadowColor = this.player.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = this.player.color;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillRect(this.player.x - 8, this.player.y + this.player.height - 5, 8, 5);
        this.ctx.fillRect(this.player.x + this.player.width, this.player.y + this.player.height - 5, 8, 5);
        
        this.ctx.restore();
    }
}
