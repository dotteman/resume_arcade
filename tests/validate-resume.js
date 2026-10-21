#!/usr/bin/env node
// Validates resume markdown files with the same parser the site uses.
// Usage: node tests/validate-resume.js [file.md ...]   (default: resume.md + the template)
const fs = require('fs');
const path = require('path');
const { parseResume, buildResumeSections } = require('../resume-parser.js');

const root = path.join(__dirname, '..');
const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ['resume.md', 'examples/resume.template.md'];

let failed = false;
for (const file of files) {
    const full = path.resolve(root, file);
    if (!fs.existsSync(full)) {
        console.error(`✗ ${file}: file not found`);
        failed = true;
        continue;
    }
    const resume = parseResume(fs.readFileSync(full, 'utf8'));
    const sections = buildResumeSections(resume);
    const lines = sections.reduce((n, s) => n + s.lines.length, 0);
    const problems = [...resume.warnings];
    if (!sections.length) problems.push('no game sections could be built');

    if (problems.length) {
        failed = true;
        console.error(`✗ ${file}`);
        problems.forEach(p => console.error(`    - ${p}`));
    } else {
        console.log(`✓ ${file}: ${resume.name} — ${sections.length} game sections, ${lines} lines`);
        sections.forEach(s => console.log(`    ${s.title} (${s.lines.length})`));
    }
}
process.exit(failed ? 1 : 0);
