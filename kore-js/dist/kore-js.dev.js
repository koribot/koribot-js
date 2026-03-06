var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/core/dev-tools/error-overlay.js
var error_overlay_exports = {};
__export(error_overlay_exports, {
  _devWarn: () => _devWarn,
  closeErrorOverlay: () => closeErrorOverlay,
  reportError: () => reportError
});
function createOverlay() {
  overlayEl = document.createElement("div");
  overlayEl.id = "__kor_error_overlay__";
  overlayEl.innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,0.9);
      z-index:999999;
      color:#ffdddd;
      font-family:Menlo,Consolas,monospace;
      padding:24px;
      overflow:auto;
    ">
      <div style="display:flex;justify-content:space-between;">
        <h2 style="margin:0;color:#ff4d4f;">Kore-js Error</h2>
        <button id="__kor_close__"
          style="background:#222;color:white;border:1px solid #555;padding:6px 10px;cursor:pointer;">
          \u2715
        </button>
      </div>

      <pre id="__kor_message__"
        style="margin-top:16px;font-size:15px;white-space:pre-wrap;"></pre>

      <pre id="__kor_stack__"
        style="margin-top:16px;font-size:13px;opacity:0.8;white-space:pre-wrap;"></pre>
    </div>
  `;
  document.body.appendChild(overlayEl);
  overlayEl.querySelector("#__kor_close__").addEventListener("click", closeErrorOverlay);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeErrorOverlay();
  });
}
function reportError({ type = "", message = "", cause = null, fatal = true } = {}) {
  const resolver = ERROR_TYPES[type];
  const finalMessage = resolver ? resolver(message) : `[kore-js] ${type}: ${message}`;
  const error = new Error(finalMessage);
  if (cause instanceof Error) {
    error.cause = cause;
  }
  if (!overlayEl) createOverlay();
  overlayEl.querySelector("#__kor_message__").textContent = error.message;
  overlayEl.querySelector("#__kor_stack__").textContent = error.stack || "";
  if (fatal) {
    throw error;
  }
  return error;
}
function _devWarn(message, method) {
  const label = method ? `kor/${method}` : "kor";
  console.warn(
    "%c " + label + " %c %s",
    "background:#f59e0b;color:#000;font-weight:bold;padding:2px 8px;border-radius:4px;",
    "color:inherit;",
    message
  );
}
function closeErrorOverlay() {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}
var overlayEl, ERROR_TYPES;
var init_error_overlay = __esm({
  "src/core/dev-tools/error-overlay.js"() {
    overlayEl = null;
    ERROR_TYPES = {
      ELEMENT_NOT_FOUND: (message) => `[kore-js] Element not found: ${message}`,
      ELEMENTS_NOT_FOUND: (message) => `[kore-js] Elements not found: ${message}`,
      INVALID_SELECTOR: (message) => `[kore-js] Invalid selector: ${message}`,
      STORE_KEY_MISSING: (message) => `[kore-js] Store key does not exist: ${message}`,
      UNKNOWN: (message) => `[kore-js] Unknown runtime error: ${message || ""}`,
      TYPE_MISMATCH: (message) => `[kore-js] Type mismatch: ${message}`
    };
  }
});

// src/core/dev-tools/devtools-stores.client.js
var devtools_stores_client_exports = {};
__export(devtools_stores_client_exports, {
  initStoresPanel: () => initStoresPanel
});
function initStoresPanel() {
  const body = document.getElementById("kor-panel-stores-body");
  const clearBtn = document.getElementById("kor-panel-stores-clear");
  const searchEl = document.getElementById("kor-panel-stores-search");
  const countEl = document.getElementById("kor-panel-stores-count");
  if (!body) return;
  let _query = "";
  searchEl?.addEventListener("input", (e) => {
    _query = e.target.value.toLowerCase();
    _render();
  });
  let _renderTimer = null;
  window.__korDevtools._onStoreUpdate = () => {
    const panel = document.getElementById("kor-panel-stores");
    if (!panel || panel.style.display === "none") return;
    clearTimeout(_renderTimer);
    _renderTimer = setTimeout(_render, 16);
  };
  window.__korDevtools._refreshStores = () => _render();
  function _fmt(v) {
    if (v === null) return '<span style="color:#64748b">null</span>';
    if (v === void 0) return '<span style="color:#64748b">undefined</span>';
    if (typeof v === "boolean") return `<span style="color:#f59e0b">${v}</span>`;
    if (typeof v === "number") return `<span style="color:#34d399">${v}</span>`;
    if (typeof v === "string") {
      const s = v.length > 36 ? v.slice(0, 36) + "\u2026" : v;
      return `<span style="color:#f87171">"${s}"</span>`;
    }
    if (Array.isArray(v)) return `<span style="color:#818cf8">Array(${v.length})</span>`;
    if (typeof v === "object") {
      const keys = Object.keys(v);
      return `<span style="color:#818cf8">{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "\u2026" : ""}}</span>`;
    }
    return `<span style="color:#e2e8f0">${String(v)}</span>`;
  }
  function _timeStr(ms) {
    return new Date(ms).toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  function _hl(str) {
    if (!_query || !str) return str;
    const idx = str.toLowerCase().indexOf(_query);
    if (idx === -1) return str;
    return str.slice(0, idx) + `<mark style="background:#1d4ed8;color:#fff;border-radius:2px;">${str.slice(idx, idx + _query.length)}</mark>` + str.slice(idx + _query.length);
  }
  function _bindingPill(id, { type, getValue, src }) {
    const liveVal = getValue ? _fmt(getValue()) : null;
    const isComputed = type === "computed";
    const typeBadge = isComputed ? `<span style="background:#2e1065;color:#a78bfa;border-radius:2px;
           padding:0 5px;font-size:9px;font-weight:700;">\u2192 computed</span>` : `<span style="background:#1e3a5f;color:#93c5fd;border-radius:2px;
           padding:0 4px;font-size:9px;">.${type}()</span>`;
    const idColor = isComputed ? "#a78bfa" : "#7dd3fc";
    const bg = isComputed ? "#1a0f2a" : "#0f2744";
    const border = isComputed ? "#4c1d95" : "#1e3a5f";
    return `<span style="
        background:${bg};color:${idColor};border:1px solid ${border};
        border-radius:3px;padding:2px 6px;font-size:10px;
        display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap;">
      <span style="color:${idColor};max-width:120px;overflow:hidden;
        text-overflow:ellipsis;white-space:nowrap;font-size:10px;"
        title="${id}">${isComputed ? id.replace(/^computed\(/, "\u27E8").replace(/\)$/, "\u27E9") : "#" + id}</span>
      ${typeBadge}
      ${src !== null && !isComputed ? `<span style="color:#8899aa;font-size:9px;font-family:monospace;
            max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            title="${src}">${src}</span>` : ""}
      ${liveVal !== null ? `<span style="background:${isComputed ? "#1a0a2e" : "#0a1f0f"};
            color:${isComputed ? "#c4b5fd" : "#4ade80"};border-radius:2px;
            padding:0 4px;font-size:9px;font-family:monospace;">${liveVal}</span>` : ""}
    </span>`;
  }
  function _manualPillCompact({ id, label }) {
    return `<span style="
        background:#1a0f2a;color:#c4b5fd;border:1px solid #4c1d95;
        border-radius:3px;padding:2px 6px;font-size:10px;
        display:inline-flex;gap:5px;align-items:center;"
        title="${label}">
      <span style="color:#7c3aed;font-size:9px;font-weight:700;flex-shrink:0;">\u0192</span>
      <span style="color:#a78bfa;font-size:9px;flex-shrink:0;">${id}</span>
      <span style="color:#6d28d9;font-size:9px;font-family:monospace;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        max-width:160px;">${label}</span>
    </span>`;
  }
  function _manualPillFull({ id, label, registeredAt, keys }) {
    const keyTags = (keys ?? []).map(
      (k) => `<span style="background:#2e1065;color:#a78bfa;border-radius:3px;
        padding:1px 5px;font-size:9px;font-family:monospace;">${k}</span>`
    ).join(" ");
    return `
      <div style="
          background:#120a24;border:1px solid #4c1d95;border-left:3px solid #7c3aed;
          border-radius:5px;padding:7px 10px;display:flex;flex-direction:column;gap:5px;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="color:#7c3aed;font-size:13px;font-weight:700;flex-shrink:0;">\u0192</span>
          <span style="color:#a78bfa;font-size:10px;font-family:monospace;font-weight:600;">${id}</span>
          <span style="color:#4c1d95;font-size:10px;flex-shrink:0;">registered ${_timeStr(registeredAt)}</span>
          ${keys?.length ? `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-left:auto;">${keyTags}</div>` : `<span style="color:#a78bfa;font-size:9px;font-style:italic;margin-left:auto;">no keys detected</span>`}
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
      \u{1F5C4} ${name}
    </span>`;
  }
  function _stateRows(entries, subscribers, manualByKey, keyColor) {
    return entries.map(([k, v]) => {
      const watcherMap = subscribers?.get(k) ?? /* @__PURE__ */ new Map();
      const bindingPills = [...watcherMap.entries()].map(([id, info]) => _bindingPill(id, info)).join(" ");
      const manualEntries = manualByKey?.get(k) ?? [];
      const manualPills = manualEntries.map(_manualPillCompact).join(" ");
      const allPills = bindingPills + (manualPills ? " " + manualPills : "");
      return `
        <div style="display:grid;grid-template-columns:110px 1fr;gap:6px;
          padding:5px 0;border-bottom:1px solid #0a0f1a;align-items:start;">
          <span style="color:${keyColor};font-size:11px;padding-top:1px;">${_hl(k)}</span>
          <div style="display:flex;flex-direction:column;gap:3px;">
            <span style="font-size:12px;">${_fmt(v)}</span>
            ${allPills ? `<div style="display:flex;gap:3px;flex-wrap:wrap;">${allPills}</div>` : ""}
          </div>
        </div>`;
    }).join("");
  }
  function _renderStore(name, meta2) {
    const { store, history: history2, subscribers, manualSubscribers } = meta2;
    const state = store.getState();
    const updates = store._updateCount?.() ?? 0;
    const subCount = store._subCount?.() ?? 0;
    const manualSubCount = store._manualSubCount?.() ?? 0;
    const manualByKey = /* @__PURE__ */ new Map();
    manualSubscribers?.forEach((entry) => {
      (entry.keys ?? []).forEach((k) => {
        if (!manualByKey.has(k)) manualByKey.set(k, []);
        manualByKey.get(k).push(entry);
      });
    });
    const stateRows = _stateRows(Object.entries(state), subscribers, manualByKey, "#7dd3fc");
    const allWatchers = /* @__PURE__ */ new Map();
    subscribers?.forEach((map) => map.forEach((info, id) => allWatchers.set(id, info)));
    const allBindingPills = [...allWatchers.entries()].map(([id, info]) => _bindingPill(id, info)).join(" ");
    const historyRows = (history2 ?? []).slice(0, 12).map(
      (e) => `
      <div style="display:grid;grid-template-columns:52px 90px 1fr 8px 1fr;
        align-items:center;gap:4px;padding:3px 0;border-bottom:1px solid #0a0f1a;font-size:11px;">
        <span style="color:#8899aa;font-size:10px;">${_timeStr(e.time)}</span>
        <span style="color:#7dd3fc;overflow:hidden;text-overflow:ellipsis;">${_hl(e.key)}</span>
        <span style="color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;">${_fmt(e.oldVal)}</span>
        <span style="color:#64748b;text-align:center;">\u2192</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_fmt(e.newVal)}</span>
      </div>`
    ).join("");
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
              \u21B3 ${subCount} ${subCount === 1 ? "sub" : "subs"}
            </span>
            ${manualSubCount > 0 ? `
              <span style="background:#1a0f2a;color:#c4b5fd;border-radius:4px;
                padding:2px 7px;font-family:monospace;"
                title="manual store.subscribe() calls">
                \u0192 ${manualSubCount} manual
              </span>` : ""}
            <span style="background:#0f2a1a;color:#34d399;border-radius:4px;
              padding:2px 7px;font-family:monospace;">
              \u21BA ${updates} upd
            </span>
          </div>
        </div>

        <!-- Subscribed elements -->
        ${allWatchers.size ? `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e293b;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:4px;">Subscribed elements</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${allBindingPills}</div>
          </div>` : ""}

        <!-- Manual subscribers -->
        ${manualSubscribers?.size ? `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e293b;">
            <div style="font-size:9px;color:#a78bfa;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:6px;">Manual subscribers</div>
            <div style="display:flex;flex-direction:column;gap:5px;">
              ${[...manualSubscribers.values()].map(_manualPillFull).join("")}
            </div>
          </div>` : ""}

        <!-- State -->
        <div style="margin-bottom:${history2?.length ? "10px" : "0"};">
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
            letter-spacing:0.08em;margin-bottom:4px;">State</div>
          ${stateRows || '<span style="color:#475569;font-style:italic;font-size:11px;">empty</span>'}
        </div>

        <!-- History -->
        ${history2?.length ? `
          <div style="border-top:1px solid #1e293b;padding-top:8px;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:4px;">Recent changes</div>
            ${historyRows}
          </div>` : ""}
      </div>`;
  }
  function _renderComputed(name, meta2) {
    const { store, history: history2, subscribers, sourceNames } = meta2;
    const value = store.getState();
    const updates = store._updateCount?.() ?? 0;
    const subCount = store._subCount?.() ?? 0;
    const allWatchers = /* @__PURE__ */ new Map();
    subscribers?.forEach((map) => map.forEach((info, id) => allWatchers.set(id, info)));
    const allBindingPills = [...allWatchers.entries()].map(([id, info]) => _bindingPill(id, info)).join(" ");
    const valueSection = typeof value === "object" && value !== null && !Array.isArray(value) ? _stateRows(Object.entries(value), subscribers, null, "#a78bfa") : `<div style="padding:5px 0;font-size:12px;">${_fmt(value)}</div>`;
    const historyRows = (history2 ?? []).slice(0, 12).map(
      (e) => `
      <div style="display:flex;align-items:center;gap:8px;
        padding:3px 0;border-bottom:1px solid #0a0f1a;font-size:11px;">
        <span style="color:#8899aa;font-size:10px;flex-shrink:0;">${_timeStr(e.time)}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_fmt(e.newVal)}</span>
      </div>`
    ).join("");
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
              \u21B3 ${subCount} ${subCount === 1 ? "sub" : "subs"}
            </span>
            <span style="background:#1a0a2e;color:#a78bfa;border-radius:4px;
              padding:2px 7px;font-family:monospace;">
              \u21BA ${updates} recomputes
            </span>
          </div>
        </div>

        <!-- Derived from -->
        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e293b;">
          <div style="font-size:9px;color:#a78bfa;text-transform:uppercase;
            letter-spacing:0.08em;margin-bottom:5px;">Derived from</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;">
            ${(sourceNames ?? []).map(_sourceBadge).join("")}
          </div>
        </div>

        <!-- Subscribed elements -->
        ${allWatchers.size ? `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #1e293b;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:4px;">Subscribed elements</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${allBindingPills}</div>
          </div>` : ""}

        <!-- Derived value -->
        <div style="margin-bottom:${history2?.length ? "10px" : "0"};">
          <div style="font-size:9px;color:#a78bfa;text-transform:uppercase;
            letter-spacing:0.08em;margin-bottom:4px;">Derived value</div>
          ${valueSection}
        </div>

        <!-- Recompute history -->
        ${history2?.length ? `
          <div style="border-top:1px solid #1e293b;padding-top:8px;">
            <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
              letter-spacing:0.08em;margin-bottom:4px;">Recompute history</div>
            ${historyRows}
          </div>` : ""}
      </div>`;
  }
  function _render() {
    const registry = window.__kor_stores;
    if (!registry?.size) {
      if (countEl) countEl.textContent = "0";
      body.innerHTML = `
        <div style="color:#475569;padding:24px;text-align:center;font-style:italic;">
          No stores registered.
        </div>`;
      return;
    }
    const matches = [];
    registry.forEach((meta2, name) => {
      if (!meta2?.store) return;
      if (!_query) {
        matches.push([name, meta2]);
        return;
      }
      const state = meta2.store.getState();
      const stateKeys = typeof state === "object" && state !== null ? Object.keys(state) : [];
      const hit = name.toLowerCase().includes(_query) || stateKeys.some((k) => k.toLowerCase().includes(_query));
      if (hit) matches.push([name, meta2]);
    });
    if (countEl) {
      countEl.textContent = _query ? `${matches.length} / ${registry.size}` : `${registry.size}`;
    }
    if (!matches.length) {
      body.innerHTML = `
        <div style="color:#475569;padding:24px;text-align:center;font-style:italic;">
          No stores match "${_query}"
        </div>`;
      return;
    }
    const regular = matches.filter(([, m]) => !m.isComputed);
    const computed2 = matches.filter(([, m]) => m.isComputed);
    body.innerHTML = regular.map(([n, m]) => _renderStore(n, m)).join("") + computed2.map(([n, m]) => _renderComputed(n, m)).join("");
  }
  _render();
  clearBtn?.addEventListener("click", () => {
    window.__kor_stores?.forEach((meta2) => {
      if (meta2.history) meta2.history.length = 0;
    });
    _render();
  });
}
var init_devtools_stores_client = __esm({
  "src/core/dev-tools/devtools-stores.client.js"() {
  }
});

// src/core/dev-tools/devtools-events.client.js
var devtools_events_client_exports = {};
__export(devtools_events_client_exports, {
  initEventsPanel: () => initEventsPanel
});
function initEventsPanel() {
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
  window.__kor_recordFire = function(regKey) {
    const entry = window.__kor_events?.get(regKey);
    if (!entry) return;
    _fireLog.unshift({ regKey, time: entry.lastFire ?? Date.now() });
    if (_fireLog.length > MAX_FIRES) _fireLog.length = MAX_FIRES;
    const panel = document.getElementById("kor-panel-events");
    if (!panel || panel.style.display === "none") return;
    clearTimeout(_flushTimer);
    _flushTimer = setTimeout(_flush, 16);
  };
  function _esc(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  const EVENT_COLORS = {
    click: ["#1d4ed8", "#93c5fd"],
    input: ["#065f46", "#6ee7b7"],
    change: ["#7c3aed", "#c4b5fd"],
    keydown: ["#92400e", "#fcd34d"],
    keyup: ["#92400e", "#fcd34d"],
    submit: ["#9f1239", "#fda4af"],
    focus: ["#164e63", "#67e8f9"],
    blur: ["#374151", "#9ca3af"],
    mouseover: ["#1e3a5f", "#7dd3fc"],
    mouseout: ["#1e3a5f", "#7dd3fc"]
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
    const id = entry.elId ? `<span style="color:#7dd3fc">#${_esc(entry.elId)}</span>` : "";
    const tag = entry.elTag ? `<span style="color:#94a3b8">${_esc(entry.elTag)}</span>` : "";
    const cls = entry.elCls ? `<span style="color:#475569">.${_esc(entry.elCls.split(" ").filter(Boolean).slice(0, 2).join("."))}</span>` : "";
    return `${tag}${id}${cls}` || '<span style="color:#64748b">?</span>';
  }
  function _hl(str) {
    if (!_query || !str) return _esc(str);
    const lower = str.toLowerCase();
    const idx = lower.indexOf(_query);
    if (idx === -1) return _esc(str);
    return _esc(str.slice(0, idx)) + `<mark style="background:#1d4ed8;color:#fff;border-radius:2px;">${_esc(str.slice(idx, idx + _query.length))}</mark>` + _esc(str.slice(idx + _query.length));
  }
  function _elDescHl(entry) {
    const id = entry.elId ? `<span style="color:#7dd3fc">#${_hl(entry.elId)}</span>` : "";
    const tag = entry.elTag ? `<span style="color:#94a3b8">${_esc(entry.elTag)}</span>` : "";
    const cls = entry.elCls ? `<span style="color:#475569">.${_esc(entry.elCls.split(" ").filter(Boolean).slice(0, 2).join("."))}</span>` : "";
    return `${tag}${id}${cls}` || '<span style="color:#64748b">?</span>';
  }
  function _storePill(store) {
    if (!store) return "";
    return `<span style="background:#0f2744;color:#60a5fa;border:1px solid #1e3a5f;
      border-radius:4px;padding:1px 6px;font-size:10px;">\u{1F5C4} ${_hl(store)}</span>`;
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
      second: "2-digit"
    });
  }
  function _matches(entry) {
    if (!_query) return true;
    return (entry.type ?? "").toLowerCase().includes(_query) || (entry.elId ?? "").toLowerCase().includes(_query) || (entry.elTag ?? "").toLowerCase().includes(_query) || (entry.store ?? "").toLowerCase().includes(_query) || (entry.keys ?? []).some((k) => k.toLowerCase().includes(_query));
  }
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
    const allEntries = [...registry.entries()];
    const filtered = allEntries.filter(([, e]) => _matches(e));
    const totalAttached = registry.size;
    if (countEl) {
      countEl.textContent = _query ? `${filtered.length} / ${totalAttached}` : `${totalAttached}`;
    }
    const attachedHtml = filtered.map(([, entry]) => {
      const keyPills = (entry.keys ?? []).map(_keyPill).join(" ");
      const extraRows = [
        entry.store || entry.keys?.length ? `<div style="grid-column:1/-1;display:flex;gap:4px;flex-wrap:wrap;padding-left:74px;">
                ${_storePill(entry.store)}${keyPills}
               </div>` : "",
        entry.handlerSrc ? `<div style="grid-column:1/-1;padding-left:74px;">
                <div style="color:#7a8fa8;font-size:9px;font-family:monospace;
                  padding:3px 6px;background:#060a10;border-radius:3px;
                  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
                  border:1px solid #0f172a;"
                  title="${_esc(entry.handlerSrc)}">
                  ${_esc(entry.handlerSrc)}
                </div>
               </div>` : ""
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
          ${entry.fires > 0 ? `<span style="background:#1e293b;color:#94a3b8;border-radius:10px;
                  padding:1px 7px;font-size:10px;font-family:monospace;white-space:nowrap;">
                  \xD7${entry.fires}
                </span>` : `<span style="color:#64748b;font-size:10px;white-space:nowrap;">not fired</span>`}
          ${extraRows}
        </div>`;
    }).join("");
    const filteredLog = _query ? _fireLog.filter((f) => {
      const e = registry.get(f.regKey);
      return e && _matches(e);
    }) : _fireLog;
    const fireLogHtml = filteredLog.map((fire) => {
      const entry = registry.get(fire.regKey);
      if (!entry) return "";
      return `
        <div style="display:flex;align-items:center;gap:6px;
          padding:4px 8px;border-bottom:1px solid #0a0f1a;">
          ${_badge(entry.type, true)}
          <span style="font-size:11px;flex:1;display:flex;gap:3px;overflow:hidden;">
            ${_elDesc(entry)}
          </span>
          ${entry.store ? `<span style="color:#3b82f6;font-size:10px;flex-shrink:0;">\u{1F5C4} ${_esc(entry.store)}</span>` : ""}
          <span style="color:#8899aa;font-size:10px;flex-shrink:0;font-family:monospace;">
            ${_timeStr(fire.time)}
          </span>
        </div>`;
    }).join("");
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
      ${attachedHtml || `<div style="color:#475569;font-size:11px;padding:8px;font-style:italic;">
          No matches for "${_esc(_query)}"
        </div>`}
      <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;
        letter-spacing:0.08em;padding:8px 8px 4px;margin-top:4px;
        position:sticky;top:0;background:#0a0f1a;z-index:1;">
        Live fire log (${filteredLog.length})
      </div>
      ${fireLogHtml || `<div style="color:#64748b;font-size:11px;padding:8px;font-style:italic;">
          Nothing fired yet.
        </div>`}
    `;
  }
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
var init_devtools_events_client = __esm({
  "src/core/dev-tools/devtools-events.client.js"() {
  }
});

// src/core/dev-tools/devtools-network.client.js
var devtools_network_client_exports = {};
__export(devtools_network_client_exports, {
  initNetworkPanel: () => initNetworkPanel
});
function initNetworkPanel() {
  const body = document.getElementById("kor-panel-network-body");
  const clearBtn = document.getElementById("kor-panel-network-clear");
  const countEl = document.getElementById("kor-panel-network-count");
  if (!body) return;
  const _log = [];
  const MAX = 200;
  if (!window.__kor_fetch_patched) {
    window.__kor_fetch_patched = true;
    const _origFetch = window.fetch.bind(window);
    window.fetch = async function(input, init = {}) {
      const url = typeof input === "string" ? input : input?.url ?? String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      const id = ++_fetchSeq;
      const time = Date.now();
      let reqBody = null;
      if (["POST", "PUT", "PATCH"].includes(method) && init?.body != null) {
        try {
          const b = init.body;
          if (typeof b === "string") {
            try {
              reqBody = JSON.stringify(JSON.parse(b), null, 0);
            } catch {
              reqBody = b;
            }
          } else if (b instanceof URLSearchParams) {
            reqBody = b.toString();
          } else if (b instanceof FormData) {
            reqBody = "[FormData]";
          } else {
            reqBody = "[binary]";
          }
          if (reqBody && reqBody.length > 120)
            reqBody = reqBody.slice(0, 119) + "\u2026";
        } catch {
          reqBody = "?";
        }
      }
      const entry = {
        id,
        method,
        url,
        status: null,
        duration: null,
        size: null,
        time,
        state: "pending",
        reqBody
      };
      _log.unshift(entry);
      if (_log.length > MAX) _log.length = MAX;
      window.__korDevtools?._onNetworkRequest?.();
      try {
        const res = await _origFetch(input, init);
        const clone = res.clone();
        entry.status = res.status;
        entry.duration = Date.now() - time;
        entry.state = res.ok ? "ok" : "error";
        clone.blob().then((b) => {
          entry.size = b.size;
          window.__korDevtools?._onNetworkRequest?.();
        }).catch(() => {
        });
        window.__korDevtools?._onNetworkRequest?.();
        return res;
      } catch (err) {
        entry.state = "failed";
        entry.duration = Date.now() - time;
        entry.error = err.message;
        window.__korDevtools?._onNetworkRequest?.();
        throw err;
      }
    };
  }
  let _fetchSeq = window.__kor_fetch_seq ?? 0;
  window.__kor_fetch_seq = _fetchSeq;
  let _renderTimer = null;
  window.__korDevtools._onNetworkRequest = () => {
    const panel = document.getElementById("kor-panel-network");
    if (!panel || panel.style.display === "none") return;
    clearTimeout(_renderTimer);
    _renderTimer = setTimeout(_render, 16);
  };
  function _methodBadge(method) {
    const colors = {
      GET: ["#0f2744", "#60a5fa"],
      POST: ["#0f2a1a", "#34d399"],
      PUT: ["#2a1f0f", "#f59e0b"],
      PATCH: ["#1a0f2a", "#a78bfa"],
      DELETE: ["#2a0f0f", "#f87171"]
    };
    const [bg, fg] = colors[method] ?? ["#1e293b", "#94a3b8"];
    return `<span style="
      background:${bg};color:${fg};border-radius:3px;
      padding:1px 5px;font-size:10px;font-weight:700;
      font-family:monospace;flex-shrink:0;
    ">${method}</span>`;
  }
  function _statusBadge(status, state) {
    if (state === "pending")
      return `<span style="color:#475569;font-size:10px;">pending\u2026</span>`;
    if (state === "failed")
      return `<span style="color:#f87171;font-size:10px;">failed</span>`;
    const ok = status >= 200 && status < 300;
    const rdr = status >= 300 && status < 400;
    const fg = ok ? "#34d399" : rdr ? "#f59e0b" : "#f87171";
    return `<span style="color:${fg};font-size:11px;font-weight:700;font-family:monospace;">${status}</span>`;
  }
  function _dur(ms) {
    if (ms === null) return "";
    if (ms < 1e3) return `${ms}ms`;
    return `${(ms / 1e3).toFixed(2)}s`;
  }
  function _size(bytes) {
    if (bytes === null) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  function _shortUrl(url) {
    try {
      const u = new URL(url, location.origin);
      return u.pathname + (u.search || "");
    } catch {
      return url;
    }
  }
  function _timeStr(ms) {
    return new Date(ms).toLocaleTimeString([], {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  function _render() {
    if (countEl) countEl.textContent = _log.length;
    if (!_log.length) {
      body.innerHTML = `
        <div style="color:#475569;padding:24px;text-align:center;font-style:italic;">
          No requests yet.
        </div>`;
      return;
    }
    body.innerHTML = _log.map(
      (e) => `
      <div style="
        padding:6px 10px; border-bottom:1px solid #0a0f1a;
        font-size:11px; display:flex; flex-direction:column; gap:3px;
      ">
        <div style="display:grid;grid-template-columns:52px 52px 1fr auto auto;
          align-items:center; gap:6px;">
          <span style="color:#8899aa;font-size:10px;">${_timeStr(e.time)}</span>
          ${_methodBadge(e.method)}
          <span style="color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${e.url}">
            ${_shortUrl(e.url)}
          </span>
          <span style="color:#475569;font-size:10px;white-space:nowrap;">
            ${_dur(e.duration)}${e.size !== null ? " \xB7 " + _size(e.size) : ""}
          </span>
          ${_statusBadge(e.status, e.state)}
        </div>
        ${e.url.length > 50 ? `
          <div style="color:#7a8fa8;font-size:9px;font-family:monospace;padding-left:116px;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${e.url}">
            ${e.url}
          </div>` : ""}
        ${e.reqBody != null ? `
          <div style="padding-left:116px;display:flex;align-items:baseline;gap:6px;">
            <span style="color:#475569;font-size:9px;flex-shrink:0;">body</span>
            <span style="color:#f59e0b;font-size:9px;font-family:monospace;
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${e.reqBody}">
              ${e.reqBody}
            </span>
          </div>` : ""}
      </div>
    `
    ).join("");
  }
  _render();
  clearBtn?.addEventListener("click", () => {
    _log.length = 0;
    _render();
  });
}
var init_devtools_network_client = __esm({
  "src/core/dev-tools/devtools-network.client.js"() {
  }
});

// src/core/dev-tools/devtools-page.client.js
var devtools_page_client_exports = {};
__export(devtools_page_client_exports, {
  initPagePanel: () => initPagePanel
});
function initPagePanel() {
  const body = document.getElementById("kor-panel-page-body");
  const countEl = document.getElementById("kor-panel-page-count");
  if (!body) return;
  let _lcpValue = null;
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) _lcpValue = entries.at(-1).startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
  }
  window.__korDevtools._onNavigate = () => _render();
  function _badge(text, bg, fg) {
    return `<span style="background:${bg};color:${fg};border-radius:3px;
      padding:1px 6px;font-size:10px;font-family:monospace;white-space:nowrap;">${text}</span>`;
  }
  function _pill(text, color) {
    return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;
      border-radius:3px;padding:1px 5px;font-size:10px;font-family:monospace;">${text}</span>`;
  }
  function _status(type, text) {
    const map = { ok: "#22c55e", warn: "#f59e0b", error: "#ef4444" };
    const icon = { ok: "\u2713", warn: "\u26A0", error: "\u2715" };
    const c = map[type] ?? map.ok;
    return `<span style="color:${c};font-size:11px;font-weight:600;">${icon[type]} ${text}</span>`;
  }
  function _section(title, accentColor, rows) {
    if (!rows.length) return "";
    const rowsHtml = rows.map(
      ([label, value]) => `
      <div style="display:grid;grid-template-columns:140px 1fr;gap:8px;
        padding:5px 0;border-bottom:1px solid #0a0f1a;font-size:11px;align-items:start;">
        <span style="color:#94a3b8;padding-top:1px;">${label}</span>
        <span style="color:#e2e8f0;word-break:break-all;line-height:1.5;">${value}</span>
      </div>
    `
    ).join("");
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
  function _routeRows() {
    return [
      ["Path", location.pathname + (location.search || "")],
      ["Title", document.title || "\u2014"],
      ["Hash", location.hash || "\u2014"],
      ["Referrer", document.referrer || "\u2014"]
    ];
  }
  function _headSection() {
    const rows = [];
    rows.push(["&lt;title&gt;", document.title || '<em style="color:#475569">missing</em>']);
    document.querySelectorAll("meta").forEach((el) => {
      const attrs = [...el.attributes].map((a) => `${a.name}="${a.value}"`).join(" ");
      rows.push([`&lt;meta&gt;`, `<span style="color:#94a3b8;">${attrs}</span>`]);
    });
    document.querySelectorAll("link").forEach((el) => {
      const rel = el.getAttribute("rel") ?? "";
      const href = el.getAttribute("href") ?? "";
      const type = el.getAttribute("type") ?? "";
      const label = rel ? `<span style="color:#60a5fa">${rel}</span>` : "?";
      rows.push([
        `&lt;link&gt;`,
        `${label} ${href ? `<span style="color:#64748b">${href.length > 50 ? href.slice(0, 50) + "\u2026" : href}</span>` : ""} ${type ? `<span style="color:#475569">${type}</span>` : ""}`
      ]);
    });
    document.querySelectorAll("head script").forEach((el) => {
      const src = el.getAttribute("src") ?? "";
      const type = el.getAttribute("type") ?? "";
      rows.push([
        `&lt;script&gt;`,
        `<span style="color:#f59e0b">${src ? src.length > 50 ? src.slice(0, 50) + "\u2026" : src : "inline"}</span>${type ? ` <span style="color:#475569">${type}</span>` : ""}`
      ]);
    });
    const styles = document.querySelectorAll("head style");
    if (styles.length)
      rows.push([
        "&lt;style&gt;",
        `${styles.length} inline style block${styles.length !== 1 ? "s" : ""}`
      ]);
    return rows;
  }
  function _storeRows() {
    const rows = [];
    window.__kor_stores?.forEach((meta2, name) => {
      const keys = Object.keys(meta2.store.getState()).length;
      const updates = meta2.store._updateCount?.() ?? 0;
      const subs = meta2.store._subCount?.() ?? 0;
      rows.push([
        name,
        `${_badge(keys + " keys", "#0f2744", "#60a5fa")} &nbsp;${_badge(subs + " subs", "#0f2a1a", "#34d399")} &nbsp;${_badge(updates + " upd", "#1e293b", "#94a3b8")}`
      ]);
    });
    return rows;
  }
  function _perfRows() {
    const rows = [];
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (nav) {
        const dns = Math.round(nav.domainLookupEnd - nav.domainLookupStart);
        const tcp = Math.round(nav.connectEnd - nav.connectStart);
        const ttfb = Math.round(nav.responseStart - nav.requestStart);
        const domLoad = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
        const total = Math.round(nav.loadEventEnd - nav.startTime);
        if (dns > 0) rows.push(["DNS lookup", dns + "ms"]);
        if (tcp > 0) rows.push(["TCP connect", tcp + "ms"]);
        rows.push(["TTFB", ttfb + "ms"]);
        rows.push(["DOM ready", domLoad + "ms"]);
        if (total > 0) rows.push(["Page load", total + "ms"]);
      }
      if (_lcpValue !== null) rows.push(["LCP", Math.round(_lcpValue) + "ms"]);
    } catch {
    }
    try {
      const mem = performance.memory;
      if (mem) {
        const mb = (v) => (v / (1024 * 1024)).toFixed(1) + " MB";
        rows.push(["JS heap used", mb(mem.usedJSHeapSize)]);
        rows.push(["JS heap total", mb(mem.totalJSHeapSize)]);
      }
    } catch {
    }
    return rows;
  }
  function _structureSection() {
    const app = document.getElementById("kor-app") ?? document.body;
    const TAG_LIST = [
      "div",
      "section",
      "article",
      "main",
      "nav",
      "header",
      "footer",
      "ul",
      "ol",
      "li",
      "p",
      "a",
      "button",
      "form",
      "input",
      "textarea",
      "select",
      "img",
      "table",
      "span",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6"
    ];
    const tagCounts = {};
    TAG_LIST.forEach((tag) => {
      const n = app.querySelectorAll(tag).length;
      if (n > 0) tagCounts[tag] = n;
    });
    const totalEls = app.querySelectorAll("*").length;
    function _depth(el, d = 0) {
      let max = d;
      for (const child of el.children) max = Math.max(max, _depth(child, d + 1));
      return max;
    }
    const domDepth = _depth(app);
    const ids = [...app.querySelectorAll("[id]")].map((el) => el.id).filter((id) => !id.startsWith("kor-"));
    const classCounts = {};
    app.querySelectorAll("[class]").forEach((el) => {
      el.className.split(" ").filter(Boolean).forEach((c) => {
        if (!c.startsWith("kor-")) classCounts[c] = (classCounts[c] ?? 0) + 1;
      });
    });
    const topClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const dataAttrs = /* @__PURE__ */ new Set();
    app.querySelectorAll("*").forEach((el) => {
      Object.keys(el.dataset).forEach(
        (k) => dataAttrs.add("data-" + k.replace(/([A-Z])/g, "-$1").toLowerCase())
      );
    });
    const tagRows = Object.entries(tagCounts).map(
      ([tag, n]) => `${_pill(tag, "#7dd3fc")} <span style="color:#94a3b8;margin-left:4px;">\xD7${n}</span>`
    ).join(" &nbsp;");
    const idPills = ids.length ? ids.map((id) => _pill("#" + id, "#a78bfa")).join(" &nbsp;") : '<span style="color:#64748b;font-style:italic;">none</span>';
    const classPills = topClasses.length ? topClasses.map(
      ([c, n]) => `${_pill("." + c, "#34d399")} <span style="color:#475569;font-size:10px;">\xD7${n}</span>`
    ).join(" &nbsp;") : '<span style="color:#64748b;font-style:italic;">none</span>';
    const dataPills = dataAttrs.size ? [...dataAttrs].slice(0, 10).map((a) => _pill(a, "#f59e0b")).join(" &nbsp;") : '<span style="color:#64748b;font-style:italic;">none</span>';
    const rows = [
      ["Total elements", String(totalEls)],
      ["DOM depth", String(domDepth)],
      ["Tags", tagRows || "\u2014"],
      ["IDs in use", idPills],
      ["Top classes", classPills],
      ["data-* attrs", dataPills]
    ];
    return _section("HTML structure", "#f59e0b", rows);
  }
  function _seoSection() {
    const issues = [];
    const rows = [];
    const title = document.title ?? "";
    const titleLen = title.length;
    if (!title) {
      issues.push("error");
      rows.push(["Title", _status("error", "Missing <title>")]);
    } else if (titleLen < 30) {
      issues.push("warn");
      rows.push([
        "Title",
        _status("warn", `Too short (${titleLen} chars, aim 50\u201360) \u2014 "${title}"`)
      ]);
    } else if (titleLen > 60) {
      issues.push("warn");
      rows.push([
        "Title",
        _status(
          "warn",
          `Too long (${titleLen} chars, aim 50\u201360) \u2014 "${title.slice(0, 60)}\u2026"`
        )
      ]);
    } else {
      rows.push(["Title", _status("ok", `${titleLen} chars \u2014 "${title}"`)]);
    }
    const desc = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    const descLen = desc.length;
    if (!desc) {
      issues.push("error");
      rows.push(["Description", _status("error", "Missing meta description")]);
    } else if (descLen < 80) {
      issues.push("warn");
      rows.push([
        "Description",
        _status("warn", `Too short (${descLen} chars, aim 120\u2013160)`)
      ]);
    } else if (descLen > 160) {
      issues.push("warn");
      rows.push(["Description", _status("warn", `Too long (${descLen} chars, aim 120\u2013160)`)]);
    } else {
      rows.push(["Description", _status("ok", `${descLen} chars`)]);
    }
    const h1s = document.querySelectorAll("h1");
    if (h1s.length === 0) {
      issues.push("error");
      rows.push(["H1", _status("error", "No <h1> found")]);
    } else if (h1s.length > 1) {
      issues.push("warn");
      rows.push(["H1", _status("warn", `${h1s.length} <h1> tags (should be exactly 1)`)]);
    } else {
      rows.push(["H1", _status("ok", `"${h1s[0].textContent.trim().slice(0, 60)}"`)]);
    }
    const headingLevels = [1, 2, 3, 4, 5, 6].filter((n) => document.querySelector(`h${n}`));
    let skipped = false;
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        skipped = true;
        break;
      }
    }
    if (skipped) {
      issues.push("warn");
      rows.push([
        "Headings",
        _status(
          "warn",
          `Skipped heading level \u2014 found: ${headingLevels.map((n) => "H" + n).join("\u2192")}`
        )
      ]);
    } else if (headingLevels.length > 0) {
      rows.push(["Headings", _status("ok", headingLevels.map((n) => "H" + n).join("\u2192"))]);
    }
    const imgs = [...document.querySelectorAll("img")];
    const noAlt = imgs.filter((img) => !img.hasAttribute("alt") || img.alt.trim() === "");
    if (noAlt.length > 0) {
      issues.push(noAlt.length > 2 ? "error" : "warn");
      rows.push([
        "Images",
        _status(
          noAlt.length > 2 ? "error" : "warn",
          `${noAlt.length} of ${imgs.length} img${imgs.length !== 1 ? "s" : ""} missing alt`
        )
      ]);
    } else if (imgs.length > 0) {
      rows.push(["Images", _status("ok", `All ${imgs.length} images have alt`)]);
    }
    const links = [...document.querySelectorAll("a[href]")];
    const emptyLinks = links.filter(
      (a) => !a.textContent.trim() && !a.querySelector("img[alt]")
    );
    if (emptyLinks.length > 0) {
      issues.push("warn");
      rows.push([
        "Links",
        _status(
          "warn",
          `${emptyLinks.length} link${emptyLinks.length !== 1 ? "s" : ""} with no text`
        )
      ]);
    } else if (links.length > 0) {
      rows.push(["Links", _status("ok", `${links.length} links, all have text`)]);
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      issues.push("warn");
      rows.push(["Canonical", _status("warn", "No canonical link tag")]);
    } else {
      rows.push(["Canonical", _status("ok", canonical.href)]);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogMissing = [
      !ogTitle && "og:title",
      !ogDesc && "og:description",
      !ogImage && "og:image"
    ].filter(Boolean);
    if (ogMissing.length === 3) {
      issues.push("warn");
      rows.push(["Open Graph", _status("warn", "No OG tags found")]);
    } else if (ogMissing.length > 0) {
      issues.push("warn");
      rows.push(["Open Graph", _status("warn", `Missing: ${ogMissing.join(", ")}`)]);
    } else {
      rows.push(["Open Graph", _status("ok", "og:title, og:description, og:image present")]);
    }
    const robotsMeta = document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "";
    if (robotsMeta.includes("noindex")) {
      issues.push("warn");
      rows.push(["Robots", _status("warn", `noindex set \u2014 page won't be indexed`)]);
    } else {
      rows.push(["Robots", _status("ok", robotsMeta || "index, follow (default)")]);
    }
    const lang = document.documentElement.getAttribute("lang");
    if (!lang) {
      issues.push("warn");
      rows.push(["Lang attr", _status("warn", "Missing lang attribute on <html>")]);
    } else {
      rows.push(["Lang attr", _status("ok", lang)]);
    }
    const errorCount = issues.filter((i) => i === "error").length;
    const warnCount = issues.filter((i) => i === "warn").length;
    if (countEl) {
      const total = errorCount + warnCount;
      countEl.textContent = total === 0 ? "\u2713" : total;
      countEl.style.background = errorCount > 0 ? "#450a0a" : warnCount > 0 ? "#431407" : "#0f2a1a";
      countEl.style.color = errorCount > 0 ? "#f87171" : warnCount > 0 ? "#fb923c" : "#34d399";
    }
    return _section("SEO audit", "#22c55e", rows);
  }
  function _render() {
    const totalListeners = window.__kor_events?.size ?? 0;
    const totalFires = [...window.__kor_events?.values() ?? []].reduce(
      (n, e) => n + e.fires,
      0
    );
    body.innerHTML = _section("Route", "#3b82f6", _routeRows()) + _section("Head", "#3b82f6", _headSection()) + _section("Stores", "#3b82f6", _storeRows()) + _section("Event listeners", "#3b82f6", [
      ["Attached", String(totalListeners)],
      ["Total fires", String(totalFires)]
    ]) + _structureSection() + _seoSection() + _section("Performance", "#3b82f6", _perfRows());
  }
  _render();
}
var init_devtools_page_client = __esm({
  "src/core/dev-tools/devtools-page.client.js"() {
  }
});

// src/core/dev-tools/devtools-overlay.js
var devtools_overlay_exports = {};
__export(devtools_overlay_exports, {
  mountDevtools: () => mountDevtools
});
function mountDevtools() {
  const panels = [
    { id: "stores", label: "\u{1F5C4} Stores", icon: "\u{1F5C4}" },
    { id: "events", label: "\u26A1 Events", icon: "\u26A1" },
    { id: "network", label: "\u{1F310} Network", icon: "\u{1F310}" },
    { id: "page", label: "\u{1F4C4} Page", icon: "\u{1F4C4}" }
  ];
  const panelShells = panels.map((p) => {
    const hasSearch = p.id === "stores" || p.id === "events";
    const hasClear = p.id === "stores" || p.id === "events" || p.id === "network";
    const searchInput = hasSearch ? `
      <input id="kor-panel-${p.id}-search" type="text" placeholder="search\u2026" style="
        flex:1; background:#0a0f1a; border:1px solid #1e293b;
        color:#e2e8f0; border-radius:4px; padding:3px 8px;
        font-size:11px; font-family:monospace; outline:none; min-width:0;
      "/>` : `<span style="flex:1"></span>`;
    return `
      <div id="kor-panel-${p.id}" style="display:none;flex-direction:column;height:100%;">
        <div style="display:flex;align-items:center;gap:8px;
          padding:8px 12px;border-bottom:1px solid #1e293b;flex-shrink:0;">
          ${p.id !== "page" ? `<span id="kor-panel-${p.id}-count" style="
            background:#1e293b;color:#64748b;border-radius:10px;
            padding:1px 7px;font-size:10px;font-family:monospace;flex-shrink:0;">0</span>` : ""}
          ${searchInput}
          ${hasClear ? `<button id="kor-panel-${p.id}-clear" style="
            background:none;border:1px solid #334155;color:#64748b;border-radius:4px;
            padding:2px 8px;font-size:11px;font-family:monospace;cursor:pointer;flex-shrink:0;
          ">clear</button>` : ""}
        </div>
        <div id="kor-panel-${p.id}-body" style="
          flex:1;overflow-y:auto;font-family:monospace;font-size:12px;"></div>
      </div>`;
  }).join("");
  const tabButtons = panels.map(
    (p) => `
    <button data-tab="${p.id}" style="
      background:none;border:1px solid transparent;color:#475569;
      font-family:monospace;font-size:11px;padding:4px 10px;
      border-radius:5px;cursor:pointer;transition:all 0.15s;">
      ${p.icon} ${p.id}
    </button>`
  ).join("");
  const wrapper = document.createElement("div");
  wrapper.id = "kor-devtools-root";
  wrapper.innerHTML = `
    <!-- Floating launcher -->
    <div id="kor-dt-launcher" style="
      position:fixed;bottom:20px;right:20px;z-index:999998;
      display:flex;flex-direction:column;align-items:flex-end;gap:6px;touch-action:none;">
      <div id="kor-dt-menu" style="
        display:none;flex-direction:column;gap:2px;background:#0f172a;
        border:1px solid #1e293b;border-radius:10px;padding:6px;
        box-shadow:0 8px 32px rgba(0,0,0,0.6);min-width:160px;">
        ${panels.map(
    (p) => `
          <button data-panel="${p.id}" style="
            display:flex;align-items:center;gap:6px;background:none;border:none;
            color:#94a3b8;font-family:monospace;font-size:12px;
            padding:7px 12px;cursor:pointer;width:100%;text-align:left;
            border-radius:6px;transition:background 0.15s,color 0.15s;white-space:nowrap;"
            onmouseover="this.style.background='#1e293b';this.style.color='#e2e8f0'"
            onmouseout="this.style.background='none';this.style.color='#94a3b8'">
            ${p.icon} ${p.label}
          </button>`
  ).join("")}
      </div>
      <button id="kor-dt-btn" title="kor devtools (drag to move)" style="
        width:36px;height:36px;background:#0f172a;border:1px solid #1e293b;
        border-radius:50%;color:#64748b;font-size:15px;font-weight:700;
        font-family:monospace;cursor:grab;display:flex;align-items:center;
        justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.5);
        transition:border-color 0.15s,color 0.15s;user-select:none;">?</button>
    </div>

    <!-- Panel drawer -->
    <div id="kor-dt-drawer" style="
      display:none;position:fixed;top:0;right:0;bottom:0;
      width:min(520px,95vw);min-width:280px;max-width:90vw;
      z-index:999999;background:#0a0f1a;border-left:1px solid #1e293b;
      flex-direction:column;box-shadow:-8px 0 40px rgba(0,0,0,0.7);font-family:monospace;">

      <!-- Resize handle on left edge -->
      <div id="kor-dt-resize" style="
        position:absolute;left:0;top:0;bottom:0;width:5px;cursor:ew-resize;
        z-index:1;background:transparent;transition:background 0.15s;"
        onmouseover="this.style.background='#3b82f633'"
        onmouseout="this.style.background='transparent'"></div>

      <!-- Drawer header -->
      <div style="display:flex;align-items:center;padding:10px 16px;gap:8px;
        border-bottom:1px solid #1e293b;flex-shrink:0;background:#0f172a;">
        <span style="color:#334155;font-size:10px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.1em;flex-shrink:0;">kor</span>
        <div id="kor-dt-tabs" style="display:flex;gap:4px;flex:1;flex-wrap:wrap;">
          ${tabButtons}
        </div>
        <button id="kor-dt-close" style="
          background:none;border:none;color:#475569;
          font-size:18px;cursor:pointer;line-height:1;padding:0 2px;">\u2715</button>
      </div>
      <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
        ${panelShells}
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);
  const launcher = document.getElementById("kor-dt-launcher");
  const btn = document.getElementById("kor-dt-btn");
  const menu = document.getElementById("kor-dt-menu");
  const drawer = document.getElementById("kor-dt-drawer");
  const tabs = document.getElementById("kor-dt-tabs");
  const closeBtn = document.getElementById("kor-dt-close");
  const resizeHandle = document.getElementById("kor-dt-resize");
  let menuOpen = false;
  const _initialised = /* @__PURE__ */ new Set();
  const POS_KEY = "__kor_dt_pos__";
  const WIDTH_KEY = "__kor_dt_width__";
  function _savePos(right, bottom) {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ right, bottom }));
    } catch {
    }
  }
  function _loadPos() {
    try {
      return JSON.parse(localStorage.getItem(POS_KEY) ?? "null");
    } catch {
      return null;
    }
  }
  function _saveWidth(w) {
    try {
      localStorage.setItem(WIDTH_KEY, String(w));
    } catch {
    }
  }
  function _loadWidth() {
    try {
      return parseInt(localStorage.getItem(WIDTH_KEY) ?? "0") || 0;
    } catch {
      return 0;
    }
  }
  const savedPos = _loadPos();
  if (savedPos) {
    launcher.style.right = Math.max(0, savedPos.right) + "px";
    launcher.style.bottom = Math.max(0, savedPos.bottom) + "px";
  }
  const savedWidth = _loadWidth();
  if (savedWidth) drawer.style.width = savedWidth + "px";
  let _dragging = false, _dragStartX = 0, _dragStartY = 0, _origRight = 0, _origBottom = 0;
  btn.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    _dragging = false;
    _dragStartX = e.clientX;
    _dragStartY = e.clientY;
    _origRight = parseInt(launcher.style.right) || 20;
    _origBottom = parseInt(launcher.style.bottom) || 20;
    function onMove(ev) {
      const dx = ev.clientX - _dragStartX;
      const dy = ev.clientY - _dragStartY;
      if (!_dragging && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      if (!_dragging) {
        _dragging = true;
        btn.style.cursor = "grabbing";
      }
      launcher.style.right = Math.max(0, _origRight - dx) + "px";
      launcher.style.bottom = Math.max(0, _origBottom - dy) + "px";
    }
    function onUp() {
      btn.style.cursor = "grab";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (_dragging) {
        _savePos(
          parseInt(launcher.style.right) || 20,
          parseInt(launcher.style.bottom) || 20
        );
        setTimeout(() => {
          _dragging = false;
        }, 0);
      }
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  btn.addEventListener("click", (e) => {
    if (_dragging) return;
    e.stopPropagation();
    _toggleMenu();
  });
  resizeHandle.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = drawer.offsetWidth;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    function onMove(ev) {
      const newWidth = Math.max(
        280,
        Math.min(window.innerWidth * 0.9, startWidth + (startX - ev.clientX))
      );
      drawer.style.width = newWidth + "px";
    }
    function onUp() {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      _saveWidth(drawer.offsetWidth);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  function _toggleMenu() {
    menuOpen = !menuOpen;
    menu.style.display = menuOpen ? "flex" : "none";
    btn.style.borderColor = menuOpen ? "#3b82f6" : "#1e293b";
    btn.style.color = menuOpen ? "#3b82f6" : "#64748b";
  }
  document.addEventListener("click", () => {
    if (!menuOpen) return;
    menuOpen = false;
    menu.style.display = "none";
    btn.style.borderColor = "#1e293b";
    btn.style.color = "#64748b";
  });
  menu.querySelectorAll("[data-panel]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      openPanel(el.dataset.panel);
      menu.style.display = "none";
      menuOpen = false;
    });
  });
  tabs.querySelectorAll("[data-tab]").forEach((el) => {
    el.addEventListener("click", () => openPanel(el.dataset.tab));
  });
  async function openPanel(id) {
    drawer.style.display = "flex";
    document.body.style.transition = "margin-right 0.2s ease";
    document.querySelectorAll('[id^="kor-panel-"]').forEach((el) => {
      if (/^kor-panel-[^-]+$/.test(el.id)) el.style.display = "none";
    });
    const panel = document.getElementById("kor-panel-" + id);
    if (panel) panel.style.display = "flex";
    tabs.querySelectorAll("[data-tab]").forEach((el) => {
      const active = el.dataset.tab === id;
      el.style.background = active ? "#1e293b" : "none";
      el.style.borderColor = active ? "#3b82f6" : "transparent";
      el.style.color = active ? "#e2e8f0" : "#475569";
    });
    if (!_initialised.has(id)) {
      _initialised.add(id);
      const initFn = window.__korDevtools?.[id];
      if (typeof initFn === "function") await initFn();
    }
    if (id === "stores") window.__korDevtools?._refreshStores?.();
  }
  function close() {
    drawer.style.display = "none";
    document.body.style.marginRight = "";
  }
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}
var init_devtools_overlay = __esm({
  "src/core/dev-tools/devtools-overlay.js"() {
  }
});

// src/core/store/store.js
function createStore(initial, _name) {
  let _state = { ...initial };
  const _listeners = /* @__PURE__ */ new Set();
  let _updates = 0;
  const _keySubscribers = true ? /* @__PURE__ */ new Map() : null;
  const _manualSubscribers = true ? /* @__PURE__ */ new Map() : null;
  let _manualSubId = true ? 0 : 0;
  const _history = true ? [] : null;
  const HISTORY_MAX = 50;
  let name = _name ?? null;
  const store = {
    _store_symbol: "__korejs_store",
    getState() {
      return _state;
    },
    setState(updater) {
      const oldState = _state;
      const patch = typeof updater === "function" ? updater(_state) : updater;
      _state = { ..._state, ...patch };
      if (true) {
        _updates++;
        for (const key of Object.keys(patch)) {
          if (!Object.is(oldState[key], _state[key])) {
            _history.unshift({
              key,
              oldVal: oldState[key],
              newVal: _state[key],
              time: Date.now()
            });
            if (_history.length > HISTORY_MAX) _history.length = HISTORY_MAX;
          }
        }
      }
      _listeners.forEach((fn) => fn(_state));
    },
    subscribe(listener) {
      _listeners.add(listener);
      if (!listener.__korDevtools && !listener.__korBinding) {
        const src = listener?.toString() ?? "";
        const label = src.length > 60 ? src.slice(0, 59) + "\u2026" : src;
        const id = `manual_${_manualSubId++}`;
        const paramMatch = src.match(
          /^(?:(?:function\s*\w*\s*\((\w+))|(\w+)\s*=>|\((\w+)\)\s*=>)/
        );
        const param = paramMatch?.[1] ?? paramMatch?.[2] ?? paramMatch?.[3] ?? "s";
        const keys = [
          ...new Set(
            [...src.matchAll(new RegExp(`\\b${param}\\.(\\w+)\\b`, "g"))].map(
              (m) => m[1]
            )
          )
        ];
        _manualSubscribers.set(listener, {
          id,
          label,
          registeredAt: Date.now(),
          keys
        });
        if (name) window.__korDevtools?._onStoreUpdate?.(name);
      }
      return () => {
        _listeners.delete(listener);
        if (_manualSubscribers.has(listener)) {
          _manualSubscribers.delete(listener);
          if (name) window.__korDevtools?._onStoreUpdate?.(name);
        }
      };
    }
  };
  if (true) {
    store._updateCount = () => _updates;
    store._subCount = () => [..._listeners].filter((fn) => !fn.__korDevtools).length;
    store._manualSubCount = () => _manualSubscribers.size;
    store._manualSubs = () => [..._manualSubscribers.values()];
    if (typeof window !== "undefined") {
      if (!window.__kor_stores) window.__kor_stores = /* @__PURE__ */ new Map();
      name = _name || `store_${window.__kor_stores.size + 1}`;
      window.__kor_stores.set(name, {
        store,
        history: _history,
        subscribers: _keySubscribers,
        manualSubscribers: _manualSubscribers,
        name
      });
      store._devName = name;
      const _devNotify = () => {
        window.__korDevtools?._onStoreUpdate?.(name);
      };
      _devNotify.__korDevtools = true;
      store.subscribe(_devNotify);
    }
    store._trackSubscriber = (elId, keys, type = "?", getValue = null, src = null) => {
      for (const key of keys) {
        if (!_keySubscribers.has(key)) _keySubscribers.set(key, /* @__PURE__ */ new Map());
        _keySubscribers.get(key).set(elId, { type, getValue, src });
      }
    };
    store._untrackSubscriber = (elId) => {
      _keySubscribers.forEach((map) => map.delete(elId));
    };
  }
  return new Proxy(store, {
    get(target, key) {
      if (key in target) return target[key];
      return _state[key];
    },
    set(target, key, value) {
      try {
        store.setState({ [key]: value });
        return true;
      } catch (err) {
        console.error("Failed to update state:", err);
        return false;
      }
    }
  });
}
function isStore(v) {
  if (v?._store_symbol === "__korejs_store") return true;
  return v != null && typeof v === "object" && typeof v.getState === "function" && typeof v.setState === "function" && typeof v.subscribe === "function";
}

// src/core/html/html.js
var __KORE_JS_TRUSTED_HTML = /* @__PURE__ */ Symbol("__KORE_JS_TRUSTED_HTML ");
var checkIfItReturnedByRaw = (val) => {
  const isRenderable = val?.[__KORE_JS_TRUSTED_HTML] === true;
  return {
    isRenderable,
    content: isRenderable ? val : null
  };
};
var KoreJsSafeHtml = class extends String {
  get [__KORE_JS_TRUSTED_HTML]() {
    return true;
  }
};
var ESC_MAP = {
  "&": "&amp;",
  // must be first to avoid double-escaping
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
  // prevents <\/script> injection
  "`": "&#96;"
  // attribute delimiter in some contexts
};
function esc(val) {
  return String(val ?? "").replace(/[&<>"'`/]/g, (c) => ESC_MAP[c]);
}
function raw(strings, ...values) {
  let result = "";
  strings.forEach((str, i) => {
    result += str;
    if (i < values.length) {
      const val = values[i];
      if (Array.isArray(val)) {
        result += val.map((v) => checkIfItReturnedByRaw(v).isRenderable ? String(v) : esc(v)).join("");
      } else if (val == null || val === false) {
        result += "";
      } else if (checkIfItReturnedByRaw(val).isRenderable) {
        result += String(val);
      } else {
        result += esc(val);
      }
    }
  });
  return new KoreJsSafeHtml(result);
}

// src/core/dom/internal/lis.js
function _lis(arr) {
  const tails = [];
  const tailIdx = [];
  const parent = new Array(arr.length).fill(-1);
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (tails[mid] < val) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = val;
    tailIdx[lo] = i;
    if (lo > 0) parent[i] = tailIdx[lo - 1];
  }
  const result = /* @__PURE__ */ new Set();
  let idx = tailIdx[tails.length - 1];
  while (idx !== void 0 && idx !== -1) {
    result.add(idx);
    idx = parent[idx];
  }
  return result;
}

// src/core/dom/internal/node-checker.js
var nodeChecker = (target) => {
  const nodeTypesMaps = {
    1: "Element",
    3: "Text",
    8: "Comment",
    9: "Document",
    11: "DocumentFragment"
  };
  let isNode = false;
  let type = null;
  if (target) {
    if (target.nodeType in nodeTypesMaps) {
      isNode = true;
      type = nodeTypesMaps[target.nodeType];
    } else if (NodeList.prototype.isPrototypeOf(target)) {
      isNode = true;
      type = "NodeList";
    } else if (HTMLCollection.prototype.isPrototypeOf(target)) {
      isNode = true;
      type = "HTMLCollection";
    }
  }
  return { isNode, type };
};

// src/core/dom/internal/resolve-element.js
function _resolveElement(selector) {
  if ((selector === null || selector === void 0) && arguments.length > 0) {
    return null;
  }
  if (arguments.length === 0 || selector === "document") {
    const document2 = window?.document;
    if (!document2) {
      if (true) {
        window.__korDevtools?.reportError?.({
          type: "ELEMENT_NOT_FOUND",
          message: `Failed to get html document`
        });
      }
      return null;
    }
    return document2;
  }
  if (nodeChecker(selector).isNode) return selector;
  if (typeof selector === "string" && selector.startsWith("<")) {
    const template = document.createElement("template");
    try {
      template.innerHTML = selector;
    } catch (err) {
      template.replaceChildren();
      if (true) {
        window.__korDevtools?.reportError?.({
          type: "FAILED_TO_CREATE_ELEMENT",
          message: `Failed to create Element for selector: $('${selector}')`
        });
      }
      throw new Error(
        `[kore-js] FAILED_TO_CREATE_ELEMENT: Failed to create Element for selector: $('${selector}')`
      );
    }
    const els = [...template.content.children];
    if (!els.length) {
      if (true) {
        window.__korDevtools?.reportError?.({
          type: "FAILED_TO_CREATE_ELEMENT",
          message: `No elements were created from: $('${selector}')`
        });
      }
      throw new Error(
        `[kore-js] FAILED_TO_CREATE_ELEMENT: No elements were created from: $('${selector}')`
      );
    }
    return els.length === 1 ? els[0] : els;
  }
  if (Array.isArray(selector)) {
    if (selector.every((s) => s && s.nodeType)) {
      return selector;
    }
    try {
      const els = [...document.querySelectorAll(selector.join(", "))];
      if (!els.length) {
        if (true)
          window.__korDevtools?.reportError?.({
            type: "ELEMENT_NOT_FOUND",
            message: `No elements found for selectors: $('${selector.join(", ")}')`
          });
        throw new Error(
          `[kore-js] ELEMENT_NOT_FOUND: No elements found for selectors: $('${selector.join(", ")}')`
        );
      }
      return els;
    } catch (err) {
      if (true) window.__korDevtools?.reportError?.({ message: err.message ?? err });
      throw err;
    }
  }
  let el = null;
  if (typeof selector === "object" && selector.id) {
    el = document.getElementById(selector.id);
  } else if (typeof selector === "string") {
    try {
      el = selector.startsWith("#") ? document.getElementById(selector.slice(1)) : document.querySelector(selector);
    } catch (err) {
      const formatted = `$('${selector ?? ""}')`;
      if (true) {
        window.__korDevtools?.reportError?.({
          type: "ELEMENT_NOT_FOUND",
          message: `Failed to find element for selector: ${formatted}`
        });
      }
      throw new Error(
        `[kore-js] ELEMENT_NOT_FOUND: Failed to find element for selector: ${formatted}`
      );
    }
  }
  if (!el) {
    const formatted = `$('${selector ?? ""}')`;
    if (true) {
      window.__korDevtools?.reportError?.({
        type: "ELEMENT_NOT_FOUND",
        message: `Element not found for selector: ${formatted}`
      });
    }
    throw new Error(
      `[kore-js] ELEMENT_NOT_FOUND: Element not found for selector: ${formatted}`
    );
  }
  return el;
}

// src/core/dom/internal/sanitizers.js
var _URI_ATTRS = /* @__PURE__ */ new Set(["href", "src", "action", "formaction", "xlink:href"]);
var _BAD_URI = /^\s*(javascript|data)\s*:/i;
function _sanitize(html) {
  if (!html) return "";
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  tpl.content.querySelectorAll("*").forEach((node) => {
    for (const { name, value } of [...node.attributes]) {
      if (/^on/i.test(name)) {
        node.removeAttribute(name);
        continue;
      }
      if (_URI_ATTRS.has(name.toLowerCase()) && _BAD_URI.test(value))
        node.setAttribute(name, "");
    }
  });
  const wrapper = document.createElement("div");
  wrapper.appendChild(tpl.content.cloneNode(true));
  return wrapper.innerHTML;
}
function _safeAttrVal(attrName, value) {
  return _URI_ATTRS.has(attrName.toLowerCase()) && _BAD_URI.test(value ?? "") ? "" : value;
}

// src/core/dom/__dev/dev-tool-helpers.js
function _devElId(selector) {
  if (false) return null;
  if (typeof selector === "string")
    return selector.startsWith("#") ? selector.slice(1) : selector;
  if (typeof selector === "object" && selector.id) return selector.id;
  if (selector instanceof Element) return selector.id || selector.tagName?.toLowerCase();
  return null;
}
function _devPickedKeys(keyOrFn2) {
  if (false) return [];
  if (typeof keyOrFn2 === "string") return [keyOrFn2];
  const src = keyOrFn2?.toString() ?? "";
  const paramMatch = src.match(/^(?:(?:function\s*\w*\s*\((\w+))|(\w+)\s*=>|\((\w+)\)\s*=>)/);
  const param = paramMatch?.[1] ?? paramMatch?.[2] ?? paramMatch?.[3] ?? "s";
  const keys = [...src.matchAll(new RegExp(`\\b${param}\\.(\\w+)\\b`, "g"))].map((m) => m[1]);
  return [...new Set(keys)];
}
function _devPickerSrc(keyOrFn2) {
  if (false) return null;
  if (typeof keyOrFn2 === "string") return `'${keyOrFn2}'`;
  const src = keyOrFn2?.toString() ?? "";
  return src.length > 48 ? src.slice(0, 47) + "\u2026" : src;
}
function _devMeta(selector, keyOrFn2, bindingType) {
  if (false) return null;
  return {
    elId: _devElId(selector),
    keys: _devPickedKeys(keyOrFn2),
    type: bindingType,
    src: _devPickerSrc(keyOrFn2)
  };
}

// src/core/dom/internal/bind.js
function _bind(store, pickerFn, onValue, devMeta) {
  let prev = /* @__PURE__ */ Symbol();
  if (typeof pickerFn !== "function") {
    window?.__korDevtools?.reportError?.({
      type: "MISSING_KEY_OR_FN",
      message: `keyOrFn should be a function instead received: ${typeof keyOrFn}
Store name: ${JSON.stringify(store._devName)}
bindingType: ${devMeta.type}
selector: ${devMeta.elId}`
    });
  }
  const run = (state) => {
    const next = pickerFn(state);
    if (Object.is(next, prev)) return;
    prev = next;
    onValue(next);
  };
  run(store.getState());
  if (true) run.__korBinding = true;
  const unsub = store.subscribe(run);
  if (devMeta) {
    const { elId, keys, type = "?", src = null } = devMeta;
    store._trackSubscriber?.(elId, keys, type, () => pickerFn(store.getState()), src);
  }
}

// src/core/dom/internal/resolve-target.js
function _resolveTarget(target) {
  if (target && typeof target === "object" && target.el) return target.el;
  if (target && typeof target === "object" && target.els) {
    const frag = document.createDocumentFragment();
    target.els.forEach((el) => frag.appendChild(el));
    return frag;
  }
  if (target instanceof Node) return target;
  if (typeof target === "string") {
    const template = document.createElement("template");
    template.innerHTML = target;
    return template.content;
  }
  if (true) console.warn("[kore-js] Unsupported target type passed to DOM method:", typeof target);
  return null;
}

// src/core/dom/dom.js
function _toFn(keyOrFn2) {
  return typeof keyOrFn2 === "string" ? (state) => state[keyOrFn2] : keyOrFn2;
}
function $(selector, props = {}) {
  const isSelectorArr = Array.isArray(selector) && selector.length > 0 || NodeList.prototype.isPrototypeOf(selector) || HTMLCollection.prototype.isPrototypeOf(selector);
  const resolvedEl = arguments.length > 0 ? _resolveElement(selector) : _resolveElement();
  const forEachEl = (fn) => {
    if (isSelectorArr) resolvedEl.forEach((el) => el && fn(el));
    else if (resolvedEl) fn(resolvedEl);
  };
  const _listeners = /* @__PURE__ */ new WeakMap();
  const _getHandlerMap = (el, eventName) => _listeners.get(el)?.get(eventName);
  const _isDuplicate = (el, eventName, handler) => _getHandlerMap(el, eventName)?.has(handler) ?? false;
  const _trackListener = (el, eventName, handler, activeHandler) => {
    if (!_listeners.has(el)) _listeners.set(el, /* @__PURE__ */ new Map());
    const byEvent = _listeners.get(el);
    if (!byEvent.has(eventName)) byEvent.set(eventName, /* @__PURE__ */ new Map());
    byEvent.get(eventName).set(handler, activeHandler);
  };
  const _untrackListener = (el, eventName, handler) => _getHandlerMap(el, eventName)?.delete(handler);
  const attachListener = (el, eventName, handler, devStoreMeta) => {
    if (el && _isDuplicate(el, eventName, handler)) {
      if (true) {
        window?.__korDevtools?._devWarn?.(
          `[kore-js] (on) Duplicate listener ignored for event "${eventName}" on`,
          "DUPLICATE_EVENT"
        );
      }
      console.warn(
        `[kore-js] (on) Duplicate listener ignored for event "${eventName}" on`,
        "DUPLICATE_EVENT"
      );
      return;
    }
    const elId = el?.id ?? null;
    const elTag = el?.tagName?.toLowerCase() ?? "";
    const elCls = el?.className ?? "";
    let devRegKey = null;
    if (true) {
      if (!window.__kor_events) window.__kor_events = /* @__PURE__ */ new Map();
      const identity = elId ? `#${elId}` : `${elTag}${elCls ? "." + elCls : ""}`;
      devRegKey = `${eventName}::${identity}`;
      const handlerSnippet = (() => {
        const s = handler?.toString() ?? "";
        return s.length > 60 ? s.slice(0, 59) + "\u2026" : s;
      })();
      if (!window.__kor_events.has(devRegKey)) {
        window.__kor_events.set(devRegKey, {
          type: eventName,
          elId,
          elTag,
          elCls,
          store: devStoreMeta?.store ?? null,
          keys: devStoreMeta?.keys ?? [],
          handlerSrc: handlerSnippet,
          fires: 0,
          lastFire: null
        });
      }
      window.__korDevtools?._onEventRegister?.();
    }
    const activeHandler = true ? function(e) {
      const entry = window.__kor_events?.get(devRegKey);
      if (entry) {
        entry.fires++;
        entry.lastFire = Date.now();
      }
      window.__kor_recordFire?.(devRegKey);
      return handler.call(this, e);
    } : handler;
    if (el) {
      el.addEventListener(eventName, activeHandler);
      _trackListener(el, eventName, handler, activeHandler);
      return;
    }
    const delegated = (e) => {
      const target = e.target.closest?.(selector);
      if (target) activeHandler.call(target, e);
    };
    document.addEventListener(eventName, delegated);
  };
  if (typeof selector === "string" && selector.startsWith("<") && Object.keys(props).length) {
    const targets = Array.isArray(resolvedEl) ? resolvedEl : [resolvedEl];
    for (const el of targets) {
      for (const [key, val] of Object.entries(props)) {
        if (typeof val === "function") {
          attachListener(el, key, val);
        } else if (key === "class") {
          el.className = val;
        } else if (key === "style" && typeof val === "object") {
          Object.assign(el.style, val);
        } else if (key in el) {
          el[key] = val;
        } else {
          el.setAttribute(key, val);
        }
      }
    }
  }
  const reactiveOrStatic = (source, keyOrFn2, bindingType, apply) => {
    const _source = typeof source === "function" ? source() : source;
    forEachEl((el) => {
      if (isStore(_source)) {
        _bind(
          _source,
          _toFn(keyOrFn2),
          (v) => apply(el, v),
          _devMeta(selector, keyOrFn2, bindingType)
        );
      } else {
        apply(el, _source);
      }
    });
  };
  const api = {
    on(eventName, handler, devStoreMeta) {
      forEachEl((el) => attachListener(el, eventName, handler, devStoreMeta));
      return api;
    },
    off(eventName, handler) {
      forEachEl((el) => {
        const active = _getHandlerMap(el, eventName)?.get(handler) ?? handler;
        el.removeEventListener(eventName, active);
        _untrackListener(el, eventName, handler);
      });
      return api;
    },
    text(source, keyOrFn2) {
      reactiveOrStatic(source, keyOrFn2, "text", (el, v) => {
        el.textContent = v ?? "";
      });
      return api;
    },
    html(source, keyOrTemplateFn) {
      reactiveOrStatic(source, keyOrTemplateFn, "html", (el, v) => {
        if (typeof source !== "function") {
          el.innerHTML = _sanitize(v ?? "");
          return;
        }
        const _html = source();
        if (typeof _html !== "string" && !(_html instanceof KoreJsSafeHtml)) {
          if (true)
            window?.__korDevtools?.reportError?.({
              type: "TYPE_MISMATCH",
              message: `Source should be a string or instance of KoreJsSafeHtml(raw``), but got ${typeof _html}\nsource: ${JSON.stringify(_html)}\nstore: ${JSON.stringify(source._devName)}\nkeyOrFn: ${keyOrTemplateFn}\nselector: ${selector}`
            });
          throw new Error(
            `[kore-js] TYPE_MISMATCH: Source should be a string or instance of KoreJsSafeHtml(raw``), but got ${typeof _html}`
          );
        }
        el.innerHTML = _sanitize(_html);
      });
      return api;
    },
    attr(attrName, source, keyOrFn2) {
      const _attrName = typeof attrName === "function" ? attrName() : attrName;
      const _source = typeof source === "function" ? source() : source;
      forEachEl((el) => {
        if (isStore(_source)) {
          _bind(
            _source,
            _toFn(keyOrFn2),
            (v) => el.setAttribute(_attrName, _safeAttrVal(_attrName, v)),
            _devMeta(selector, keyOrFn2, "attr")
          );
        } else {
          el.setAttribute(_attrName, _safeAttrVal(_attrName, _source));
        }
      });
      return api;
    },
    removeAttr(attrName) {
      forEachEl((el) => el.removeAttribute(attrName));
      return api;
    },
    cls(className, source, keyOrFn2) {
      const _className = typeof className === "function" ? className() : className;
      const _source = typeof source === "function" ? source() : source;
      forEachEl((el) => {
        if (isStore(_source)) {
          _bind(
            _source,
            _toFn(keyOrFn2),
            (v) => el.classList.toggle(_className, !!v),
            _devMeta(selector, keyOrFn2, "cls")
          );
        } else {
          el.classList.toggle(_className, !!_source);
        }
      });
      return api;
    },
    addClass(className, source, keyOrFn2, conditionFn) {
      const _className = typeof className === "function" ? className() : className;
      reactiveOrStatic(source, keyOrFn2, "addClass", (el, v) => {
        if (typeof conditionFn === "function") {
          const conditionFnRes = conditionFn(v);
          if (typeof conditionFnRes !== "boolean") {
            if (true)
              window?.__korDevtools?.reportError?.({
                type: "TYPE_MISMATCH",
                message: `conditionFn should return a boolean value, but got ${typeof conditionFnRes}
conditionFn: ${conditionFn.toString()}
store: ${JSON.stringify(source._devName)}
keyOrFn: ${keyOrFn2}
selector: ${selector}`
              });
            throw new Error(
              `[kore-js] TYPE_MISMATCH: conditionFn should return a boolean value, but got ${typeof conditionFnRes}`
            );
          }
          conditionFnRes && el.classList.add(_className);
        } else {
          el.classList.add(_className);
        }
      });
      return api;
    },
    removeClass(className) {
      forEachEl((el) => el.classList.remove(className));
      return api;
    },
    style(cssProp, source, keyOrFn2) {
      const _cssProp = typeof cssProp === "function" ? cssProp() : cssProp;
      const _source = typeof source === "function" ? source() : source;
      forEachEl((el) => {
        if (isStore(_source)) {
          _bind(
            _source,
            _toFn(keyOrFn2),
            (v) => {
              el.style[_cssProp] = v;
            },
            _devMeta(selector, keyOrFn2, "style")
          );
        } else {
          el.style[_cssProp] = _source;
        }
      });
      return api;
    },
    show(source, keyOrFn2) {
      reactiveOrStatic(source, keyOrFn2, "show", (el, v) => {
        el.style.display = v ? "" : "none";
      });
      return api;
    },
    hide() {
      forEachEl((el) => {
        el.style.display = "none";
      });
      return api;
    },
    if(source, keyOrFn2, templateFn) {
      const hasStore = isStore(source);
      const func = hasStore ? _toFn(keyOrFn2) : null;
      const callbackFn = hasStore ? templateFn : keyOrFn2;
      forEachEl((el) => {
        let lastState = null;
        const render = (condition) => {
          if (condition) {
            if (lastState === true) return;
            const InstanceOfRawOrPrimitiveString = hasStore ? callbackFn(source) : callbackFn();
            el.innerHTML = _sanitize(InstanceOfRawOrPrimitiveString);
            lastState = true;
          } else {
            if (lastState === false) return;
            el.innerHTML = "";
            lastState = false;
          }
        };
        if (hasStore) {
          _bind(source, func, render, _devMeta(selector, keyOrFn2, "if"));
        } else {
          const _source = typeof source === "function" ? source() : source;
          if (typeof source !== "boolean") {
            if (true)
              window.__korDevtools?.reportError?.({
                type: "TYPE_MISMATCH",
                message: `source must be a "boolean" but received a typeof "${typeof source}": source->${JSON.stringify(source) || source} ${hasStore ? "Store-> " + source._devName : ""}`
              });
            throw new Error(
              `[kore-js] TYPE_MISMATCH: source must be a "boolean" but received typeof "${typeof source}"`
            );
          }
          render(_source);
        }
      });
      return api;
    },
    when(source, keyOrFn2, branches) {
      const hasStore = isStore(source);
      const func = hasStore ? _toFn(keyOrFn2) : null;
      const branchMap = hasStore ? branches : keyOrFn2;
      forEachEl((el) => {
        let lastBranch = null;
        const render = (condition) => {
          const branch = condition ? "true" : "false";
          if (branch === lastBranch) return;
          const InstanceOfRawOrPrimitiveString = (condition ? branchMap.true : branchMap.false)?.();
          el.innerHTML = _sanitize(InstanceOfRawOrPrimitiveString);
          lastBranch = branch;
        };
        if (hasStore) {
          _bind(source, func, render, _devMeta(selector, keyOrFn2, "when"));
        } else {
          const _source = typeof source === "function" ? source() : source;
          if (typeof source !== "boolean") {
            if (true)
              window.__korDevtools?.reportError?.({
                type: "TYPE_MISMATCH",
                message: `source must be a "boolean" but received a typeof "${typeof source}": source->${JSON.stringify(source) || source} ${hasStore ? "Store-> " + source._devName : ""}`
              });
            throw new Error(
              `[kore-js] TYPE_MISMATCH: source must be a "boolean" but received typeof "${typeof source}"`
            );
          }
          render(_source);
        }
      });
      return api;
    },
    each(source, keyOrFn2, templateFn, uniquekeyFn) {
      const hasStore = isStore(source);
      const picker = hasStore ? _toFn(keyOrFn2) : null;
      const tplFn = hasStore ? templateFn : keyOrFn2;
      const getKey = hasStore ? uniquekeyFn ?? ((_, i) => i) : templateFn ?? ((_, i) => i);
      forEachEl((el) => {
        const nodesByKey = /* @__PURE__ */ new Map();
        const render = (items) => {
          if (!Array.isArray(items)) return;
          const seen = /* @__PURE__ */ new Set();
          items.forEach((item, i) => {
            const _key = getKey(item, i);
            if (typeof _key !== "string" && typeof _key !== "number") {
              if (true)
                window.__korDevtools?.reportError?.({
                  type: "TYPE_MISMATCH",
                  message: `uniquekeyFn must return a string or number but received a "${_key}"
${hasStore && "Store -> " + source._devName}
uniquekeyFn used -> ${getKey}
item -> ${JSON.stringify(item)}`
                });
              throw new Error(
                `[kore-js] TYPE_MISMATCH: uniquekeyFn must return a string or number but received "${_key}"`
              );
            }
            const rowKey = String(_key);
            if (seen.has(rowKey)) {
              if (true)
                window.__korDevtools?.reportError?.({
                  type: "DUPLICATE_KEY",
                  message: `
-Duplicate key "${rowKey}" found in each() list. Each key must be unique.
-item->${JSON.stringify(item)}
-You use this to derive key->${getKey}`
                });
              throw new Error(
                `[kore-js] DUPLICATE_KEY: Duplicate key "${rowKey}" found in each() list`
              );
            }
            seen.add(rowKey);
            if (nodesByKey.has(rowKey)) {
              const entry = nodesByKey.get(rowKey);
              if (!Object.is(entry.item, item)) {
                const tmp = document.createElement("template");
                tmp.innerHTML = _sanitize(tplFn(item, i));
                if (tmp.content.childElementCount > 1) {
                  if (true)
                    window.__korDevtools?._devWarn?.(
                      "Template returned multiple root elements. Wrap them in a single parent.",
                      "each"
                    );
                  console.warn(
                    "[kore-js] (each) Template returned multiple root elements. Wrap them in a single parent."
                  );
                }
                const newNode = tmp.content.firstElementChild;
                if (newNode) {
                  newNode.dataset.korKey = rowKey;
                  entry.node.replaceWith(newNode);
                  entry.node = newNode;
                  entry.item = item;
                }
              }
            } else {
              const tmp = document.createElement("template");
              const rendered = tplFn(item, i);
              tmp.innerHTML = _sanitize(rendered);
              if (tmp.content.childElementCount > 1) {
                if (true)
                  window.__korDevtools?._devWarn?.(
                    "Template returned multiple root elements. Wrap them in a single parent.",
                    "each"
                  );
                console.warn(
                  "[kore-js] (each) Template returned multiple root elements. Wrap them in a single parent."
                );
              }
              const node = tmp.content.firstElementChild;
              if (node) {
                node.dataset.korKey = rowKey;
                el.appendChild(node);
                nodesByKey.set(rowKey, { item, node });
              }
            }
          });
          nodesByKey.forEach(({ node }, rowKey) => {
            if (!seen.has(rowKey)) {
              node.remove();
              nodesByKey.delete(rowKey);
            }
          });
          const domOrder = [...el.children].map((n) => n.dataset.korKey);
          const keyToPos = new Map(domOrder.map((k, i) => [k, i]));
          const expectedKeys = items.map((item, i) => String(getKey(item, i)));
          const positions = expectedKeys.map((k) => keyToPos.get(k) ?? -1);
          const lisIndices = _lis(positions);
          let cursor = null;
          for (let i = expectedKeys.length - 1; i >= 0; i--) {
            const n = nodesByKey.get(expectedKeys[i]);
            const node = n ? n.node : null;
            if (!lisIndices.has(i)) {
              el.insertBefore(node, cursor);
            }
            cursor = node;
          }
        };
        if (hasStore) _bind(source, picker, render, _devMeta(selector, keyOrFn2, "each"));
        else render(source);
      });
      return api;
    },
    val(_value, onChangeFn) {
      forEachEl((el) => {
        el.value = (typeof _value === "function" ? _value() : _value) ?? "";
        if (typeof onChangeFn === "function") {
          const handler = (e) => onChangeFn(e.target.value, e);
          el.addEventListener("input", handler);
        }
      });
      return api;
    },
    checked(source, keyOrFn2) {
      reactiveOrStatic(source, keyOrFn2, "checked", (el, v) => {
        el.checked = !!v;
      });
      return api;
    },
    booleanAttr(propName, source, keyOrFn2) {
      reactiveOrStatic(source, keyOrFn2, "booleanAttr", (el, v) => {
        el[propName] = !!v;
      });
      return api;
    },
    focus(source = true, keyOrFn2) {
      reactiveOrStatic(source, keyOrFn2, "focus", (el, v) => {
        if (v) el.focus();
      });
      return api;
    },
    find(_selector, callbackFn, options) {
      const _options = (typeof callbackFn === "object" ? callbackFn : options) || {};
      const found = [];
      forEachEl((el) => {
        const _el = el.querySelector(_selector);
        if (!_el && _options.strict) {
          if (true)
            window.__korDevtools?.reportError?.({
              type: "INVALID_SELECTOR",
              message: `Failed to find element with selector: ${_selector}`
            });
          throw new Error(
            `[kore-js] INVALID_SELECTOR: Failed to find element with selector: ${_selector}`
          );
        }
        if (_el) found.push(_el);
        callbackFn && typeof callbackFn === "function" && callbackFn($(_el));
      });
      return found.length === 0 ? $(null) : found.length === 1 ? $(found[0]) : $(found);
    },
    findAll(_selector, callbackFn, options) {
      const _options = (typeof callbackFn === "object" ? callbackFn : options) || {};
      const found = [];
      forEachEl((el) => {
        const _els = [...el.querySelectorAll(_selector)];
        if (!_els.length && _options.strict) {
          if (true)
            window.__korDevtools?.reportError?.({
              type: "ELEMENTS_NOT_FOUND",
              message: `Failed to find element/elements with selector: ${_selector}`
            });
          throw new Error(
            `[kore-js] ELEMENTS_NOT_FOUND: Failed to find element/elements with selector: ${_selector}`
          );
        }
        found.push(..._els);
        callbackFn && typeof callbackFn === "function" && callbackFn($(_els));
      });
      return found.length === 0 ? $(null) : found.length === 1 ? $(found[0]) : $(found);
    },
    // ── DOM Manipulation ──────────────────────────────────────────────────────────
    append(...targets) {
      forEachEl((el) => {
        for (const target of targets) {
          if (target && typeof target === "object" && target.el) {
            el.appendChild(target.el);
          } else if (target && typeof target === "object" && target.els) {
            target.els.forEach((t) => el.appendChild(t));
          } else if (typeof target === "string") {
            const template = document.createElement("template");
            template.innerHTML = target;
            el.appendChild(template.content);
          } else if (target instanceof Node) {
            el.appendChild(target);
          } else if (true) {
            console.warn("[kore-js] (append) Unsupported target type:", typeof target);
          }
        }
      });
      return api;
    },
    prepend(...targets) {
      forEachEl((el) => {
        for (const target of [...targets].reverse()) {
          if (target && typeof target === "object" && target.el) {
            el.insertBefore(target.el, el.firstChild);
          } else if (target && typeof target === "object" && target.els) {
            target.els.forEach((t) => el.insertBefore(t, el.firstChild));
          } else if (typeof target === "string") {
            const template = document.createElement("template");
            template.innerHTML = target;
            el.insertBefore(template.content, el.firstChild);
          } else if (target instanceof Node) {
            el.insertBefore(target, el.firstChild);
          } else if (true) {
            console.warn("[kore-js] (prepend) Unsupported target type:", typeof target);
          }
        }
      });
      return api;
    },
    before(...targets) {
      forEachEl((el) => {
        for (const target of targets) {
          const node = _resolveTarget(target);
          if (node) el.parentNode?.insertBefore(node, el);
        }
      });
      return api;
    },
    after(...targets) {
      forEachEl((el) => {
        for (const target of [...targets].reverse()) {
          const node = _resolveTarget(target);
          if (node) el.parentNode?.insertBefore(node, el.nextSibling);
        }
      });
      return api;
    },
    remove() {
      forEachEl((el) => el.remove());
      return api;
    },
    replaceWith(target) {
      forEachEl((el) => {
        const node = _resolveTarget(target);
        if (node) el.replaceWith(node);
      });
      return api;
    },
    clone(deep = true) {
      let cloned = null;
      forEachEl((el) => {
        cloned = el.cloneNode(deep);
      });
      return cloned ? $(cloned) : api;
    }
  };
  if (isSelectorArr) {
    Object.defineProperty(api, "els", {
      get() {
        return resolvedEl;
      },
      enumerable: true
    });
  } else {
    Object.defineProperty(api, "el", {
      get() {
        return resolvedEl;
      },
      enumerable: true
    });
  }
  return api;
}

// src/core/router/navigate.js
var _activePageScope = null;
async function navigate(target, options = {}) {
  let path;
  if (typeof target === "string") {
    path = target;
  } else {
    if (!(target instanceof HTMLAnchorElement))
      throw new Error(`[kor] navigate() requires an <a> element or a path string.`);
    path = new URL(target.href, location.origin).pathname;
  }
  if (path === location.pathname) return;
  if (_activePageScope) {
    _activePageScope.destroy();
    _activePageScope = null;
  }
  let fragment;
  try {
    const res = await fetch(path, { headers: { "X-Kor-Navigate": "true" } });
    fragment = await res.json();
  } catch (err) {
    console.error("[kor] navigate() fetch failed:", err);
    location.href = path;
    return;
  }
  const outlet = document.getElementById("kor-app");
  if (outlet) outlet.innerHTML = fragment.html;
  if (fragment.title) document.title = fragment.title;
  if (options.replace) history.replaceState(null, "", path);
  else history.pushState(null, "", path);
  if (fragment.scriptUrl) {
    try {
      const mod = await import(fragment.scriptUrl + "?t=" + Date.now());
      if (typeof mod.script === "function") {
        const { createScope, withScope } = await import("./scope.js");
        _activePageScope = createScope();
        withScope(_activePageScope, () => mod.script());
      }
    } catch (err) {
      console.error("[kor] navigate() failed to load page script:", err);
    }
  }
  if (true) window.__korDevtools?._onNavigate?.();
}
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[preserved="true"]');
    if (!link) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(link);
  });
  window.addEventListener("popstate", () => {
    if (_activePageScope) {
      _activePageScope.destroy();
      _activePageScope = null;
    }
  });
}

// src/core/dom/dom-ready-state.js
function ready(fn) {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn, { once: true });
}
function onDomReadyState(state, fn) {
  if (document.readyState === state) fn();
  else document.addEventListener("readystatechange", function handler() {
    if (document.readyState === state) {
      document.removeEventListener("readystatechange", handler);
      fn();
    }
  });
}

// src/core/ids.js
function safeId(name = "el", prefix = "") {
  const suffix = typeof crypto?.randomUUID === "function" ? crypto.randomUUID().replace(/-/g, "").slice(0, 8) : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const id = `${prefix}${name}-${suffix}`;
  return {
    id,
    toString() {
      return id;
    }
  };
}

// src/core/meta/meta.js
function getMetaEl(attr, value) {
  let el = document.querySelector(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  return el;
}
function _sel(keyOrFn2) {
  return typeof keyOrFn2 === "string" ? (s) => s[keyOrFn2] : keyOrFn2;
}
function _bind2(storeOrVal, keyOrFn2, setter) {
  if (isStore(storeOrVal)) {
    const sel = _sel(keyOrFn2);
    setter(sel(storeOrVal.getState()));
    const unsub = storeOrVal.subscribe((s) => setter(sel(s)));
  } else {
    setter(storeOrVal);
  }
}
var meta = {
  title(storeOrVal, keyOrFn2) {
    _bind2(storeOrVal, keyOrFn2, (v) => {
      document.title = v;
    });
  },
  description(storeOrVal, keyOrFn2) {
    const el = getMetaEl("name", "description");
    _bind2(storeOrVal, keyOrFn2, (v) => el.setAttribute("content", v));
  },
  og(property, storeOrVal, keyOrFn2) {
    const el = getMetaEl("property", property);
    _bind2(storeOrVal, keyOrFn2, (v) => el.setAttribute("content", v));
  },
  set(name, storeOrVal, keyOrFn2) {
    const el = getMetaEl("name", name);
    _bind2(storeOrVal, keyOrFn2, (v) => el.setAttribute("content", v));
  },
  canonical(url) {
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      document.head.appendChild(el);
    }
    el.setAttribute("href", url);
  }
};

// src/core/resource-network/resource.js
function resource(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body = void 0,
    params = {},
    serialize = void 0,
    lazy = false,
    onData = null,
    onLoading = null,
    onError = null,
    onStatus = null,
    onResponse = null
  } = options;
  let _data = null;
  let _loading = false;
  let _error = null;
  let _status = null;
  let abortController = null;
  const doFetch = async () => {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    _loading = true;
    _error = null;
    onLoading?.(true);
    onError?.(null);
    const fullUrl = buildUrl(url, params);
    const fetchOpts = {
      method,
      headers: { ...headers },
      signal: abortController.signal
    };
    if (body != null && method !== "GET" && method !== "HEAD") {
      if (body instanceof FormData) {
        fetchOpts.body = body;
      } else if (serialize === "json") {
        fetchOpts.headers["Content-Type"] = "application/json";
        fetchOpts.body = JSON.stringify(body);
      } else if (serialize === "params") {
        fetchOpts.headers["Content-Type"] = "application/x-www-form-urlencoded";
        fetchOpts.body = new URLSearchParams(body).toString();
      } else if (serialize === "form") {
        const fd = new FormData();
        for (const [key, value] of Object.entries(body)) {
          fd.append(key, value);
        }
        fetchOpts.body = fd;
      } else {
        fetchOpts.body = body;
      }
    }
    try {
      const res = await fetch(fullUrl, fetchOpts);
      _status = res.status;
      onStatus?.(res.status);
      onResponse?.(res);
      if (!res.ok) {
        const msg = `HTTP ${res.status}: ${res.statusText}`;
        _error = msg;
        onError?.(msg);
        return;
      }
      const contentType = res.headers.get("content-type") ?? "";
      const parsed = contentType.includes("application/json") ? await res.json() : await res.text();
      _data = parsed;
      onData?.(parsed);
    } catch (err) {
      if (err.name === "AbortError") return;
      const msg = err.message ?? String(err);
      _error = msg;
      onError?.(msg);
    } finally {
      _loading = false;
      onLoading?.(false);
    }
  };
  if (!lazy) doFetch();
  return {
    get data() {
      return _data;
    },
    get loading() {
      return _loading;
    },
    get error() {
      return _error;
    },
    get status() {
      return _status;
    },
    fetch() {
      return doFetch();
    },
    abort() {
      abortController?.abort();
    }
  };
}
function buildUrl(base, params) {
  if (!params || !Object.keys(params).length) return base;
  const qs = new URLSearchParams(params).toString();
  return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
}

// src/core/store/computed.js
function computed(sources, keyOrFn2) {
  const stores = Array.isArray(sources) ? sources : [sources];
  if (!stores.length) {
    if (true) {
      window?.__korDevtools?.reportError?.({
        type: "MISSING_ARGUMENT",
        message: `
computed() requires at least one source store
sources: ${stores.map((s) => s._devName ? s._devName : "")}`
      });
    }
    throw new Error("computed() requires at least one source store");
  }
  const picker = typeof keyOrFn2 === "string" ? (state) => state[keyOrFn2] : typeof keyOrFn2 === "function" ? keyOrFn2 : null;
  if (!picker) {
    if (true)
      window?.__korDevtools?.reportError?.({
        type: "MISSING_ARGUMENT",
        message: `
computed() requires a key shorthand or Fn function
sources: ${stores.map((s) => s._devName ? s._devName : "")}`
      });
    throw new Error("computed() requires a key shorthand or Fn function");
  }
  const _derive = () => picker(...stores.map((s) => s.getState()));
  let _value = _derive();
  let _updates = 0;
  const _listeners = /* @__PURE__ */ new Set();
  let _devName = null;
  let _devHistory = null;
  let _devSubs = null;
  let _pickSrc = null;
  let _updating = false;
  if (true) {
    const storeNames = stores.map((s) => s._devName ?? "?").join(", ");
    _pickSrc = typeof keyOrFn2 === "string" ? `'${keyOrFn2}'` : keyOrFn2?.toString().slice(0, 40) ?? "?";
    _devName = `computed(${storeNames} \u2192 ${_pickSrc})`;
    _devHistory = [];
    _devSubs = /* @__PURE__ */ new Map();
  }
  stores.forEach((source) => {
    const handler = () => {
      if (_updating) {
        if (true) {
          window?.__korDevtools?.reportError?.({
            type: "CIRCULAR_UPDATE",
            message: `
Circular update detected in computed store "${_devName}". A subscriber tried to mutate its own source. Update skipped.`
          });
        } else {
          throw new Error(
            `Circular update in computed store. A subscriber tried to mutate its own source. Update skipped.`
          );
        }
      }
      _updating = true;
      try {
        const next = _derive();
        if (Object.is(next, _value)) return;
        _value = next;
        _updates++;
        _listeners.forEach((fn) => fn(_value));
        if (_devHistory) {
          _devHistory.unshift({
            key: "(derived)",
            oldVal: null,
            newVal: next,
            time: Date.now()
          });
          if (_devHistory.length > 50) _devHistory.length = 50;
        }
        if (true) window.__korDevtools?._onStoreUpdate?.(_devName);
      } finally {
        _updating = false;
      }
    };
    if (true) handler.__korBinding = true;
    const unsub = source.subscribe(handler);
    if (true) {
      source._trackSubscriber?.(
        _devName,
        // use computed devName as the subscriber id
        typeof keyOrFn2 === "string" ? [keyOrFn2] : [],
        // keys it watches
        "computed",
        // binding type — rendered differently in devtools
        () => _value,
        // live value getter
        _pickSrc
        // source snippet shown in the pill
      );
    }
  });
  const computedStore = {
    _store_symbol: "__korejs_store",
    _devName,
    _isComputed: true,
    getState() {
      return _value;
    },
    // decide on whether to expose this just to say to user that you can mutate a computed one directly
    // or just hide it?????
    // setState() {
    //     if (__DEV__)
    //         window?.__korDevtools?.reportError?.({
    //             type: 'SETTING_READ_ONLY_STORE',
    //             message: `\ncomputed store is read-only.`,
    //         });
    //     throw new Error(`computed store is read-only.`);
    // },
    subscribe(listener) {
      _listeners.add(listener);
      return () => _listeners.delete(listener);
    }
  };
  if (true) {
    computedStore._updateCount = () => _updates;
    computedStore._subCount = () => [..._listeners].filter((fn) => !fn.__korDevtools).length;
    computedStore._manualSubCount = () => 0;
    computedStore._manualSubs = () => [];
    computedStore._trackSubscriber = (elId, keys, type, getValue, src) => {
      keys.forEach((k) => {
        if (!_devSubs.has(k)) _devSubs.set(k, /* @__PURE__ */ new Map());
        _devSubs.get(k).set(elId, { type, getValue, src });
      });
      window.__korDevtools?._onStoreUpdate?.(_devName);
    };
    computedStore._untrackSubscriber = (elId) => {
      _devSubs.forEach((map) => map.delete(elId));
      window.__korDevtools?._onStoreUpdate?.(_devName);
    };
  }
  const proxy = new Proxy(computedStore, {
    get(target, key) {
      if (key in target) return target[key];
      const val = _value;
      if (val !== null && typeof val === "object" && key in val) return val[key];
      if (typeof val !== "object") return val;
      return void 0;
    },
    set() {
      if (true)
        window?.__korDevtools?.reportError?.({
          type: "SETTING_READ_ONLY_STORE",
          message: `
computed store is read-only.`
        });
      throw new Error(`computed store is read-only.`);
    }
  });
  if (typeof window !== "undefined") {
    if (!window.__kor_stores) window.__kor_stores = /* @__PURE__ */ new Map();
    window.__kor_stores.set(_devName, {
      store: proxy,
      history: _devHistory,
      subscribers: _devSubs,
      manualSubscribers: /* @__PURE__ */ new Map(),
      isComputed: true,
      sourceNames: stores.map((s) => s._devName ?? "?")
    });
    window.__korDevtools?._onStoreUpdate?.(_devName);
  }
  return proxy;
}

// src/core/index.js
if (true) {
  let reportError2 = null;
  let _devWarn2 = null;
  const errorMod = await Promise.resolve().then(() => (init_error_overlay(), error_overlay_exports));
  reportError2 = errorMod.reportError;
  _devWarn2 = errorMod._devWarn;
  window.__korDevtools ??= {};
  window.__korDevtools.reportError = reportError2;
  window.__korDevtools._devWarn = _devWarn2;
  window.__korDevtools.stores = async () => {
    const { initStoresPanel: initStoresPanel2 } = await Promise.resolve().then(() => (init_devtools_stores_client(), devtools_stores_client_exports));
    initStoresPanel2();
  };
  window.__korDevtools.events = async () => {
    const { initEventsPanel: initEventsPanel2 } = await Promise.resolve().then(() => (init_devtools_events_client(), devtools_events_client_exports));
    initEventsPanel2();
  };
  window.__korDevtools.network = async () => {
    const { initNetworkPanel: initNetworkPanel2 } = await Promise.resolve().then(() => (init_devtools_network_client(), devtools_network_client_exports));
    initNetworkPanel2();
  };
  window.__korDevtools.page = async () => {
    const { initPagePanel: initPagePanel2 } = await Promise.resolve().then(() => (init_devtools_page_client(), devtools_page_client_exports));
    initPagePanel2();
  };
  const { mountDevtools: mountDevtools2 } = await Promise.resolve().then(() => (init_devtools_overlay(), devtools_overlay_exports));
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountDevtools2, {
      once: true
    });
  } else {
    mountDevtools2();
  }
}
export {
  $,
  KoreJsSafeHtml,
  __KORE_JS_TRUSTED_HTML,
  checkIfItReturnedByRaw,
  computed,
  createStore,
  isStore,
  meta,
  navigate,
  onDomReadyState,
  raw,
  ready,
  resource,
  safeId
};
//# sourceMappingURL=kore-js.dev.js.map
