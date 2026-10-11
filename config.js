// ============================================
// RESUME CONFIGURATION
// ============================================
// Edit this file to customize your resume content.
// Text can be written in any case: the games upper-case it automatically,
// while the "READ RESUME" view shows it exactly as written.

const RESUME_CONFIG = {
    "personal": {
        "name": "Dave Otteman",
        "title": "DevOps Engineer",
        "email": "dave.otteman@gmail.com",
        "location": "Portland, OR",
        "linkedin": "linkedin.com/in/dave-otteman-59b03b16/",
        "github": "github.com/dotteman",
        "resumePdf": ""
    },
    "skills": [
        "Azure",
        "Terraform",
        "Ansible",
        "Kubernetes",
        "VMware vSphere",
        "Azure DevOps & CI/CD pipelines",
        "PowerShell",
        "Bash",
        "Python",
        "Linux (Red Hat/Ubuntu)",
        "Claude (Teams/Enterprise)",
        "Microsoft Copilot",
        "AI-assisted development & troubleshooting",
        "Business workflow automation",
        "Security review collaboration"
    ],
    "experience": [
        {
            "title": "DevOps Engineer",
            "company": "BBSI",
            "period": "March 2020 – Present",
            "achievements": [
                "Built an automated, self-service audit report in under an hour using AI tools and Azure DevOps pipelines, enabling the audit team to generate reports independently and removing their dependency on engineering for routine reporting.",
                "Use Claude and Microsoft Copilot to develop code and troubleshoot everyday technical problems, reducing resolution time from hours or days to minutes for selected tasks.",
                "Create AI-assisted automation that streamlines business workflows and reduces repetitive manual work.",
                "Work alongside the security team, using AI tools to support code reviews and identify potential security weaknesses for further investigation.",
                "Support hybrid infrastructure spanning an on-premises data center and Azure cloud, including VMware vSphere and business applications.",
                "Build CI/CD pipelines in Azure DevOps and implement infrastructure as code using Terraform and Ansible."
            ]
        },
        {
            "title": "IaaS Engineer",
            "company": "Columbia Sportswear",
            "period": "April 2019 – March 2020",
            "achievements": [
                "Supported IaaS infrastructure in public and private clouds.",
                "Enforced multifactor authentication policies and conditional access.",
                "Removed basic authentication from the Office 365 platform."
            ]
        },
        {
            "title": "System Engineer – Cloud and Connectivity",
            "company": "adidas",
            "period": "2017 – 2019",
            "achievements": [
                "Supported global infrastructure and hardware maintenance.",
                "Contributed to data center migrations for Reebok and PDX.",
                "Expanded infrastructure automation through PowerShell scripting."
            ]
        },
        {
            "title": "System Administrator III",
            "company": "NW Natural",
            "period": "2000 – 2017",
            "achievements": [
                "Architected Windows Server and Active Directory infrastructure.",
                "Managed Exchange and SharePoint migrations.",
                "Migrated physical infrastructure to virtual environments."
            ]
        }
    ],
    "education": [
        {
            "degree": "BS, Exercise Physiology",
            "school": "Oregon State University",
            "year": "1992"
        }
    ],
    "projects": [
        {
            "name": "Resume Arcade",
            "description": "Developed an interactive resume with AI assistance, featuring four playable arcade games, including a maze built from extruded resume text. Iterated on gameplay, usability, and validation.",
            "tech": "JavaScript, HTML, CSS, AI-assisted development"
        },
        {
            "name": "Automated Provisioning",
            "description": "Hybrid cloud deployment using Terraform and Ansible.",
            "tech": "Terraform, Ansible"
        }
    ],
    "summary": [
        "DevOps engineer with more than 20 years of experience in systems administration, hybrid infrastructure, and automation.",
        "Use Claude and Microsoft Copilot to accelerate troubleshooting, develop code, and automate business workflows.",
        "Enjoy making complex technology easier to use, helping people solve problems, and collaborating with security teams."
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

    if (r.summary && r.summary.length) sections.push({ title: 'SUMMARY', lines: r.summary });

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
