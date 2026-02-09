// ============================================
// RESUME CONFIGURATION
// ============================================
// Edit this file to customize your resume content

const RESUME_CONFIG = {
    // Personal Info
    personal: {
        name: "DAVE OTTEMAN",
        title: "DEVOPS ENGINEER",
        email: "dave.otteman@gmail.com",
        location: "PORTLAND, OR",
        linkedin: "linkedin.com/in/daveotteman",
        github: "github.com/daveotteman"
    },

    // Skills (will be displayed as skill tags)
    skills: [
        "AZURE",
        "TERRAFORM",
        "ANSIBLE",
        "KUBERNETES",
        "VMWARE VSPHERE",
        "CI/CD PIPELINES",
        "POWERSHELL",
        "BASH",
        "PYTHON",
        "LINUX (RED HAT/UBUNTU)"
    ],

    // Work Experience
    experience: [
        {
            title: "DEVOPS ENGINEER",
            company: "BBSI",
            period: "MARCH 2020 - PRESENT",
            achievements: [
                "SUPPORT HYBRID INFRASTRUCTURE WITH LOCAL DATACENTER AND AZURE CLOUD",
                "MANAGE VMWARE VSPHERE AND AZURE BUSINESS APPLICATIONS",
                "BUILT CI/CD PIPELINES USING AZURE DEVOPS",
                "IMPLEMENTED IAC USING TERRAFORM AND ANSIBLE"
            ]
        },
        {
            title: "IAAS ENGINEER",
            company: "COLUMBIA SPORTSWEAR",
            period: "APRIL 2019 - MARCH 2020",
            achievements: [
                "SUPPORTED IAAS INFRASTRUCTURE IN PUBLIC AND PRIVATE CLOUD",
                "ENFORCED MFA POLICIES AND CONDITIONAL ACCESS",
                "REMOVED BASIC AUTHENTICATION ON OFFICE 365 PLATFORM"
            ]
        },
        {
            title: "SYSTEM ENGINEER - CLOUD AND CONNECTIVITY",
            company: "ADIDAS",
            period: "2017 - 2019",
            achievements: [
                "SUPPORTED GLOBAL INFRASTRUCTURE AND HARDWARE MAINTENANCE",
                "CONTRIBUTED TO DATA CENTER MIGRATION FOR REEBOK AND PDX",
                "INCREASED AUTOMATION THROUGH POWERSHELL SCRIPTING"
            ]
        },
        {
            title: "SYSTEM ADMINISTRATOR III",
            company: "NW NATURAL",
            period: "2000 - 2017",
            achievements: [
                "ARCHITECTED WINDOWS SERVER AND ACTIVE DIRECTORY INFRASTRUCTURE",
                "MANAGED EXCHANGE AND SHAREPOINT MIGRATIONS",
                "MIGRATED PHYSICAL INFRASTRUCTURE TO VIRTUAL ENVIRONMENTS"
            ]
        }
    ],

    // Education
    education: [
        {
            degree: "BS EXERCISE PHYSIOLOGY",
            school: "OREGON STATE UNIVERSITY",
            year: "1992"
        }
    ],

    // Projects (optional)
    projects: [
        {
            name: "AUTOMATED PROVISIONING",
            description: "TERRAFORM & ANSIBLE HYBRID CLOUD DEPLOYMENT",
            tech: "TERRAFORM"
        }
    ]
};

// ============================================
// GAME CONFIGURATION
// ============================================

const GAME_CONFIG = {
    // Choose your game type: 'invaders', 'breakout', 'asteroids'
    gameType: 'breakout',
    
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
