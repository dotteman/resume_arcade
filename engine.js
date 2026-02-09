// ============================================
// GAME ENGINE - Base functionality
// ============================================

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.keys = {};
        this.score = 0;
        this.hits = 0;
        this.isRunning = true;
        
        this.setupCanvas();
        this.setupInput();
    }
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.onResize && this.onResize();
        };
        resize();
        window.addEventListener('resize', resize);
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.onKeyDown && this.onKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.onKeyUp && this.onKeyUp(e);
        });
        
        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            this.onTouchStart && this.onTouchStart(e);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.onTouchMove && this.onTouchMove(e);
        });
    }
    
    updateScore(points) {
        this.score += points;
        this.hits++;
        document.getElementById('score').textContent = String(this.score).padStart(4, '0');
        document.getElementById('hits').textContent = this.hits;
    }
    
    start() {
        this.gameLoop();
    }
    
    gameLoop() {
        if (this.isRunning) {
            this.update && this.update();
            this.draw && this.draw();
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    
    createParticles(x, y, color, count = 15) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                life: 1,
                color: color
            });
        }
        return particles;
    }
    
    updateParticles(particles) {
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
        });
        return particles.filter(p => p.life > 0);
    }
    
    drawParticles(particles) {
        particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            this.ctx.restore();
        });
    }
}

// ============================================
// GAME LOADER - Loads the selected game
// ============================================

function loadGame() {
    const gameType = GAME_CONFIG.gameType;
    
    // Update page title with game type
    const gameNames = {
        'invaders': 'RESUME INVADERS',
        'breakout': 'RESUME BREAKOUT',
        'asteroids': 'RESUME ASTEROIDS'
    };
    
    document.querySelector('.glitch').textContent = gameNames[gameType] || 'RESUME GAME';
    document.querySelector('.glitch').setAttribute('data-text', gameNames[gameType] || 'RESUME GAME');
    
    // Load appropriate game
    let game;
    switch(gameType) {
        case 'breakout':
            game = new BreakoutGame('gameCanvas');
            updateInstructions('◄ ► MOVE  •  BREAK THE RESUME!');
            break;
        case 'asteroids':
            game = new AsteroidsGame('gameCanvas');
            updateInstructions('◄ ► ROTATE  •  ▲ THRUST  •  SPACE SHOOT');
            break;
        case 'invaders':
        default:
            game = new InvadersGame('gameCanvas');
            updateInstructions('◄ ► MOVE  •  SPACE SHOOT  •  DESTROY THE RESUME!');
            break;
    }
    
    game.start();
}

function updateInstructions(text) {
    document.querySelector('.instructions p').textContent = text;
}

// Start the game when page loads
window.addEventListener('DOMContentLoaded', loadGame);
