// ============================================
// GAME CONFIGURATION
// ============================================
// Your resume itself lives in resume.md — edit that file, not this one.

const GAME_CONFIG = {
    // The resume the games are built from (markdown, next to index.html).
    // See examples/resume.template.md for the format.
    // Add ?resume=path/to/other.md to the page URL to preview a different file.
    resumeFile: 'resume.md',

    // Game highlighted on the start screen: 'invaders', 'breakout', 'asteroids', 'maze'.
    // Visitors pick from the menu; ?game=<name> in the URL skips it.
    defaultGame: 'breakout',

    // Theme colors
    theme: {
        primary: '#00ffff',    // Cyan
        secondary: '#ff00ff',  // Magenta
        accent: '#00ff00',     // Green
        warning: '#ffff00'     // Yellow
    },

    // Speeds are in pixels per frame at 60 fps (frame-rate independent)
    difficulty: {
        letterSpeed: 0.35,     // Invaders formation descent
        playerSpeed: 7,        // Ship / paddle speed
        bulletSpeed: 9,        // Bullet speed
        ballSpeed: 7,          // Breakout ball speed
        lives: 3
    }
};
