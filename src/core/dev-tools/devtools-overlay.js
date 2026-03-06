// kore-js/devtools-overlay.js  (CLIENT ONLY — injected by index.js in __DEV__)

export function mountDevtools() {
  const panels = [
    { id: "stores", label: "🗄 Stores", icon: "🗄" },
    { id: "events", label: "⚡ Events", icon: "⚡" },
    { id: "network", label: "🌐 Network", icon: "🌐" },
    { id: "page", label: "📄 Page", icon: "📄" },
  ];

  const panelShells = panels
    .map((p) => {
      const hasSearch = p.id === "stores" || p.id === "events";
      const hasClear =
        p.id === "stores" || p.id === "events" || p.id === "network";
      const searchInput = hasSearch
        ? `
      <input id="kor-panel-${p.id}-search" type="text" placeholder="search…" style="
        flex:1; background:#0a0f1a; border:1px solid #1e293b;
        color:#e2e8f0; border-radius:4px; padding:3px 8px;
        font-size:11px; font-family:monospace; outline:none; min-width:0;
      "/>`
        : `<span style="flex:1"></span>`;

      return `
      <div id="kor-panel-${p.id}" style="display:none;flex-direction:column;height:100%;">
        <div style="display:flex;align-items:center;gap:8px;
          padding:8px 12px;border-bottom:1px solid #1e293b;flex-shrink:0;">
          ${
            p.id !== "page"
              ? `<span id="kor-panel-${p.id}-count" style="
            background:#1e293b;color:#64748b;border-radius:10px;
            padding:1px 7px;font-size:10px;font-family:monospace;flex-shrink:0;">0</span>`
              : ""
          }
          ${searchInput}
          ${
            hasClear
              ? `<button id="kor-panel-${p.id}-clear" style="
            background:none;border:1px solid #334155;color:#64748b;border-radius:4px;
            padding:2px 8px;font-size:11px;font-family:monospace;cursor:pointer;flex-shrink:0;
          ">clear</button>`
              : ""
          }
        </div>
        <div id="kor-panel-${p.id}-body" style="
          flex:1;overflow-y:auto;font-family:monospace;font-size:12px;"></div>
      </div>`;
    })
    .join("");

  const tabButtons = panels
    .map(
      (p) => `
    <button data-tab="${p.id}" style="
      background:none;border:1px solid transparent;color:#475569;
      font-family:monospace;font-size:11px;padding:4px 10px;
      border-radius:5px;cursor:pointer;transition:all 0.15s;">
      ${p.icon} ${p.id}
    </button>`,
    )
    .join("");

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
        ${panels
          .map(
            (p) => `
          <button data-panel="${p.id}" style="
            display:flex;align-items:center;gap:6px;background:none;border:none;
            color:#94a3b8;font-family:monospace;font-size:12px;
            padding:7px 12px;cursor:pointer;width:100%;text-align:left;
            border-radius:6px;transition:background 0.15s,color 0.15s;white-space:nowrap;"
            onmouseover="this.style.background='#1e293b';this.style.color='#e2e8f0'"
            onmouseout="this.style.background='none';this.style.color='#94a3b8'">
            ${p.icon} ${p.label}
          </button>`,
          )
          .join("")}
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
          font-size:18px;cursor:pointer;line-height:1;padding:0 2px;">✕</button>
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
  const _initialised = new Set();

  // ── Draggable launcher ─────────────────────────────────────────────────────
  const POS_KEY = "__kor_dt_pos__";
  const WIDTH_KEY = "__kor_dt_width__";

  function _savePos(right, bottom) {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ right, bottom }));
    } catch {}
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
    } catch {}
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

  let _dragging = false,
    _dragStartX = 0,
    _dragStartY = 0,
    _origRight = 0,
    _origBottom = 0;

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
          parseInt(launcher.style.bottom) || 20,
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

  // ── Resizable drawer ───────────────────────────────────────────────────────
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
        Math.min(window.innerWidth * 0.9, startWidth + (startX - ev.clientX)),
      );
      drawer.style.width = newWidth + "px";
      // if (drawer.style.display !== 'none') {
      //   document.body.style.marginRight = newWidth + 'px'
      // }
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

  // ── Menu toggle ────────────────────────────────────────────────────────────
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
    // document.body.style.marginRight = drawer.offsetWidth + 'px'
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

    // Always re-render the stores panel on open so computed nodes and any
    // stores registered after first init are never missing from the view.
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
