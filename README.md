# 🕹️ Resume Arcade - Modular Resume Game System

A fully customizable, retro-styled resume presented as arcade games! Choose from three different game types and easily swap in your own resume data.

## 🎮 Three Game Modes

### 1. **INVADERS** (Space Invaders Style)
Your resume text descends as alien invaders. Shoot them down with your ship!
- **Controls:** ← → to move, SPACE to shoot

### 2. **BREAKOUT** (Brick Breaker Style)  
Your resume forms colorful bricks. Break them with a ball and paddle!
- **Controls:** ← → to move paddle

### 3. **ASTEROIDS** (Classic Asteroids Style)
Your resume floats as words in space. Rotate and thrust to shoot them!
- **Controls:** ← → to rotate, ↑ to thrust, SPACE to shoot

---

## 🚀 Quick Start

### Option 1: Local Testing
1. Download all files
2. Open `index.html` in your web browser
3. Play immediately!

### Option 2: Deploy to GitHub Pages
1. Create a new repository (e.g., `username.github.io` or `resume-arcade`)
2. Upload all files:
   - `index.html`
   - `style.css`
   - `config.js`
   - `engine.js`
   - `game-invaders.js`
   - `game-breakout.js`
   - `game-asteroids.js`
3. Go to Settings → Pages
4. Set Source to "main" branch
5. Your site goes live at `https://username.github.io/repository-name`

---

## ✏️ Customizing Your Resume

### Edit `config.js` - Resume Data

All resume content is in one place! Edit the `RESUME_CONFIG` object:

```javascript
const RESUME_CONFIG = {
    personal: {
        name: "YOUR NAME",
        title: "YOUR TITLE",
        email: "your@email.com",
        location: "YOUR CITY, STATE",
        linkedin: "linkedin.com/in/yourprofile",
        github: "github.com/yourusername"
    },

    skills: [
        "SKILL 1",
        "SKILL 2",
        "SKILL 3",
        // Add as many as you want!
    ],

    experience: [
        {
            title: "JOB TITLE",
            company: "COMPANY NAME",
            period: "2020 - 2024",
            achievements: [
                "ACHIEVEMENT 1",
                "ACHIEVEMENT 2"
            ]
        },
        // Add more jobs...
    ],

    education: [
        {
            degree: "YOUR DEGREE",
            school: "SCHOOL NAME",
            year: "YEAR"
        }
    ],

    projects: [
        {
            name: "PROJECT NAME",
            description: "DESCRIPTION",
            tech: "TECHNOLOGIES USED"
        }
    ]
};
```

### Switch Game Types

In `config.js`, change the `gameType`:

```javascript
const GAME_CONFIG = {
    gameType: 'invaders',  // Options: 'invaders', 'breakout', 'asteroids'
    // ... rest of config
};
```

---

## 🎨 Customizing Appearance

### Change Color Theme

Edit the `theme` section in `config.js`:

```javascript
theme: {
    primary: '#00ffff',    // Cyan - main text color
    secondary: '#ff00ff',  // Magenta - hit/title color
    accent: '#00ff00',     // Green - bullets/ball
    warning: '#ffff00'     // Yellow - thrust exhaust (asteroids)
}
```

Try these presets:

**Classic Arcade:**
```javascript
primary: '#00ffff', secondary: '#ff00ff', accent: '#00ff00', warning: '#ffff00'
```

**Retro Terminal:**
```javascript
primary: '#00ff00', secondary: '#00ff00', accent: '#00cc00', warning: '#88ff88'
```

**Neon Cyberpunk:**
```javascript
primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00', warning: '#ff0080'
```

**Hot Lava:**
```javascript
primary: '#ff4500', secondary: '#ff1493', accent: '#ffff00', warning: '#ff6347'
```

### Adjust Difficulty

```javascript
difficulty: {
    letterSpeed: 0.3,    // Lower = slower, higher = faster
    playerSpeed: 5,      // How fast ship/paddle moves
    bulletSpeed: 8       // How fast bullets travel
}
```

---

## 📁 File Structure

```
resume-arcade/
├── index.html           # Main HTML structure
├── style.css            # 80s arcade styling, CRT effects
├── config.js            # ⭐ YOUR RESUME DATA & SETTINGS
├── engine.js            # Core game engine (shared)
├── game-invaders.js     # Space Invaders implementation
├── game-breakout.js     # Breakout implementation
└── game-asteroids.js    # Asteroids implementation
```

---

## 🛠️ Advanced Customization

### Modify Game Behavior

Each game file (`game-*.js`) is a class that extends `GameEngine`. You can:

- Change physics (gravity, friction, speed)
- Modify collision detection
- Add power-ups
- Change visual effects
- Adjust spawn patterns

### Example: Make Invaders Fall Faster Over Time

In `game-invaders.js`, modify the `update()` method:

```javascript
// Add this in the update method
this.letters.forEach(letter => {
    if (!letter.hit) {
        letter.speed += 0.0001; // Gradually increase speed
        letter.y += letter.speed;
    }
    // ... rest of code
});
```

### Example: Change Paddle Size in Breakout

In `game-breakout.js`, modify the constructor:

```javascript
this.paddle = {
    x: 0,
    y: 0,
    width: 120,  // Change this (default: 100)
    height: 15,
    // ...
};
```

---

## 🎯 Tips for Best Results

### Resume Content
- Keep text short and punchy (fits better on screen)
- Use ALL CAPS for that authentic arcade feel
- Break long job titles into multiple lines
- Empty lines create visual spacing (use sparingly)

### Visual Impact
- **Invaders:** Best for longer resumes (more letters = more fun)
- **Breakout:** Best for structured, sectioned resumes
- **Asteroids:** Best for word-focused, dynamic feel

### Performance
- Too much text can slow down the game
- Aim for 100-150 total characters for smooth performance
- Test on mobile if deploying publicly

---

## 📱 Mobile Support

All games include touch controls:
- **Invaders:** Tap to shoot, drag to move
- **Breakout:** Drag to move paddle
- **Asteroids:** Touch controls (auto-thrust mode recommended)

---

## 🔧 Troubleshooting

**Game not loading?**
- Check browser console for errors
- Ensure all `.js` files are in the same folder
- Try opening in Chrome/Firefox/Edge

**Text too small/large?**
- Adjust font size in individual game files
- Look for `ctx.font = '16px ...'` and change the number

**Colors not showing?**
- Verify color hex codes in `config.js`
- Colors must be in format: `#RRGGBB`

**Game too easy/hard?**
- Adjust speeds in `difficulty` section of `config.js`
- Modify player/bullet speeds in game files

---

## 🎨 Create Your Own Game Type

Want to add a fourth game? Here's the structure:

1. Create `game-yourname.js`
2. Extend the `GameEngine` class:

```javascript
class YourGame extends GameEngine {
    constructor(canvasId) {
        super(canvasId);
        // Initialize your game
    }
    
    update() {
        // Game logic
    }
    
    draw() {
        // Rendering
    }
}
```

3. Add to `config.js`:
```javascript
gameType: 'yourname'
```

4. Update `engine.js` to load your game
5. Update `index.html` to include your script

---

## 🌟 Example Resumes

### Minimalist Tech Resume
```javascript
personal: { name: "JANE DEV", title: "FULL STACK ENGINEER" },
skills: ["REACT", "NODE", "PYTHON", "AWS"],
experience: [{ title: "SR ENGINEER", company: "TECH CO", period: "2020-NOW" }]
```

### Creative Portfolio
```javascript
personal: { name: "ALEX DESIGN", title: "CREATIVE DEVELOPER" },
skills: ["THREE.JS", "WEBGL", "ANIMATION", "UI/UX"],
projects: [{ name: "VR GALLERY", description: "IMMERSIVE ART" }]
```

---

## 📄 License

Free to use and modify! Show off your creativity and share your customizations!

---

## 💡 Ideas for Enhancement

- Add background music/sound effects
- High score persistence (localStorage)
- Multiple difficulty levels
- Boss fight mode (giant resume logo?)
- Multiplayer (destroy each other's resumes!)
- QR code to actual resume PDF
- Easter eggs (Konami code?)

---

Built with vanilla JavaScript - no frameworks needed! 🚀

**Made with ❤️ and lots of retro vibes**
