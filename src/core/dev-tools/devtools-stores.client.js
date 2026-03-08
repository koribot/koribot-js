// koribot-js/devtools-stores.client.js  (CLIENT ONLY)

export function initStoresPanel() {
    const body = document.getElementById('kor-panel-stores-body');
    const clearBtn = document.getElementById('kor-panel-stores-clear');
    const searchEl = document.getElementById('kor-panel-stores-search');
    const countEl = document.getElementById('kor-panel-stores-count');
    if (!body) return;

    let _query = '';

    searchEl?.addEventListener('input', (e) => {
        _query = e.target.value.toLowerCase();
        _render();
    });

    // ── Push hook ──────────────────────────────────────────────────────────────
    let _renderTimer = null;
    window.__korDevtools._onStoreUpdate = () => {
        const panel = document.getElementById('kor-panel-stores');
        if (!panel || panel.style.display === 'none') return;
        clearTimeout(_renderTimer);
        _renderTimer = setTimeout(_render, 16);
    };

    // ── Refresh hook — called by devtools-overlay.js every time panel opens ───
    window.__korDevtools._refreshStores = () => _render();

    // ── Formatters ─────────────────────────────────────────────────────────────

    function _fmt(v) {
        if (v === null) return '<span style="color:#64748b">null</span>';
        if (v === undefined) return '<span style="color:#64748b">undefined</span>';
        if (typeof v === 'boolean') return `<span style="color:#f59e0b">${v}</span>`;
        if (typeof v === 'number') return `<span style="color:#34d399">${v}</span>`;
        if (typeof v === 'string') {
            const s = v.length > 36 ? v.slice(0, 36) + '…' : v;
            return `<span style="color:#f87171">"${s}"</span>`;
        }
        if (Array.isArray(v)) return `<span style="color:#818cf8">Array(${v.length})</span>`;
        if (typeof v === 'object') {
            const keys = Object.keys(v);
            return `<span style="color:#818cf8">{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''}}</span>`;
        }
        return `<span style="color:#e2e8f0">${String(v)}</span>`;
    }

    function _timeStr(ms) {
        return new Date(ms).toLocaleTimeString([], {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    function _hl(str) {
        if (!_query || !str) return str;
        const idx = str.toLowerCase().indexOf(_query);
        if (idx === -1) return str;
        return (
            str.slice(0, idx) +
            `<mark style="background:#1d4ed8;color:#fff;border-radius:2px;">${str.slice(idx, idx + _query.length)}</mark>` +
            str.slice(idx + _query.length)
        );
    }

    // ── Pill builders ──────────────────────────────────────────────────────────

    // Renders a subscriber pill for a dom.js element binding OR a computed node.
    // type === 'computed' gets a distinct purple treatment with a → arrow.
    function _bindingPill(id, { type, getValue, src }) {
        const liveVal = getValue ? _fmt(getValue()) : null;
        const isComputed = type === 'computed';

        const typeBadge = isComputed
            ? `<span style="background:#2e1065;color:#a78bfa;border-radius:2px;
           padding:0 5px;font-size:9px;font-weight:700;">→ computed</span>`
            : `<span style="background:#1e3a5f;color:#93c5fd;border-radius:2px;
           padding:0 4px;font-size:9px;">.${type}()</span>`;

        const idColor = isComputed ? '#a78bfa' : '#7dd3fc';
        const bg = isComputed ? '#1a0f2a' : '#0f2744';
        const border = isComputed ? '#4c1d95' : '#1e3a5f';

        return `<span style="
        background:${bg};color:${idColor};border:1px solid ${border};
        border-radius:3px;padding:2px 6px;font-size:10px;
        display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap;">
      <span style="color:${idColor};max-width:120px;overflow:hidden;
        text-overflow:ellipsis;white-space:nowrap;font-size:10px;"
        title="${id}">${isComputed ? id.replace(/^computed\(/, '⟨').replace(/\)$/, '⟩') : '#' + id}</span>
      ${typeBadge}
      ${
          src !== null && !isComputed
              ? `<span style="color:#8899aa;font-size:9px;font-family:monospace;
            max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            title="${src}">${src}</span>`
              : ''
      }
      ${
          liveVal !== null
              ? `<span style="background:${isComputed ? '#1a0a2e' : '#0a1f0f'};
            color:${isComputed ? '#c4b5fd' : '#4ade80'};border-radius:2px;
            padding:0 4px;font-size:9px;font-family:monospace;">${liveVal}</span>`
              : ''
      }
    </span>`;
    }

    function _manualPillCompact({ id, label }) {
        return `<span style="
        background:#1a0f2a;color:#c4b5fd;border:1px solid #4c1d95;
        border-radius:3px;padding:2px 6px;font-size:10px;
        display:inline-flex;gap:5px;align-items:center;"
        title="${label}">
      <span style="color:#7c3aed;font-size:9px;font-weight:700;flex-shrink:0;">ƒ</span>
      <span style="color:#a78bfa;font-size:9px;flex-shrink:0;">${id}</span>
      <span style="color:#6d28d9;font-size:9px;font-family:monospace;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        max-width:160px;">${label}</span>
    </span>`;
    }

    function _manualPillFull({ id, label, registeredAt, keys }) {
        const keyTags = (keys ?? [])
            .map(
                (k) =>
                    `<span style="background:#2e1065;color:#a78bfa;border-radius:3px;
        padding:1px 5px;font-size:9px;font-family:monospace;">${k}</span>`,
            )
            .join(' ');

        return `
      <div style="
          background:#120a24;border:1px solid #4c1d95;border-left:3px solid #7c3aed;
          border-radius:5px;padding:7px 10px;display:flex;flex-direction:column;gap:5px;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="color:#7c3aed;font-size:13px;font-weight:700;flex-shrink:0;">ƒ</span>
          <span style="color:#a78bfa;font-size:10px;font-family:monospace;font-weight:600;">${id}</span>
          <span style="color:#4c1d95;font-size:10px;flex-shrink:0;">registered ${_timeStr(registeredAt)}</span>
          ${
              keys?.length
                  ? `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-left:auto;">${keyTags}</div>`
                  : `<span style="color:#a78bfa;font-size:9px;font-style:italic;margin-left:auto;">no keys detected</span>`
          }
        </div>
        <div style="
            background:#0a0514;border-radius:3px;padding:5px 8px;
            font-size:10px;font-family:monospace;color:#7c3aed;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
            border:1px solid #2e1065;" title="${label}">
          ${label}
        </div>
      </div>`;
    }

    function _sourceBadge(name) {
        return `<span style="
        background:#0f2a1a;color:#34d399;border:1px solid #065f46;
        border-radius:4px;padding:2px 8px;font-size:10px;font-family:monospace;">
      🗄 ${name}
    </span>`;
    }

    // ── Shared: state rows helper ──────────────────────────────────────────────

    function _stateRows(entries, subscribers, manualByKey, keyColor) {
        return entries
            .map(([k, v]) => {
                const watcherMap = subscribers?.get(k) ?? new Map();
                const bindingPills = [...watcherMap.entries()]
                    .map(([id, info]) => _bindingPill(id, info))
                    .join(' ');
                const manualEntries = manualByKey?.get(k) ?? [];
                const manualPills = manualEntries.map(_manualPillCompact).join(' ');
                const allPills = bindingPills + (manualPills ? ' ' + manualPills : '');

                return `
        <div style="display:grid;grid-template-columns:110px 1fr;gap:6px;
          padding:5px 0;border-bottom:1px solid #0a0f1a;align-items:start;">
          <span style="color:${keyColor};font-size:11px;padding-top:1px;">${_hl(k)}</span>
          <div style="display:flex;flex-direction:column;gap:3px;">
            <span style="font-size:12px;">${_fmt(v)}</span>
            ${allPills ? `<div style="display:flex;gap:3px;flex-wrap:wrap;">${allPills}</div>` : ''}
          </div>
        </div>`;
            })
            .join('');
    }

    // ── Render a regular store card ────────────────────────────────────────────

    function _renderStore(name, meta) {
        const { store, history, subscribers, manualSubscribers } = meta;
        const state = store.getState();
        const updates = store._updateCount?.() ?? 0;
        const subCount = store._subCount?.() ?? 0;
        const manualSubCount = store._manualSubCount?.() ?? 0;

        const manualByKey = new Map();
        manualSubscribers?.forEach((entry) => {
            (entry.keys ?? []).forEach((k) => {
                if (!manualByKey.has(k)) manualByKey.set(k, []);
                manualByKey.get(k).push(entry);
            });
        });

        const stateRows = _stateRows(Object.entries(state), subscribers, manualByKey, '#7dd3fc');

        const allWatchers = new Map();
        subscribers?.forEach((map) => map.forEach((info, id) => allWatchers.set(id, info)));
        const allBindingPills = [...allWatchers.entries()]
            .map(([id, info]) => _bindingPill(id, info))
            .join(' ');

        const historyRows = (history ?? [])
            .slice(0, 12)
            .map(
                (e) => `
      <div style="display:grid;grid-template-columns:52px 90px 1fr 8px 1fr;
        align-items:center;gap:4px;padding:3px 0;border-bottom:1px solid #0a0f1a;font-size:11px;">
        <span style="color:#8899aa;font-size:10px;">${_timeStr(e.time)}</span>
        <span style="color:#7dd3fc;overflow:hidden;text-overflow:ellipsis;">${_hl(e.key)}</span>
        <span style="color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;">${_fmt(e.oldVal)}</span>
        <span style="color:#64748b;text-align:center;">→</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_fmt(e.newVal)}</span>
      </div>`,
            )
            .join('');

        return `
      <div style="background:#0f172a;border:1px solid #1e293b;border-top:2px solid #3b82f6;
        border-radius:8px;padding:12px;margin-bottom:10px;">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;
          margin-bottom:10px;flex-wrap:wrap;gap:4px;">
          <span style="color:#e2e8f0;font-weight:700;font-size:13px;">${_hl(name)}</span>
          <div style="display:flex;align-items:center;gap:8px;font-size:10px;flex-wrap:wrap;">
            <span style="background:#0f2744;color:#7dd3fc;border-radius:4px;
              padding:2px 7px;font-family:monospace;">
              ↳ ${subCount} ${subCount === 1 ? 'sub' : 'subs'}
            </span>
            ${
                manualSubCount > 0
                    ? `
              <span style="background:#1a0f2a;color:#c4b5fd;border-radius:4px;
                padding:2px 7px;font-family:monospace;"
                title="manual store.subscribe() calls">
                ƒ ${manualSubCount} manual
              </span>`
                    : ''
            }
            <span style="background:#0f2a1a;color:#34d399;border-radius:4px;
              padding:2px 7px;font-family:monospace;">
              ↺ ${updates} upd
            </span>
          </div>
        </div>

        <!-- Subscribed elements -->
        ${
            allWatchers.size
                ? `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e293b;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:4px;">Subscribed elements</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${allBindingPills}</div>
          </div>`
                : ''
        }

        <!-- Manual subscribers -->
        ${
            manualSubscribers?.size
                ? `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e293b;">
            <div style="font-size:9px;color:#a78bfa;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:6px;">Manual subscribers</div>
            <div style="display:flex;flex-direction:column;gap:5px;">
              ${[...manualSubscribers.values()].map(_manualPillFull).join('')}
            </div>
          </div>`
                : ''
        }

        <!-- State -->
        <div style="margin-bottom:${history?.length ? '10px' : '0'};">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
            letter-spacing:0.08em;margin-bottom:4px;">State</div>
          ${stateRows || '<span style="color:#475569;font-style:italic;font-size:11px;">empty</span>'}
        </div>

        <!-- History -->
        ${
            history?.length
                ? `
          <div style="border-top:1px solid #1e293b;padding-top:8px;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:4px;">Recent changes</div>
            ${historyRows}
          </div>`
                : ''
        }
      </div>`;
    }

    // ── Render a computed store card ───────────────────────────────────────────

    function _renderComputed(name, meta) {
        const { store, history, subscribers, sourceNames } = meta;
        const value = store.getState();
        const updates = store._updateCount?.() ?? 0;
        const subCount = store._subCount?.() ?? 0;

        const allWatchers = new Map();
        subscribers?.forEach((map) => map.forEach((info, id) => allWatchers.set(id, info)));
        const allBindingPills = [...allWatchers.entries()]
            .map(([id, info]) => _bindingPill(id, info))
            .join(' ');

        const valueSection =
            typeof value === 'object' && value !== null && !Array.isArray(value)
                ? _stateRows(Object.entries(value), subscribers, null, '#a78bfa')
                : `<div style="padding:5px 0;font-size:12px;">${_fmt(value)}</div>`;

        const historyRows = (history ?? [])
            .slice(0, 12)
            .map(
                (e) => `
      <div style="display:flex;align-items:center;gap:8px;
        padding:3px 0;border-bottom:1px solid #0a0f1a;font-size:11px;">
        <span style="color:#8899aa;font-size:10px;flex-shrink:0;">${_timeStr(e.time)}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_fmt(e.newVal)}</span>
      </div>`,
            )
            .join('');

        return `
      <div style="background:#0f172a;border:1px solid #2e1065;border-top:2px solid #7c3aed;
        border-radius:8px;padding:12px;margin-bottom:10px;">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;
          margin-bottom:10px;flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
            <span style="background:#2e1065;color:#a78bfa;border-radius:4px;
              padding:1px 6px;font-size:9px;font-weight:700;
              letter-spacing:0.06em;text-transform:uppercase;flex-shrink:0;">
              computed
            </span>
            <span style="color:#e2e8f0;font-weight:700;font-size:13px;">${_hl(name)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:10px;flex-wrap:wrap;">
            <span style="background:#0f2744;color:#7dd3fc;border-radius:4px;
              padding:2px 7px;font-family:monospace;">
              ↳ ${subCount} ${subCount === 1 ? 'sub' : 'subs'}
            </span>
            <span style="background:#1a0a2e;color:#a78bfa;border-radius:4px;
              padding:2px 7px;font-family:monospace;">
              ↺ ${updates} recomputes
            </span>
          </div>
        </div>

        <!-- Derived from -->
        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e293b;">
          <div style="font-size:9px;color:#a78bfa;text-transform:uppercase;
            letter-spacing:0.08em;margin-bottom:5px;">Derived from</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            ${(sourceNames ?? []).map(_sourceBadge).join('')}
          </div>
        </div>

        <!-- Subscribed elements -->
        ${
            allWatchers.size
                ? `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e293b;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:4px;">Subscribed elements</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${allBindingPills}</div>
          </div>`
                : ''
        }

        <!-- Derived value -->
        <div style="margin-bottom:${history?.length ? '10px' : '0'};">
          <div style="font-size:9px;color:#a78bfa;text-transform:uppercase;
            letter-spacing:0.08em;margin-bottom:4px;">Derived value</div>
          ${valueSection}
        </div>

        <!-- Recompute history -->
        ${
            history?.length
                ? `
          <div style="border-top:1px solid #1e293b;padding-top:8px;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:4px;">Recompute history</div>
            ${historyRows}
          </div>`
                : ''
        }
      </div>`;
    }

    // ── Main render ────────────────────────────────────────────────────────────

    function _render() {
        const registry = window.__kor_stores;

        if (!registry?.size) {
            if (countEl) countEl.textContent = '0';
            body.innerHTML = `
        <div style="color:#475569;padding:24px;text-align:center;font-style:italic;">
          No stores registered.
        </div>`;
            return;
        }

        const matches = [];
        registry.forEach((meta, name) => {
            if (!meta?.store) return;
            if (!_query) {
                matches.push([name, meta]);
                return;
            }
            const state = meta.store.getState();
            const stateKeys = typeof state === 'object' && state !== null ? Object.keys(state) : [];
            const hit =
                name.toLowerCase().includes(_query) ||
                stateKeys.some((k) => k.toLowerCase().includes(_query));
            if (hit) matches.push([name, meta]);
        });

        if (countEl) {
            countEl.textContent = _query
                ? `${matches.length} / ${registry.size}`
                : `${registry.size}`;
        }

        if (!matches.length) {
            body.innerHTML = `
        <div style="color:#475569;padding:24px;text-align:center;font-style:italic;">
          No stores match "${_query}"
        </div>`;
            return;
        }

        const regular = matches.filter(([, m]) => !m.isComputed);
        const computed = matches.filter(([, m]) => m.isComputed);

        body.innerHTML =
            regular.map(([n, m]) => _renderStore(n, m)).join('') +
            computed.map(([n, m]) => _renderComputed(n, m)).join('');
    }

    // ── Initial render + clear button ──────────────────────────────────────────
    _render();

    clearBtn?.addEventListener('click', () => {
        window.__kor_stores?.forEach((meta) => {
            if (meta.history) meta.history.length = 0;
        });
        _render();
    });
}