// ============================================
// RESUME CONFIGURATION
// ============================================
// Edit this file to customize your resume content

const RESUME_CONFIG = {
    // Personal Info
    personal: {
        name: "JOHN DOE",
        title: "SOFTWARE ENGINEER",
        email: "john@example.com",
        location: "SAN FRANCISCO, CA",
        linkedin: "linkedin.com/in/johndoe",
        github: "github.com/johndoe"
    },

    // Skills (will be displayed as skill tags)
    skills: [
        "JAVASCRIPT",
        "PYTHON",
        "REACT",
        "NODE.JS",
        "HTML/CSS",
        "GIT",
        "AWS",
        "DOCKER"
    ],

    // Work Experience
    experience: [
        {
            title: "SENIOR DEVELOPER",
            company: "TECH CORP",
            period: "2020 - 2024",
            achievements: [
                "LED TEAM OF 5 ENGINEERS",
                "BUILT SCALABLE APIS",
                "INCREASED PERFORMANCE 50%"
            ]
        },
        {
            title: "FREELANCE DEVELOPER",
            company: "SELF-EMPLOYED",
            period: "2018 - 2020",
            achievements: [
                "10+ CLIENT PROJECTS",
                "FULL-STACK DEVELOPMENT"
            ]
        }
    ],

    // Education
    education: [
        {
            degree: "BS COMPUTER SCIENCE",
            school: "MIT",
            year: "2018"
        }
    ],

    // Projects (optional)
    projects: [
        {
            name: "COOL APP",
            description: "MOBILE APP - 10K USERS",
            tech: "REACT NATIVE"
        }
    ]
};

// ============================================
// GAME CONFIGURATION
// ============================================

const GAME_CONFIG = {
    // Choose your game type: 'invaders', 'breakout', 'asteroids'
    gameType: 'invaders',
    
    // Theme colors (can be customized per game)
    theme: {
        primary: '#00ffff',    // Cyan
        secondary: '#ff00ff',  // Magenta
        accent: '#00ff00',     // Green
        warning: '#ffff00'     // Yellow
    },
    
    // Game difficulty settings
    difficulty: {
        letterSpeed: 0.3,      // Speed letters descend (invaders)
        playerSpeed: 5,        // How fast the player moves
        bulletSpeed: 8         // How fast bullets travel
    }
};

// ============================================
// TEXT FORMATTER (converts resume to game text)
// ============================================

function formatResumeForGame() {
    const lines = [];
    const r = RESUME_CONFIG;
    
    // Header
    lines.push(r.personal.name);
    lines.push(r.personal.title);
    lines.push('');
    
    // Contact
    if (r.personal.email) lines.push(r.personal.email);
    if (r.personal.location) lines.push(r.personal.location);
    lines.push('');
    
    // Skills
    if (r.skills && r.skills.length > 0) {
        lines.push('--- SKILLS ---');
        r.skills.forEach(skill => lines.push(skill));
        lines.push('');
    }
    
    // Experience
    if (r.experience && r.experience.length > 0) {
        lines.push('--- EXPERIENCE ---');
        r.experience.forEach(job => {
            lines.push(job.title);
            lines.push(`${job.company} ${job.period}`);
            if (job.achievements) {
                job.achievements.forEach(achievement => {
                    lines.push(`* ${achievement}`);
                });
            }
            lines.push('');
        });
    }
    
    // Education
    if (r.education && r.education.length > 0) {
        lines.push('--- EDUCATION ---');
        r.education.forEach(edu => {
            lines.push(edu.degree);
            lines.push(`${edu.school} ${edu.year}`);
        });
        lines.push('');
    }
    
    // Projects
    if (r.projects && r.projects.length > 0) {
        lines.push('--- PROJECTS ---');
        r.projects.forEach(proj => {
            lines.push(proj.name);
            lines.push(proj.description);
            if (proj.tech) lines.push(proj.tech);
            lines.push('');
        });
    }
    
    return lines;
}
