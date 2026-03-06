// kore-js/devtools-page.client.js  (CLIENT ONLY)

export function initPagePanel() {
    const body = document.getElementById('kor-panel-page-body');
    const countEl = document.getElementById('kor-panel-page-count');
    if (!body) return;

    // Cache LCP via PerformanceObserver (replaces deprecated getEntriesByType)
    let _lcpValue = null;
    try {
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length) _lcpValue = entries.at(-1).startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}

    window.__korDevtools._onNavigate = () => _render();

    // ── Shared helpers ─────────────────────────────────────────────────────────

    function _badge(text, bg, fg) {
        return `<span style="background:${bg};color:${fg};border-radius:3px;
      padding:1px 6px;font-size:10px;font-family:monospace;white-space:nowrap;">${text}</span>`;
    }

    function _pill(text, color) {
        return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;
      border-radius:3px;padding:1px 5px;font-size:10px;font-family:monospace;">${text}</span>`;
    }

    // Traffic-light chip: green / yellow / red
    function _status(type, text) {
        const map = { ok: '#22c55e', warn: '#f59e0b', error: '#ef4444' };
        const icon = { ok: '✓', warn: '⚠', error: '✕' };
        const c = map[type] ?? map.ok;
        return `<span style="color:${c};font-size:11px;font-weight:600;">${icon[type]} ${text}</span>`;
    }

    function _section(title, accentColor, rows) {
        if (!rows.length) return '';
        const rowsHtml = rows
            .map(
                ([label, value]) => `
      <div style="display:grid;grid-template-columns:140px 1fr;gap:8px;
        padding:5px 0;border-bottom:1px solid #0a0f1a;font-size:11px;align-items:start;">
        <span style="color:#94a3b8;padding-top:1px;">${label}</span>
        <span style="color:#e2e8f0;word-break:break-all;line-height:1.5;">${value}</span>
      </div>
    `,
            )
            .join('');
        return `
      <div style="background:#0f172a;border:1px solid #1e293b;
        border-top:2px solid ${accentColor};border-radius:8px;
        padding:12px;margin-bottom:10px;">
        <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
          letter-spacing:0.08em;margin-bottom:8px;font-weight:700;">${title}</div>
        ${rowsHtml}
      </div>
    `;
    }

    // ── Route ─────────────────────────────────────────────────────────────────

    function _routeRows() {
        return [
            ['Path', location.pathname + (location.search || '')],
            ['Title', document.title || '—'],
            ['Hash', location.hash || '—'],
            ['Referrer', document.referrer || '—'],
        ];
    }

    // ── Head inspection ───────────────────────────────────────────────────────
    // Shows everything in <head> — meta, link, script, style tags

    function _headSection() {
        const rows = [];

        // title
        rows.push(['&lt;title&gt;', document.title || '<em style="color:#475569">missing</em>']);

        // All meta tags
        document.querySelectorAll('meta').forEach((el) => {
            const attrs = [...el.attributes].map((a) => `${a.name}="${a.value}"`).join(' ');
            rows.push([`&lt;meta&gt;`, `<span style="color:#94a3b8;">${attrs}</span>`]);
        });

        // Link tags
        document.querySelectorAll('link').forEach((el) => {
            const rel = el.getAttribute('rel') ?? '';
            const href = el.getAttribute('href') ?? '';
            const type = el.getAttribute('type') ?? '';
            const label = rel ? `<span style="color:#60a5fa">${rel}</span>` : '?';
            rows.push([
                `&lt;link&gt;`,
                `${label} ${href ? `<span style="color:#64748b">${href.length > 50 ? href.slice(0, 50) + '…' : href}</span>` : ''} ${type ? `<span style="color:#475569">${type}</span>` : ''}`,
            ]);
        });

        // Script tags in head
        document.querySelectorAll('head script').forEach((el) => {
            const src = el.getAttribute('src') ?? '';
            const type = el.getAttribute('type') ?? '';
            rows.push([
                `&lt;script&gt;`,
                `<span style="color:#f59e0b">${src ? (src.length > 50 ? src.slice(0, 50) + '…' : src) : 'inline'}</span>${type ? ` <span style="color:#475569">${type}</span>` : ''}`,
            ]);
        });

        // Style tags in head
        const styles = document.querySelectorAll('head style');
        if (styles.length)
            rows.push([
                '&lt;style&gt;',
                `${styles.length} inline style block${styles.length !== 1 ? 's' : ''}`,
            ]);

        return rows;
    }

    // ── Stores summary ────────────────────────────────────────────────────────

    function _storeRows() {
        const rows = [];
        window.__kor_stores?.forEach((meta, name) => {
            const keys = Object.keys(meta.store.getState()).length;
            const updates = meta.store._updateCount?.() ?? 0;
            const subs = meta.store._subCount?.() ?? 0;
            rows.push([
                name,
                `${_badge(keys + ' keys', '#0f2744', '#60a5fa')} &nbsp;` +
                    `${_badge(subs + ' subs', '#0f2a1a', '#34d399')} &nbsp;` +
                    `${_badge(updates + ' upd', '#1e293b', '#94a3b8')}`,
            ]);
        });
        return rows;
    }

    // ── Performance ───────────────────────────────────────────────────────────

    function _perfRows() {
        const rows = [];
        try {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) {
                const dns = Math.round(nav.domainLookupEnd - nav.domainLookupStart);
                const tcp = Math.round(nav.connectEnd - nav.connectStart);
                const ttfb = Math.round(nav.responseStart - nav.requestStart);
                const domLoad = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
                const total = Math.round(nav.loadEventEnd - nav.startTime);
                if (dns > 0) rows.push(['DNS lookup', dns + 'ms']);
                if (tcp > 0) rows.push(['TCP connect', tcp + 'ms']);
                rows.push(['TTFB', ttfb + 'ms']);
                rows.push(['DOM ready', domLoad + 'ms']);
                if (total > 0) rows.push(['Page load', total + 'ms']);
            }
            if (_lcpValue !== null) rows.push(['LCP', Math.round(_lcpValue) + 'ms']);
        } catch {}
        try {
            const mem = performance.memory;
            if (mem) {
                const mb = (v) => (v / (1024 * 1024)).toFixed(1) + ' MB';
                rows.push(['JS heap used', mb(mem.usedJSHeapSize)]);
                rows.push(['JS heap total', mb(mem.totalJSHeapSize)]);
            }
        } catch {}
        return rows;
    }

    // ── HTML structure ────────────────────────────────────────────────────────

    function _structureSection() {
        // Exclude the devtools root itself from all counts
        const app = document.getElementById('kor-app') ?? document.body;

        // Tag counts — only inside #kor-app
        const TAG_LIST = [
            'div',
            'section',
            'article',
            'main',
            'nav',
            'header',
            'footer',
            'ul',
            'ol',
            'li',
            'p',
            'a',
            'button',
            'form',
            'input',
            'textarea',
            'select',
            'img',
            'table',
            'span',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
        ];
        const tagCounts = {};
        TAG_LIST.forEach((tag) => {
            const n = app.querySelectorAll(tag).length;
            if (n > 0) tagCounts[tag] = n;
        });

        const totalEls = app.querySelectorAll('*').length;

        // DOM depth
        function _depth(el, d = 0) {
            let max = d;
            for (const child of el.children) max = Math.max(max, _depth(child, d + 1));
            return max;
        }
        const domDepth = _depth(app);

        // All IDs in use
        const ids = [...app.querySelectorAll('[id]')]
            .map((el) => el.id)
            .filter((id) => !id.startsWith('kor-')); // exclude devtools own IDs

        // Top classes by frequency
        const classCounts = {};
        app.querySelectorAll('[class]').forEach((el) => {
            el.className
                .split(' ')
                .filter(Boolean)
                .forEach((c) => {
                    if (!c.startsWith('kor-')) classCounts[c] = (classCounts[c] ?? 0) + 1;
                });
        });
        const topClasses = Object.entries(classCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12);

        // data-* attributes in use
        const dataAttrs = new Set();
        app.querySelectorAll('*').forEach((el) => {
            Object.keys(el.dataset).forEach((k) =>
                dataAttrs.add('data-' + k.replace(/([A-Z])/g, '-$1').toLowerCase()),
            );
        });

        const tagRows = Object.entries(tagCounts)
            .map(
                ([tag, n]) =>
                    `${_pill(tag, '#7dd3fc')} <span style="color:#94a3b8;margin-left:4px;">×${n}</span>`,
            )
            .join(' &nbsp;');

        const idPills = ids.length
            ? ids.map((id) => _pill('#' + id, '#a78bfa')).join(' &nbsp;')
            : '<span style="color:#64748b;font-style:italic;">none</span>';

        const classPills = topClasses.length
            ? topClasses
                  .map(
                      ([c, n]) =>
                          `${_pill('.' + c, '#34d399')} <span style="color:#475569;font-size:10px;">×${n}</span>`,
                  )
                  .join(' &nbsp;')
            : '<span style="color:#64748b;font-style:italic;">none</span>';

        const dataPills = dataAttrs.size
            ? [...dataAttrs]
                  .slice(0, 10)
                  .map((a) => _pill(a, '#f59e0b'))
                  .join(' &nbsp;')
            : '<span style="color:#64748b;font-style:italic;">none</span>';

        const rows = [
            ['Total elements', String(totalEls)],
            ['DOM depth', String(domDepth)],
            ['Tags', tagRows || '—'],
            ['IDs in use', idPills],
            ['Top classes', classPills],
            ['data-* attrs', dataPills],
        ];

        return _section('HTML structure', '#f59e0b', rows);
    }

    // ── SEO audit ─────────────────────────────────────────────────────────────

    function _seoSection() {
        const issues = []; // filled with { type, msg } — type: ok|warn|error
        const rows = [];

        // Title
        const title = document.title ?? '';
        const titleLen = title.length;
        if (!title) {
            issues.push('error');
            rows.push(['Title', _status('error', 'Missing <title>')]);
        } else if (titleLen < 30) {
            issues.push('warn');
            rows.push([
                'Title',
                _status('warn', `Too short (${titleLen} chars, aim 50–60) — "${title}"`),
            ]);
        } else if (titleLen > 60) {
            issues.push('warn');
            rows.push([
                'Title',
                _status(
                    'warn',
                    `Too long (${titleLen} chars, aim 50–60) — "${title.slice(0, 60)}…"`,
                ),
            ]);
        } else {
            rows.push(['Title', _status('ok', `${titleLen} chars — "${title}"`)]);
        }

        // Meta description
        const desc =
            document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
        const descLen = desc.length;
        if (!desc) {
            issues.push('error');
            rows.push(['Description', _status('error', 'Missing meta description')]);
        } else if (descLen < 80) {
            issues.push('warn');
            rows.push([
                'Description',
                _status('warn', `Too short (${descLen} chars, aim 120–160)`),
            ]);
        } else if (descLen > 160) {
            issues.push('warn');
            rows.push(['Description', _status('warn', `Too long (${descLen} chars, aim 120–160)`)]);
        } else {
            rows.push(['Description', _status('ok', `${descLen} chars`)]);
        }

        // H1
        const h1s = document.querySelectorAll('h1');
        if (h1s.length === 0) {
            issues.push('error');
            rows.push(['H1', _status('error', 'No <h1> found')]);
        } else if (h1s.length > 1) {
            issues.push('warn');
            rows.push(['H1', _status('warn', `${h1s.length} <h1> tags (should be exactly 1)`)]);
        } else {
            rows.push(['H1', _status('ok', `"${h1s[0].textContent.trim().slice(0, 60)}"`)]);
        }

        // Heading hierarchy (no skipped levels)
        const headingLevels = [1, 2, 3, 4, 5, 6].filter((n) => document.querySelector(`h${n}`));
        let skipped = false;
        for (let i = 1; i < headingLevels.length; i++) {
            if (headingLevels[i] - headingLevels[i - 1] > 1) {
                skipped = true;
                break;
            }
        }
        if (skipped) {
            issues.push('warn');
            rows.push([
                'Headings',
                _status(
                    'warn',
                    `Skipped heading level — found: ${headingLevels.map((n) => 'H' + n).join('→')}`,
                ),
            ]);
        } else if (headingLevels.length > 0) {
            rows.push(['Headings', _status('ok', headingLevels.map((n) => 'H' + n).join('→'))]);
        }

        // Images without alt
        const imgs = [...document.querySelectorAll('img')];
        const noAlt = imgs.filter((img) => !img.hasAttribute('alt') || img.alt.trim() === '');
        if (noAlt.length > 0) {
            issues.push(noAlt.length > 2 ? 'error' : 'warn');
            rows.push([
                'Images',
                _status(
                    noAlt.length > 2 ? 'error' : 'warn',
                    `${noAlt.length} of ${imgs.length} img${imgs.length !== 1 ? 's' : ''} missing alt`,
                ),
            ]);
        } else if (imgs.length > 0) {
            rows.push(['Images', _status('ok', `All ${imgs.length} images have alt`)]);
        }

        // Links without text
        const links = [...document.querySelectorAll('a[href]')];
        const emptyLinks = links.filter(
            (a) => !a.textContent.trim() && !a.querySelector('img[alt]'),
        );
        if (emptyLinks.length > 0) {
            issues.push('warn');
            rows.push([
                'Links',
                _status(
                    'warn',
                    `${emptyLinks.length} link${emptyLinks.length !== 1 ? 's' : ''} with no text`,
                ),
            ]);
        } else if (links.length > 0) {
            rows.push(['Links', _status('ok', `${links.length} links, all have text`)]);
        }

        // Canonical
        const canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            issues.push('warn');
            rows.push(['Canonical', _status('warn', 'No canonical link tag')]);
        } else {
            rows.push(['Canonical', _status('ok', canonical.href)]);
        }

        // OG tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        const ogMissing = [
            !ogTitle && 'og:title',
            !ogDesc && 'og:description',
            !ogImage && 'og:image',
        ].filter(Boolean);
        if (ogMissing.length === 3) {
            issues.push('warn');
            rows.push(['Open Graph', _status('warn', 'No OG tags found')]);
        } else if (ogMissing.length > 0) {
            issues.push('warn');
            rows.push(['Open Graph', _status('warn', `Missing: ${ogMissing.join(', ')}`)]);
        } else {
            rows.push(['Open Graph', _status('ok', 'og:title, og:description, og:image present')]);
        }

        // Robots / indexability
        const robotsMeta =
            document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
        if (robotsMeta.includes('noindex')) {
            issues.push('warn');
            rows.push(['Robots', _status('warn', `noindex set — page won't be indexed`)]);
        } else {
            rows.push(['Robots', _status('ok', robotsMeta || 'index, follow (default)')]);
        }

        // Lang attribute
        const lang = document.documentElement.getAttribute('lang');
        if (!lang) {
            issues.push('warn');
            rows.push(['Lang attr', _status('warn', 'Missing lang attribute on <html>')]);
        } else {
            rows.push(['Lang attr', _status('ok', lang)]);
        }

        // Update count badge with issue count (0 is the goal)
        const errorCount = issues.filter((i) => i === 'error').length;
        const warnCount = issues.filter((i) => i === 'warn').length;
        if (countEl) {
            const total = errorCount + warnCount;
            countEl.textContent = total === 0 ? '✓' : total;
            countEl.style.background =
                errorCount > 0 ? '#450a0a' : warnCount > 0 ? '#431407' : '#0f2a1a';
            countEl.style.color =
                errorCount > 0 ? '#f87171' : warnCount > 0 ? '#fb923c' : '#34d399';
        }

        return _section('SEO audit', '#22c55e', rows);
    }

    // ── Main render ────────────────────────────────────────────────────────────

    function _render() {
        const totalListeners = window.__kor_events?.size ?? 0;
        const totalFires = [...(window.__kor_events?.values() ?? [])].reduce(
            (n, e) => n + e.fires,
            0,
        );

        body.innerHTML =
            _section('Route', '#3b82f6', _routeRows()) +
            _section('Head', '#3b82f6', _headSection()) +
            _section('Stores', '#3b82f6', _storeRows()) +
            _section('Event listeners', '#3b82f6', [
                ['Attached', String(totalListeners)],
                ['Total fires', String(totalFires)],
            ]) +
            _structureSection() +
            _seoSection() +
            _section('Performance', '#3b82f6', _perfRows());
    }

    _render();
}