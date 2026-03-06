// kore-js/devtools-events.client.js  (CLIENT ONLY)

export function initEventsPanel() {
  const body = document.getElementById("kor-panel-events-body");
  const clearBtn = document.getElementById("kor-panel-events-clear");
  const searchEl = document.getElementById("kor-panel-events-search");
  const countEl = document.getElementById("kor-panel-events-count");
  if (!body) return;

  const _fireLog = [];
  const MAX_FIRES = 150;

  let _query = "";

  searchEl?.addEventListener("input", (e) => {
    _query = e.target.value.toLowerCase();
    _flush();
  });

  let _flushTimer = null;
  window.__kor_recordFire = function (regKey) {
    const entry = window.__kor_events?.get(regKey);
    if (!entry) return;
    _fireLog.unshift({ regKey, time: entry.lastFire ?? Date.now() });
    if (_fireLog.length > MAX_FIRES) _fireLog.length = MAX_FIRES;
    const panel = document.getElementById("kor-panel-events");
    if (!panel || panel.style.display === "none") return;
    clearTimeout(_flushTimer);
    _flushTimer = setTimeout(_flush, 16);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Escape all HTML-special characters so handler source code, class names,
  // and IDs are never interpreted as markup when inserted via innerHTML.
  function _esc(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const EVENT_COLORS = {
    click:     ["#1d4ed8", "#93c5fd"],
    input:     ["#065f46", "#6ee7b7"],
    change:    ["#7c3aed", "#c4b5fd"],
    keydown:   ["#92400e", "#fcd34d"],
    keyup:     ["#92400e", "#fcd34d"],
    submit:    ["#9f1239", "#fda4af"],
    focus:     ["#164e63", "#67e8f9"],
    blur:      ["#374151", "#9ca3af"],
    mouseover: ["#1e3a5f", "#7dd3fc"],
    mouseout:  ["#1e3a5f", "#7dd3fc"],
  };

  function _badge(type, small = false) {
    const [bg, fg] = EVENT_COLORS[type] ?? ["#1e293b", "#94a3b8"];
    return `<span style="
      background:${bg};color:${fg};border-radius:4px;
      padding:${small ? "1px 4px" : "2px 0"};
      font-size:${small ? "9px" : "10px"};font-weight:700;
      font-family:monospace;
      ${small ? "flex-shrink:0;" : "width:68px;display:inline-flex;align-items:center;justify-content:center;"}
    ">${_esc(type)}</span>`;
  }

  function _elDesc(entry) {
    const id  = entry.elId  ? `<span style="color:#7dd3fc">#${_esc(entry.elId)}</span>`  : "";
    const tag = entry.elTag ? `<span style="color:#94a3b8">${_esc(entry.elTag)}</span>`  : "";
    const cls = entry.elCls
      ? `<span style="color:#475569">.${_esc(entry.elCls.split(" ").filter(Boolean).slice(0, 2).join("."))}</span>`
      : "";
    return `${tag}${id}${cls}` || '<span style="color:#64748b">?</span>';
  }

  function _hl(str) {
    if (!_query || !str) return _esc(str);
    const lower = str.toLowerCase();
    const idx = lower.indexOf(_query);
    if (idx === -1) return _esc(str);
    return (
      _esc(str.slice(0, idx)) +
      `<mark style="background:#1d4ed8;color:#fff;border-radius:2px;">${_esc(str.slice(idx, idx + _query.length))}</mark>` +
      _esc(str.slice(idx + _query.length))
    );
  }

  function _elDescHl(entry) {
    const id  = entry.elId  ? `<span style="color:#7dd3fc">#${_hl(entry.elId)}</span>`  : "";
    const tag = entry.elTag ? `<span style="color:#94a3b8">${_esc(entry.elTag)}</span>` : "";
    const cls = entry.elCls
      ? `<span style="color:#475569">.${_esc(entry.elCls.split(" ").filter(Boolean).slice(0, 2).join("."))}</span>`
      : "";
    return `${tag}${id}${cls}` || '<span style="color:#64748b">?</span>';
  }

  function _storePill(store) {
    if (!store) return "";
    return `<span style="background:#0f2744;color:#60a5fa;border:1px solid #1e3a5f;
      border-radius:4px;padding:1px 6px;font-size:10px;">🗄 ${_hl(store)}</span>`;
  }

  function _keyPill(k) {
    return `<span style="background:#0a1f2e;color:#7dd3fc;border:1px solid #1e3a5f;
      border-radius:4px;padding:1px 5px;font-size:10px;">${_hl(k)}</span>`;
  }

  function _timeStr(ms) {
    return new Date(ms).toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function _matches(entry) {
    if (!_query) return true;
    return (
      (entry.type ?? "").toLowerCase().includes(_query) ||
      (entry.elId  ?? "").toLowerCase().includes(_query) ||
      (entry.elTag ?? "").toLowerCase().includes(_query) ||
      (entry.store ?? "").toLowerCase().includes(_query) ||
      (entry.keys  ?? []).some((k) => k.toLowerCase().includes(_query))
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function _flush() {
    const registry = window.__kor_events;

    if (!registry?.size) {
      if (countEl) countEl.textContent = "0";
      body.innerHTML = `
        <div style="color:#475569;padding:24px;text-align:center;font-style:italic;">
          No $().on() listeners registered yet.
        </div>`;
      return;
    }

    const allEntries    = [...registry.entries()];
    const filtered      = allEntries.filter(([, e]) => _matches(e));
    const totalAttached = registry.size;

    if (countEl) {
      countEl.textContent = _query
        ? `${filtered.length} / ${totalAttached}`
        : `${totalAttached}`;
    }

    // ── Section 1: Attached listeners ──────────────────────────────────────
    // Grid: [badge 68px] [element desc 1fr] [status auto]
    // Extra rows span all columns and are padded to align under the desc.
    const attachedHtml = filtered
      .map(([, entry]) => {
        const keyPills = (entry.keys ?? []).map(_keyPill).join(" ");

        const extraRows = [
          entry.store || entry.keys?.length
            ? `<div style="grid-column:1/-1;display:flex;gap:4px;flex-wrap:wrap;padding-left:74px;">
                ${_storePill(entry.store)}${keyPills}
               </div>`
            : "",
          entry.handlerSrc
            ? `<div style="grid-column:1/-1;padding-left:74px;">
                <div style="color:#7a8fa8;font-size:9px;font-family:monospace;
                  padding:3px 6px;background:#060a10;border-radius:3px;
                  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                  border:1px solid #0f172a;"
                  title="${_esc(entry.handlerSrc)}">
                  ${_esc(entry.handlerSrc)}
                </div>
               </div>`
            : "",
        ].filter(Boolean).join("");

        return `
        <div style="
          display:grid;
          grid-template-columns:68px 1fr auto;
          align-items:center;
          column-gap:6px;
          row-gap:4px;
          padding:7px 8px;
          border-bottom:1px solid #0a0f1a;
        ">
          ${_badge(entry.type)}
          <span style="font-size:11px;display:flex;gap:3px;align-items:baseline;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${_elDescHl(entry)}
          </span>
          ${
            entry.fires > 0
              ? `<span style="background:#1e293b;color:#94a3b8;border-radius:10px;
                  padding:1px 7px;font-size:10px;font-family:monospace;white-space:nowrap;">
                  ×${entry.fires}
                </span>`
              : `<span style="color:#64748b;font-size:10px;white-space:nowrap;">not fired</span>`
          }
          ${extraRows}
        </div>`;
      })
      .join("");

    // ── Section 2: Live fire log ────────────────────────────────────────────
    const filteredLog = _query
      ? _fireLog.filter((f) => {
          const e = registry.get(f.regKey);
          return e && _matches(e);
        })
      : _fireLog;

    const fireLogHtml = filteredLog
      .map((fire) => {
        const entry = registry.get(fire.regKey);
        if (!entry) return "";
        return `
        <div style="display:flex;align-items:center;gap:6px;
          padding:4px 8px;border-bottom:1px solid #0a0f1a;">
          ${_badge(entry.type, true)}
          <span style="font-size:11px;flex:1;display:flex;gap:3px;overflow:hidden;">
            ${_elDesc(entry)}
          </span>
          ${
            entry.store
              ? `<span style="color:#3b82f6;font-size:10px;flex-shrink:0;">🗄 ${_esc(entry.store)}</span>`
              : ""
          }
          <span style="color:#8899aa;font-size:10px;flex-shrink:0;font-family:monospace;">
            ${_timeStr(fire.time)}
          </span>
        </div>`;
      })
      .join("");

    body.innerHTML = `
      <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
        letter-spacing:0.08em;padding:8px 8px 4px;
        position:sticky;top:0;background:#0a0f1a;z-index:1;
        display:flex;align-items:center;justify-content:space-between;">
        <span>
          Attached
          (${filtered.length}${_query && filtered.length !== totalAttached ? " of " + totalAttached : ""})
        </span>
      </div>
      ${
        attachedHtml ||
        `<div style="color:#475569;font-size:11px;padding:8px;font-style:italic;">
          No matches for "${_esc(_query)}"
        </div>`
      }
      <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
        letter-spacing:0.08em;padding:8px 8px 4px;margin-top:4px;
        position:sticky;top:0;background:#0a0f1a;z-index:1;">
        Live fire log (${filteredLog.length})
      </div>
      ${
        fireLogHtml ||
        `<div style="color:#64748b;font-size:11px;padding:8px;font-style:italic;">
          Nothing fired yet.
        </div>`
      }
    `;
  }

  // ── Initial render + clear button ──────────────────────────────────────────
  _flush();

  clearBtn?.addEventListener("click", () => {
    _fireLog.length = 0;
    window.__kor_events?.forEach((e) => {
      e.fires = 0;
      e.lastFire = null;
    });
    _flush();
  });
}