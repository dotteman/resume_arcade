// ============================================
// UI - start screen, reveal panel, resume view, toggles
// ============================================

const UI = {
    sections: [],
    lineById: new Map(),
    state: new Map(),      // line id -> 'hit' | 'missed'
    game: null,
    gameKey: null,
    modalOpen: false,
    pausedByModal: false,
    totalLines: 0,

    init() {
        this.sections = buildResumeSections();
        this.sections.forEach(s => s.lines.forEach(l => this.lineById.set(l.id, l)));
        this.totalLines = this.lineById.size;
        this.$ = (id) => document.getElementById(id);
        this.canvas = this.$('gameCanvas');

        this.loadPrefs();
        this.buildRevealPanel();
        this.renderResume();
        this.buildMenu();
        this.bindControls();
        this.updateUnlocked();

        const requested = new URLSearchParams(location.search).get('game');
        if (requested && GAMES[requested]) this.startGame(requested);
        else this.showMenu();
    },

    // ---------- preferences ----------
    loadPrefs() {
        let crt = 'on';
        try { crt = localStorage.getItem('resumeArcade.crt') || 'on'; } catch (_) { /* storage blocked */ }
        this.setCrt(crt !== 'off', false);
        let sound = 'on';
        try { sound = localStorage.getItem('resumeArcade.sound') || 'on'; } catch (_) {}
        this.setSound(sound !== 'off', false);
    },

    setCrt(on, save = true) {
        document.body.classList.toggle('no-crt', !on);
        this.$('btnCrt').textContent = `[C] CRT: ${on ? 'ON' : 'OFF'}`;
        this.$('btnCrt').setAttribute('aria-pressed', String(on));
        if (save) {
            try { localStorage.setItem('resumeArcade.crt', on ? 'on' : 'off'); } catch (_) { /* ignore */ }
        }
    },

    setSound(on, save = true) {
        ArcadeAudio.enabled = on;
        this.$('btnSound').textContent = `[V] SOUND: ${on ? 'ON' : 'OFF'}`;
        this.$('btnSound').setAttribute('aria-pressed', String(on));
        if (!on) ArcadeAudio.stop();
        if (save) {
            try { localStorage.setItem('resumeArcade.sound', on ? 'on' : 'off'); } catch (_) {}
        }
    },

    // ---------- menu & game lifecycle ----------
    buildMenu() {
        const list = this.$('menuList');
        list.innerHTML = '';
        Object.entries(GAMES).forEach(([key, g]) => {
            const b = document.createElement('button');
            b.className = 'menu-item';
            b.type = 'button';
            b.dataset.game = key;
            b.innerHTML = `<span class="menu-key">${g.key}</span><span class="menu-name">${g.title}</span><span class="menu-blurb">${g.blurb}</span>`;
            b.addEventListener('click', () => this.startGame(key));
            list.appendChild(b);
        });
    },

    showMenu() {
        if (this.game) { this.game.destroy(); this.game = null; }
        this.gameKey = null;
        this.setTitle('RESUME ARCADE');
        this.$('instructions').textContent = 'PICK A GAME — EVERY HIT UNLOCKS PART OF THE RESUME';
        this.$('footerText').textContent = 'PRESS 1, 2, 3 OR 4 TO INSERT COIN';
        this.$('btnPause').hidden = true;
        this.$('menu').hidden = false;
        history.replaceState(null, '', location.pathname);
        const def = this.$('menuList').querySelector(`[data-game="${GAME_CONFIG.defaultGame}"]`)
            || this.$('menuList').firstElementChild;
        if (def && !this.modalOpen) def.focus({ preventScroll: true });
    },

    startGame(key) {
        const def = GAMES[key];
        if (!def) return;
        if (this.game) this.game.destroy();
        this.$('menu').hidden = true;
        this.gameKey = key;
        this.setTitle(def.title);
        this.$('instructions').textContent = def.help;
        this.$('footerText').textContent = 'R READ RESUME • P PAUSE • M MENU';
        this.$('btnPause').hidden = false;
        this.$('btnPause').textContent = '[P] PAUSE';
        history.replaceState(null, '', `${location.pathname}?game=${key}`);
        this.game = def.create(this.canvas, this);
        this.game.start();
        ArcadeAudio.play('select');
        this.canvas.focus({ preventScroll: true });
    },

    setTitle(text) {
        const h = this.$('gameTitle');
        h.textContent = text;
        h.setAttribute('data-text', text);
        document.title = `${text} — ${RESUME_CONFIG.personal.name}`;
    },

    onPauseChanged(paused) {
        this.$('btnPause').textContent = paused ? '[P] RESUME' : '[P] PAUSE';
    },

    // ---------- controls ----------
    bindControls() {
        document.addEventListener('pointerdown', () => ArcadeAudio.unlock(), true);
        document.addEventListener('keydown', e => {
            if (!e.ctrlKey && !e.metaKey && !e.altKey) ArcadeAudio.unlock();
        }, true);
        this.$('btnSound').addEventListener('click', () => {
            this.setSound(!ArcadeAudio.enabled);
            ArcadeAudio.unlock();
            if (ArcadeAudio.enabled) ArcadeAudio.play('select');
            this.$('btnSound').blur();
        });
        const blurAfter = (fn) => (e) => { fn(); e.currentTarget.blur(); };
        this.$('btnResume').addEventListener('click', blurAfter(() => this.openResume()));
        this.$('btnMenu').addEventListener('click', blurAfter(() => this.showMenu()));
        this.$('btnCrt').addEventListener('click', blurAfter(() =>
            this.setCrt(document.body.classList.contains('no-crt'))));
        this.$('btnPause').addEventListener('click', blurAfter(() => this.game && this.game.togglePause()));
        this.$('menuRead').addEventListener('click', () => this.openResume());
        this.$('rvClose').addEventListener('click', () => this.closeResume());
        this.$('rvPrint').addEventListener('click', () => window.print());

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (this.modalOpen) {
                if (e.code === 'Escape' || e.code === 'KeyR') { e.preventDefault(); this.closeResume(); }
                return;
            }
            switch (e.code) {
                case 'KeyR': this.openResume(); break;
                case 'KeyV':
                    if (e.repeat) break;
                    this.setSound(!ArcadeAudio.enabled);
                    ArcadeAudio.unlock();
                    if (ArcadeAudio.enabled) ArcadeAudio.play('select');
                    break;
                case 'KeyC': this.setCrt(document.body.classList.contains('no-crt')); break;
                case 'KeyM': if (this.game) this.showMenu(); break;
                case 'KeyP':
                case 'Escape': if (this.game) this.game.togglePause(); break;
                case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4':
                case 'Numpad1': case 'Numpad2': case 'Numpad3': case 'Numpad4': {
                    if (this.game) break;
                    const n = e.code.slice(-1);
                    const key = Object.keys(GAMES).find(k => GAMES[k].key === n);
                    if (key) this.startGame(key);
                    break;
                }
                case 'ArrowDown': case 'ArrowUp': {
                    if (this.game) break;
                    const items = [...document.querySelectorAll('.menu-item, #menuRead')];
                    const i = items.indexOf(document.activeElement);
                    const next = items[(i + (e.code === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
                    next.focus();
                    e.preventDefault();
                    break;
                }
            }
        });
    },

    // ---------- reveal panel ----------
    buildRevealPanel() {
        const list = this.$('revealList');
        list.innerHTML = '';
        this.sections.forEach((s, si) => {
            const sec = document.createElement('section');
            sec.className = 'reveal-section';
            sec.id = `rs-${si}`;
            const h = document.createElement('h3');
            h.innerHTML = `<span>${escapeHtml(s.title)}</span><span class="reveal-count" id="rc-${si}">0/${s.lines.length}</span>`;
            sec.appendChild(h);
            const ul = document.createElement('ul');
            s.lines.forEach(l => {
                const li = document.createElement('li');
                li.id = `rl-${l.id}`;
                li.className = 'locked';
                li.textContent = l.text;
                ul.appendChild(li);
            });
            sec.appendChild(ul);
            list.appendChild(sec);
        });
    },

    revealLine(id, missed = false) {
        if (this.state.has(id)) return { isNew: false, complete: false };
        this.state.set(id, missed ? 'missed' : 'hit');
        const line = this.lineById.get(id);
        const li = this.$(`rl-${id}`);
        if (li) {
            li.className = missed ? 'missed' : 'revealed';
            const panel = this.$('revealPanel');
            if (panel.offsetParent !== null) {
                const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                li.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
            }
        }
        const section = this.sections[line.section];
        const done = section.lines.filter(l => this.state.has(l.id)).length;
        this.$(`rc-${line.section}`).textContent =
            done === section.lines.length ? 'UNLOCKED' : `${done}/${section.lines.length}`;
        if (done === section.lines.length) this.$(`rs-${line.section}`).classList.add('complete');
        this.$('ticker').textContent = `UNLOCKED: ${line.text}`;
        this.updateUnlocked();
        return { isNew: true, complete: this.state.size === this.totalLines };
    },

    isSectionComplete(si) {
        return this.sections[si].lines.every(l => this.state.has(l.id));
    },

    firstIncompleteSection() {
        const i = this.sections.findIndex((s, si) => !this.isSectionComplete(si));
        return i === -1 ? 0 : i;
    },

    updateUnlocked() {
        this.$('unlocked').textContent = `${this.state.size}/${this.totalLines}`;
    },

    setScore(score, hits) {
        this.$('score').textContent = String(score).padStart(4, '0');
        this.$('hits').textContent = hits;
    },

    // ---------- readable resume ----------
    renderResume() {
        const r = RESUME_CONFIG;
        const p = r.personal || {};
        const url = (s) => (/^https?:\/\//i.test(s) ? s : `https://${s}`);
        const contact = [];
        if (p.location) contact.push(`<li>${escapeHtml(p.location)}</li>`);
        if (p.email) contact.push(`<li><a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></li>`);
        if (p.linkedin) contact.push(`<li><a href="${escapeHtml(url(p.linkedin))}" target="_blank" rel="noopener">${escapeHtml(p.linkedin)}</a></li>`);
        if (p.github) contact.push(`<li><a href="${escapeHtml(url(p.github))}" target="_blank" rel="noopener">${escapeHtml(p.github)}</a></li>`);

        let html = `
            <header class="rv-header">
                <h2 id="rvName">${escapeHtml(p.name || '')}</h2>
                <p class="rv-title">${escapeHtml(p.title || '')}</p>
                <ul class="rv-contact">${contact.join('')}</ul>
            </header>`;

        if (r.summary && r.summary.length) {
            html += `<section><h3>Summary</h3><p>${escapeHtml(r.summary.join(' '))}</p></section>`;
        }
        if (r.skills && r.skills.length) {
            html += `<section><h3>Skills</h3><ul class="rv-skills">${r.skills.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></section>`;
        }
        if (r.experience && r.experience.length) {
            html += `<section><h3>Experience</h3>${r.experience.map(j => `
                <article class="rv-job">
                    <div class="rv-job-head">
                        <h4>${escapeHtml(j.title)} <span class="rv-company">@ ${escapeHtml(j.company)}</span></h4>
                        <span class="rv-period">${escapeHtml(j.period || '')}</span>
                    </div>
                    <ul>${(j.achievements || []).map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
                </article>`).join('')}</section>`;
        }
        if (r.education && r.education.length) {
            html += `<section><h3>Education</h3><ul class="rv-plain">${r.education.map(e =>
                `<li><strong>${escapeHtml(e.degree)}</strong> — ${escapeHtml(e.school)}${e.year ? ` (${escapeHtml(e.year)})` : ''}</li>`).join('')}</ul></section>`;
        }
        if (r.projects && r.projects.length) {
            html += `<section><h3>Projects</h3><ul class="rv-plain">${r.projects.map(pr =>
                `<li><strong>${escapeHtml(pr.name)}</strong> — ${escapeHtml(pr.description || '')}${pr.tech ? ` <em>[${escapeHtml(pr.tech)}]</em>` : ''}</li>`).join('')}</ul></section>`;
        }
        this.$('rvBody').innerHTML = html;

        const pdf = this.$('rvPdf');
        if (p.resumePdf) { pdf.href = p.resumePdf; pdf.hidden = false; }
    },

    openResume() {
        if (this.modalOpen) return;
        this.modalOpen = true;
        this.lastFocus = document.activeElement;
        if (this.game && !this.game.paused) { this.game.togglePause(); this.pausedByModal = true; }
        this.$('resumeView').hidden = false;
        this.$('rvClose').focus();
    },

    closeResume() {
        if (!this.modalOpen) return;
        this.modalOpen = false;
        this.$('resumeView').hidden = true;
        if (this.game && this.pausedByModal && this.game.paused) this.game.togglePause();
        this.pausedByModal = false;
        if (this.game) this.canvas.focus({ preventScroll: true });
        else if (this.lastFocus) this.lastFocus.focus({ preventScroll: true });
    }
};

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Wait for the pixel font so the canvas never draws with a fallback font
window.addEventListener('DOMContentLoaded', () => {
    const ready = document.fonts && document.fonts.load
        ? Promise.race([
            Promise.all([document.fonts.load(`16px ${FONT}`), document.fonts.load('20px "VT323"')]),
            new Promise(r => setTimeout(r, 2500))
        ])
        : Promise.resolve();
    ready.catch(() => {}).then(() => UI.init());
});
