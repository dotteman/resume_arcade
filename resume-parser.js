// ============================================
// RESUME PARSER - resume.md → resume data → game sections
// ============================================
// No DOM access here, so the same file runs in the browser and in Node
// (CI uses it to validate resume.md). See examples/resume.template.md
// for the format.

// ---------- inline markdown ----------

// Plain text for the games: [text](url) → text, **b** → b, `c` → c …
function mdToText(s) {
    return String(s)
        .replace(/!\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, '$1')
        .replace(/\[([^\]]+)\]\((?:[^()]|\([^()]*\))*\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(^|[^\w*])\*(?!\s)([^*]+?)\*(?!\w)/g, '$1$2')
        .replace(/(^|[^\w])_(?!\s)([^_]+?)_(?!\w)/g, '$1$2')
        .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Only allow web, mail and phone links, or relative paths (no javascript: etc.)
function safeUrl(url) {
    const u = String(url).trim();
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u) && !u.startsWith('//')) return u;
    return null;
}

// Turn "github.com/me" into "https://github.com/me"; keep full URLs as they are
function toHref(value) {
    const link = /\[([^\]]+)\]\(((?:[^()\s]|\([^()]*\))+)\)/.exec(value);
    const raw = link ? link[2] : mdToText(value);
    if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(raw)) return `mailto:${raw}`;
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return safeUrl(raw);      // has a scheme: allow-list only
    return safeUrl(`https://${raw.replace(/^\/+/, '')}`);
}

// Safe HTML for the readable resume view
function mdToHtml(s) {
    let html = escapeHtml(s)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>')
        .replace(/(^|[^\w*])\*(?!\s)([^*]+?)\*(?!\w)/g, '$1<em>$2</em>')
        .replace(/(^|[^\w])_(?!\s)([^_]+?)_(?!\w)/g, '$1<em>$2</em>');
    html = html.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()]*\))+)\)/g, (m, text, url) => {
        const href = safeUrl(url.replace(/&amp;/g, '&'));
        return href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${text}</a>` : text;
    });
    return html.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, '$1');
}

// ---------- block parser ----------

const CONTACT_KEYS = {
    title: 'title', role: 'title', headline: 'title', position: 'title',
    location: 'location', city: 'location', 'based in': 'location',
    email: 'email', 'e-mail': 'email', mail: 'email',
    phone: 'phone', mobile: 'phone', tel: 'phone',
    linkedin: 'linkedin',
    github: 'github',
    website: 'website', site: 'website', web: 'website', portfolio: 'website', url: 'website',
    pdf: 'pdf', 'resume pdf': 'pdf', resumepdf: 'pdf', download: 'pdf'
};

/**
 * Parse resume markdown into:
 * {
 *   name, title,
 *   contact: { location, email, phone, linkedin, github, website, pdf, extra: [{label, value}] },
 *   sections: [{ title, items: [{ kind: 'bullet'|'para', text }],
 *                entries: [{ parts: [..], text: [..], bullets: [..] }] }],
 *   warnings: [..]
 * }
 */
function parseResume(markdown) {
    const resume = { name: '', title: '', contact: { extra: [] }, sections: [], warnings: [] };
    const src = String(markdown)
        .replace(/^﻿/, '')
        .replace(/\r\n?/g, '\n')
        .replace(/<!--[\s\S]*?-->/g, '');

    let section = null;       // current ## section
    let entry = null;         // current ### entry inside it
    let open = null;          // paragraph or bullet we can append continuation lines to

    const lines = src.split('\n');
    lines.forEach((rawLine, i) => {
        const line = rawLine.replace(/\s+$/, '');
        const trimmed = line.trim();

        if (!trimmed) { open = null; return; }
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { open = null; return; }   // horizontal rule

        let m;
        if ((m = /^#\s+(.+)$/.exec(trimmed))) {
            if (resume.name) resume.warnings.push(`Line ${i + 1}: only one "# Name" heading is used; ignoring "${m[1]}"`);
            else resume.name = mdToText(m[1].replace(/\s+#+$/, ''));
            section = null; entry = null; open = null;
            return;
        }
        if ((m = /^##\s+(.+)$/.exec(trimmed))) {
            section = { title: mdToText(m[1].replace(/\s+#+$/, '')), items: [], entries: [] };
            resume.sections.push(section);
            entry = null; open = null;
            return;
        }
        if ((m = /^#{3,6}\s+(.+)$/.exec(trimmed))) {
            if (!section) {
                resume.warnings.push(`Line ${i + 1}: "### ${m[1]}" is above the first "## Section"; ignored`);
                return;
            }
            const parts = m[1].replace(/\s+#+$/, '').split(/\s+\|\s+/).map(mdToText).filter(Boolean);
            entry = { parts, text: [], bullets: [] };
            section.entries.push(entry);
            open = null;
            return;
        }

        const bullet = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);
        const body = (bullet ? bullet[1] : trimmed).replace(/^>\s?/, '');

        // Header area (between "# Name" and the first "## Section")
        if (!section) {
            const kv = /^\*{0,2}([A-Za-z][A-Za-z -]{0,20}?)\*{0,2}\s*:\s*\*{0,2}\s*(.*)$/.exec(body);
            if (kv && !kv[2].startsWith('//')) {
                const label = kv[1].trim();
                const key = CONTACT_KEYS[label.toLowerCase()];
                const value = kv[2].replace(/^\*+\s*/, '').trim();
                if (!value) { open = null; return; }          // e.g. "- PDF:" left blank
                if (key) resume.contact[key] = value;
                else resume.contact.extra.push({ label, value });
                if (key === 'title') resume.title = mdToText(value);
            } else if (!resume.title) {
                resume.title = mdToText(body);
            } else {
                resume.contact.extra.push({ label: '', value: body });
            }
            open = null;
            return;
        }

        // Inside a section
        if (bullet) {
            const item = { kind: 'bullet', text: body };
            if (entry) entry.bullets.push(item.text);
            else section.items.push(item);
            open = { target: entry ? entry.bullets : section.items, index: (entry ? entry.bullets : section.items).length - 1, bullet: true };
            return;
        }

        // Continuation of the previous bullet or paragraph
        if (open) {
            const list = open.target;
            if (typeof list[open.index] === 'string') list[open.index] += ` ${body}`;
            else list[open.index].text += ` ${body}`;
            return;
        }

        if (entry) {
            entry.text.push(body);
            open = { target: entry.text, index: entry.text.length - 1 };
        } else {
            section.items.push({ kind: 'para', text: body });
            open = { target: section.items, index: section.items.length - 1 };
        }
    });

    // Skills-style sections may be written as one comma-separated line
    resume.sections.forEach(s => {
        if (/skill|tool|tech|stack|language/i.test(s.title)) {
            s.items = s.items.flatMap(it => it.kind === 'para' && it.text.includes(',')
                ? it.text.split(/\s*,\s*/).filter(Boolean).map(text => ({ kind: 'bullet', text }))
                : [it]);
        }
    });

    if (!resume.name) resume.warnings.push('No "# Your Name" heading found');
    if (!resume.sections.length) resume.warnings.push('No "## Section" headings found');
    resume.sections.forEach(s => {
        if (!s.items.length && !s.entries.length) resume.warnings.push(`Section "${s.title}" is empty`);
    });
    return resume;
}

// ---------- resume data → game sections ----------

// Paragraphs are split into sentences so each one can be unlocked separately
function splitSentences(text) {
    return mdToText(text).split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).filter(Boolean);
}

function entryHeading(e) {
    return [e.parts[0], e.parts.slice(1).join(' | ')].filter(Boolean);
}

function entryLines(e) {
    return [...entryHeading(e), ...e.text.flatMap(splitSentences), ...e.bullets.map(mdToText)];
}

function itemLines(items) {
    return items.flatMap(it => it.kind === 'para' ? splitSentences(it.text) : [mdToText(it.text)]);
}

// Every game uses these sections: a hit on any piece of a line unlocks that line.
function buildResumeSections(resume) {
    const c = resume.contact || {};
    const out = [];

    const header = [resume.name, resume.title, c.location, c.email, c.phone, c.linkedin, c.github, c.website]
        .filter(Boolean).map(mdToText);
    if (header.length) out.push({ title: 'PLAYER 1', lines: header });

    (resume.sections || []).forEach(s => {
        const items = itemLines(s.items);
        // Sections whose entries have bullets (e.g. jobs) get one level per entry
        if (s.entries.some(e => e.bullets.length)) {
            if (items.length) out.push({ title: s.title, lines: items });
            s.entries.forEach(e => {
                out.push({ title: `${s.title}: ${e.parts[1] || e.parts[0] || ''}`, lines: entryLines(e) });
            });
        } else {
            const lines = [...items, ...s.entries.flatMap(entryLines)];
            if (lines.length) out.push({ title: s.title, lines });
        }
    });

    let id = 0;
    return out
        .filter(s => s.lines.length)
        .map((s, si) => ({
            title: mdToText(s.title).toUpperCase(),
            lines: s.lines.map(text => ({ id: id++, section: si, text: String(text).toUpperCase() }))
        }));
}

// ---------- loading (browser) ----------

// ?resume=path/to/file.md previews another resume (relative .md paths only)
function resumePathFromUrl(fallback) {
    if (typeof location === 'undefined') return fallback;
    const p = new URLSearchParams(location.search).get('resume');
    if (p && /^[\w./-]+\.md$/i.test(p) && !p.includes('..') && !p.startsWith('/')) return p;
    return fallback;
}

async function loadResume(path) {
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
        throw new Error(`Browsers block reading ${path} when index.html is opened straight from disk. ` +
            'Run a local web server in this folder (for example: python3 -m http.server 8000) ' +
            'and open http://localhost:8000');
    }
    let res;
    try {
        res = await fetch(path, { cache: 'no-cache' });
    } catch (err) {
        throw new Error(`Could not download ${path}: ${err.message}`);
    }
    if (!res.ok) throw new Error(`Could not load ${path} (HTTP ${res.status}). Check the file exists next to index.html.`);
    const resume = parseResume(await res.text());
    resume.warnings.forEach(w => console.warn(`[resume] ${path}: ${w}`));
    if (!resume.name && !resume.sections.length) {
        throw new Error(`${path} loaded but no resume was found in it. Start it with "# Your Name" and add "## Section" headings.`);
    }
    return resume;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseResume, buildResumeSections, mdToText, mdToHtml, toHref, safeUrl };
}
