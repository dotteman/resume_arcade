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

    init(resume) {
        this.resume = resume;
        this.sections = buildResumeSections(resume);
        this.sections.forEach(s => s.lines.forEach(l => this.lineById.set(l.id, l)));
        this.totalLines = this.lineById.size;
        this.$ = (id) => document.getElementById(id);
        this.canvas = this.$('gameCanvas');
        this.canvas.setAttribute('aria-label',
            `Arcade game built from ${resume.name || 'this'} resume. Press R for a readable version.`);

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
        history.replaceState(null, '', urlWithGame(null));
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
        history.replaceState(null, '', urlWithGame(key));
        this.game = def.create(this.canvas, this);
        this.game.start();
        ArcadeAudio.play('select');
        this.canvas.focus({ preventScroll: true });
    },

    setTitle(text) {
        const h = this.$('gameTitle');
        h.textContent = text;
        h.setAttribute('data-text', text);
        document.title = this.resume.name ? `${text} — ${this.resume.name}` : text;
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
        const r = this.resume;
        const c = r.contact || {};
        const link = (value, href) => href
            ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(mdToText(value))}</a>`
            : escapeHtml(mdToText(value));
        const contact = [];
        if (c.location) contact.push(`<li>${mdToHtml(c.location)}</li>`);
        if (c.email) contact.push(`<li>${link(c.email, toHref(c.email))}</li>`);
        if (c.phone) contact.push(`<li>${link(c.phone, safeUrl(`tel:${mdToText(c.phone).replace(/[^\d+]/g, '')}`))}</li>`);
        ['linkedin', 'github', 'website'].forEach(k => {
            if (c[k]) contact.push(`<li>${link(c[k], toHref(c[k]))}</li>`);
        });
        (c.extra || []).forEach(x => contact.push(
            `<li>${x.label ? `${escapeHtml(x.label)}: ` : ''}${mdToHtml(x.value)}</li>`));

        let html = `
            <header class="rv-header">
                <h2 id="rvName">${escapeHtml(r.name || '')}</h2>
                ${r.title ? `<p class="rv-title">${escapeHtml(r.title)}</p>` : ''}
                <ul class="rv-contact">${contact.join('')}</ul>
            </header>`;

        (r.sections || []).forEach(s => {
            const isSkills = /skill|tool|tech|stack|language/i.test(s.title);
            const isJobs = /experience|employment|work|career/i.test(s.title);
            let body = '';
            if (s.items.length) {
                if (s.items.every(it => it.kind === 'para')) {
                    body += s.items.map(it => `<p>${mdToHtml(it.text)}</p>`).join('');
                } else {
                    body += `<ul class="${isSkills ? 'rv-skills' : 'rv-list'}">${s.items.map(it => `<li>${mdToHtml(it.text)}</li>`).join('')}</ul>`;
                }
            }
            body += s.entries.map(e => {
                const [head, sub, ...rest] = e.parts;
                const subHtml = sub ? ` <span class="rv-company">${isJobs ? '@ ' : '— '}${escapeHtml(sub)}</span>` : '';
                return `
                <article class="rv-job">
                    <div class="rv-job-head">
                        <h4>${escapeHtml(head || '')}${subHtml}</h4>
                        ${rest.length ? `<span class="rv-period">${escapeHtml(rest.join(' | '))}</span>` : ''}
                    </div>
                    ${e.text.map(t => `<p>${mdToHtml(t)}</p>`).join('')}
                    ${e.bullets.length ? `<ul>${e.bullets.map(b => `<li>${mdToHtml(b)}</li>`).join('')}</ul>` : ''}
                </article>`;
            }).join('');
            html += `<section><h3>${escapeHtml(s.title)}</h3>${body}</section>`;
        });
        this.$('rvBody').innerHTML = html;

        const pdf = this.$('rvPdf');
        const pdfHref = c.pdf && safeUrl(mdToText(c.pdf));
        if (pdfHref) { pdf.href = pdfHref; pdf.hidden = false; }
    },

    // Shown instead of the menu when resume.md can't be loaded
    showLoadError(err) {
        const menu = document.getElementById('menu');
        document.getElementById('instructions').textContent = 'RESUME FILE NOT LOADED';
        menu.innerHTML = `
            <h2 class="menu-title">RESUME NOT FOUND</h2>
            <p class="menu-error">${escapeHtml(err.message)}</p>`;
        menu.hidden = false;
        console.error(err);
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

// Current page URL with ?game= set (or removed), keeping other params like ?resume=
function urlWithGame(game) {
    const params = new URLSearchParams(location.search);
    if (game) params.set('game', game); else params.delete('game');
    const q = params.toString().replace(/%2F/gi, "/");
    return `${location.pathname}${q ? `?${q}` : ''}`;
}

// Load resume.md and wait for the pixel font (so the canvas never draws with a fallback font)
window.addEventListener('DOMContentLoaded', () => {
    const ready = document.fonts && document.fonts.load
        ? Promise.race([
            Promise.all([document.fonts.load(`16px ${FONT}`), document.fonts.load('20px "VT323"')]),
            new Promise(r => setTimeout(r, 2500))
        ])
        : Promise.resolve();
    const resume = loadResume(resumePathFromUrl(GAME_CONFIG.resumeFile || 'resume.md'));
    Promise.all([ready.catch(() => {}), resume])
        .then(([, data]) => UI.init(data))
        .catch(err => UI.showLoadError(err));
});
