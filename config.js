// ============================================
// RESUME CONFIGURATION
// ============================================
// Edit this file to customize your resume content.
// Text can be written in any case: the games upper-case it automatically,
// while the "READ RESUME" view shows it exactly as written.

const RESUME_CONFIG = {
    // Personal Info
    personal: {
        name: "DAVE OTTEMAN",
        title: "DEVOPS ENGINEER",
        email: "dave.otteman@gmail.com",
        location: "PORTLAND, OR",
        linkedin: "linkedin.com/in/daveotteman",
        github: "github.com/dotteman",
        // Optional: path to a PDF in this repo, e.g. "Dave_Otteman_Resume.pdf".
        // When set, a DOWNLOAD PDF button appears in the resume view.
        resumePdf: ""
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
    // Game highlighted on the start screen: 'invaders', 'breakout', 'asteroids'.
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

// ============================================
// RESUME → GAME DATA
// ============================================

// Builds the resume as sections of lines. Every game uses this so a hit on
// any piece of a line can "unlock" that line in the side panel.
function buildResumeSections() {
    const r = RESUME_CONFIG;
    const p = r.personal || {};
    const sections = [];

    const header = [p.name, p.title, p.location, p.email, p.linkedin, p.github].filter(Boolean);
    if (header.length) sections.push({ title: 'PLAYER 1', lines: header });

    if (r.skills && r.skills.length) sections.push({ title: 'SKILLS', lines: r.skills });

    (r.experience || []).forEach(job => {
        sections.push({
            title: `EXPERIENCE: ${job.company}`,
            lines: [job.title, `${job.company} | ${job.period}`, ...(job.achievements || [])]
        });
    });

    if (r.education && r.education.length) {
        sections.push({
            title: 'EDUCATION',
            lines: r.education.flatMap(e => [e.degree, [e.school, e.year].filter(Boolean).join(' | ')])
        });
    }

    if (r.projects && r.projects.length) {
        sections.push({
            title: 'PROJECTS',
            lines: r.projects.flatMap(pr => [pr.name, pr.description, pr.tech].filter(Boolean))
        });
    }

    let id = 0;
    return sections.map((s, si) => ({
        title: s.title.toUpperCase(),
        lines: s.lines.map(text => ({ id: id++, section: si, text: String(text).toUpperCase() }))
    }));
}

// Kept for backwards compatibility: flat list of upper-case lines.
function formatResumeForGame() {
    const out = [];
    buildResumeSections().forEach(s => {
        out.push(`--- ${s.title} ---`);
        s.lines.forEach(l => out.push(l.text));
        out.push('');
    });
    return out;
}
