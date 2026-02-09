// ============================================
// BREAKOUT GAME - Brick breaker style
// ============================================

class BreakoutGame extends GameEngine {
    constructor(canvasId) {
        super(canvasId);
        
        this.paddle = {
            x: 0,
            y: 0,
            width: 100,
            height: 15,
            speed: GAME_CONFIG.difficulty.playerSpeed,
            color: GAME_CONFIG.theme.primary
        };
        
        this.ball = {
            x: 0,
            y: 0,
            radius: 8,
            vx: 4,
            vy: -4,
            speed: 6,
            color: GAME_CONFIG.theme.accent
        };
        
        this.bricks = [];
        this.particles = [];
        this.resumeText = formatResumeForGame();
        this.touchStartX = 0;
        
        this.onResize = () => this.resetPositions();
        this.resetPositions();
        this.createBricks();
        
        this.onTouchStart = (e) => {
            this.touchStartX = e.touches[0].clientX;
        };
        
        this.onTouchMove = (e) => {
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - this.touchStartX;
            this.paddle.x += deltaX * 0.5;
            this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));
            this.touchStartX = touchX;
        };
    }
    
    resetPositions() {
        this.paddle.x = this.canvas.width / 2 - this.paddle.width / 2;
        this.paddle.y = this.canvas.height - this.paddle.height - 20;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.paddle.y - 20;
    }
    
    createBricks() {
        this.bricks = [];
        const brickHeight = 25;
        const padding = 5;
        const offsetTop = 80;
        
        // Filter out empty lines
        const lines = this.resumeText.filter(line => line.trim() !== '');
        
        lines.forEach((line, rowIndex) => {
            const chars = line.split('');
            const brickWidth = Math.min(20, (this.canvas.width - padding * 2) / chars.length);
            const totalWidth = chars.length * brickWidth;
            const offsetLeft = (this.canvas.width - totalWidth) / 2;
            
            chars.forEach((char, colIndex) => {
                this.bricks.push({
                    char: char,
                    x: offsetLeft + colIndex * brickWidth,
                    y: offsetTop + rowIndex * brickHeight,
                    width: brickWidth - 2,
                    height: brickHeight - 2,
                    hit: false,
                    // Color variation based on position
                    color: rowIndex % 3 === 0 ? GAME_CONFIG.theme.primary :
                           rowIndex % 3 === 1 ? GAME_CONFIG.theme.secondary :
                           GAME_CONFIG.theme.accent
                });
            });
        });
    }
    
    update() {
        if (!this.isRunning) return;
        
        // Move paddle
        if (this.keys['ArrowLeft'] && this.paddle.x > 0) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.keys['ArrowRight'] && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += this.paddle.speed;
        }
        
        // Move ball
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // Ball collision with walls
        if (this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.vx *= -1;
            this.ball.x = Math.max(this.ball.radius, Math.min(this.canvas.width - this.ball.radius, this.ball.x));
        }
        
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.vy *= -1;
            this.ball.y = this.ball.radius;
        }
        
        // Ball collision with paddle
        if (this.ball.y + this.ball.radius > this.paddle.y &&
            this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width) {
            
            this.ball.vy = -Math.abs(this.ball.vy);
            
            // Add spin based on where ball hits paddle
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            this.ball.vx = (hitPos - 0.5) * 8;
        }
        
        // Ball falls off screen - reset
        if (this.ball.y > this.canvas.height) {
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.paddle.y - 20;
            this.ball.vx = 4;
            this.ball.vy = -4;
        }
        
        // Ball collision with bricks
        this.bricks.forEach((brick) => {
            if (brick.hit) return;
            
            if (this.ball.x + this.ball.radius > brick.x &&
                this.ball.x - this.ball.radius < brick.x + brick.width &&
                this.ball.y + this.ball.radius > brick.y &&
                this.ball.y - this.ball.radius < brick.y + brick.height) {
                
                brick.hit = true;
                
                // Determine collision side
                const ballCenterX = this.ball.x;
                const ballCenterY = this.ball.y;
                const brickCenterX = brick.x + brick.width / 2;
                const brickCenterY = brick.y + brick.height / 2;
                
                const dx = Math.abs(ballCenterX - brickCenterX);
                const dy = Math.abs(ballCenterY - brickCenterY);
                
                if (dx > dy) {
                    this.ball.vx *= -1;
                } else {
                    this.ball.vy *= -1;
                }
                
                this.particles.push(...this.createParticles(
                    brick.x + brick.width / 2,
                    brick.y + brick.height / 2,
                    brick.color
                ));
                
                this.updateScore(10);
            }
        });
        
        // Remove hit bricks
        this.bricks = this.bricks.filter(brick => !brick.hit);
        
        // Reset if all bricks cleared
        if (this.bricks.length === 0) {
            this.createBricks();
        }
        
        this.particles = this.updateParticles(this.particles);
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 10, 10, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bricks
        this.ctx.font = '14px "Press Start 2P"';
        this.bricks.forEach(brick => {
            this.ctx.shadowColor = brick.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = brick.color;
            
            // Draw brick background
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // Draw character
            this.ctx.globalAlpha = 1;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                brick.char,
                brick.x + brick.width / 2,
                brick.y + brick.height / 2
            );
        });
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
        
        // Draw paddle
        this.ctx.shadowColor = this.paddle.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = this.paddle.color;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Draw ball
        this.ctx.shadowColor = this.ball.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw particles
        this.drawParticles(this.particles);
    }
}
