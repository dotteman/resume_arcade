// ============================================
// RESUME CONFIGURATION
// ============================================
// Edit this file to customize your resume content

const RESUME_CONFIG = {
    // Personal Info
    personal: {
        name: "DAVE OTTEMAN", [cite: 1]
        title: "DEVOPS ENGINEER", [cite: 34, 39, 47]
        email: "dave.otteman@gmail.com", [cite: 5]
        location: "PORTLAND, OR", [cite: 3]
        linkedin: "linkedin.com/in/daveotteman",
        github: "github.com/daveotteman"
    },

    // Skills (will be displayed as skill tags)
    skills: [
        "AZURE", [cite: 14]
        "TERRAFORM", [cite: 24]
        "ANSIBLE",
        "KUBERNETES",
        "VMWARE VSPHERE", [cite: 11]
        "CI/CD PIPELINES", [cite: 21]
        "POWERSHELL", [cite: 26]
        "BASH", [cite: 27]
        "PYTHON", [cite: 28]
        "LINUX (RED HAT/UBUNTU)" [cite: 10]
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
            title: "IAAS ENGINEER", [cite: 34]
            company: "COLUMBIA SPORTSWEAR", [cite: 32]
            period: "APRIL 2019 - MARCH 2020", [cite: 33]
            achievements: [
                "SUPPORTED IAAS INFRASTRUCTURE IN PUBLIC AND PRIVATE CLOUD", [cite: 35]
                "ENFORCED MFA POLICIES AND CONDITIONAL ACCESS", [cite: 35, 36]
                "REMOVED BASIC AUTHENTICATION ON OFFICE 365 PLATFORM" [cite: 35]
            ]
        },
        {
            title: "SYSTEM ENGINEER - CLOUD AND CONNECTIVITY", [cite: 39]
            company: "ADIDAS", [cite: 37]
            period: "2017 - 2019", [cite: 38]
            achievements: [
                "SUPPORTED GLOBAL INFRASTRUCTURE AND HARDWARE MAINTENANCE", [cite: 40]
                "CONTRIBUTED TO DATA CENTER MIGRATION FOR REEBOK AND PDX", [cite: 42, 44]
                "INCREASED AUTOMATION THROUGH POWERSHELL SCRIPTING" [cite: 42]
            ]
        },
        {
            title: "SYSTEM ADMINISTRATOR III", [cite: 47]
            company: "NW NATURAL", [cite: 45]
            period: "2000 - 2017", [cite: 46]
            achievements: [
                "ARCHITECTED WINDOWS SERVER AND ACTIVE DIRECTORY INFRASTRUCTURE", [cite: 48, 49]
                "MANAGED EXCHANGE AND SHAREPOINT MIGRATIONS", [cite: 50, 52, 53]
                "MIGRATED PHYSICAL INFRASTRUCTURE TO VIRTUAL ENVIRONMENTS" [cite: 51, 58]
            ]
        }
    ],

    // Education
    education: [
        {
            degree: "BS EXERCISE PHYSIOLOGY", [cite: 60]
            school: "OREGON STATE UNIVERSITY", [cite: 60]
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

// ... Rest of the file remains the same ...
