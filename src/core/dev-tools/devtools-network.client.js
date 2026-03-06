// kore-js/devtools-network.client.js  (CLIENT ONLY)
// Intercepts fetch() globally and logs every request/response.
// The interceptor is installed once when initNetworkPanel() is called.

export function initNetworkPanel() {
  const body = document.getElementById("kor-panel-network-body");
  const clearBtn = document.getElementById("kor-panel-network-clear");
  const countEl = document.getElementById("kor-panel-network-count");
  if (!body) return;

  // ── Request log ────────────────────────────────────────────────────────────
  const _log = []; // [{ id, method, url, status, duration, size, time, state }]
  const MAX = 200;

  // ── Intercept global fetch ─────────────────────────────────────────────────
  // Only install once even if initNetworkPanel() is called multiple times.
  if (!window.__kor_fetch_patched) {
    window.__kor_fetch_patched = true;
    const _origFetch = window.fetch.bind(window);

    window.fetch = async function (input, init = {}) {
      const url =
        typeof input === "string" ? input : (input?.url ?? String(input));
      const method = (init?.method ?? "GET").toUpperCase();
      const id = ++_fetchSeq;
      const time = Date.now();

      // Capture request body preview for mutating methods
      let reqBody = null;
      if (["POST", "PUT", "PATCH"].includes(method) && init?.body != null) {
        try {
          const b = init.body;
          if (typeof b === "string") {
            // Try to pretty-print JSON, else show raw (truncated)
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
            reqBody = reqBody.slice(0, 119) + "…";
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
        reqBody,
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

        // Read body size without consuming the real response
        clone
          .blob()
          .then((b) => {
            entry.size = b.size;
            window.__korDevtools?._onNetworkRequest?.();
          })
          .catch(() => {});

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

  // ── Push hook ──────────────────────────────────────────────────────────────
  // PERF: only render when the panel is actually visible.
  // fetch() is patched globally so requests are always logged — we just skip
  // the expensive innerHTML rebuild when nobody is looking at the panel.
  let _renderTimer = null;
  window.__korDevtools._onNetworkRequest = () => {
    const panel = document.getElementById("kor-panel-network");
    if (!panel || panel.style.display === "none") return;
    clearTimeout(_renderTimer);
    _renderTimer = setTimeout(_render, 16);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  function _methodBadge(method) {
    const colors = {
      GET: ["#0f2744", "#60a5fa"],
      POST: ["#0f2a1a", "#34d399"],
      PUT: ["#2a1f0f", "#f59e0b"],
      PATCH: ["#1a0f2a", "#a78bfa"],
      DELETE: ["#2a0f0f", "#f87171"],
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
      return `<span style="color:#475569;font-size:10px;">pending…</span>`;
    if (state === "failed")
      return `<span style="color:#f87171;font-size:10px;">failed</span>`;
    const ok = status >= 200 && status < 300;
    const rdr = status >= 300 && status < 400;
    const fg = ok ? "#34d399" : rdr ? "#f59e0b" : "#f87171";
    return `<span style="color:${fg};font-size:11px;font-weight:700;font-family:monospace;">${status}</span>`;
  }

  function _dur(ms) {
    if (ms === null) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
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
      second: "2-digit",
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function _render() {
    if (countEl) countEl.textContent = _log.length;

    if (!_log.length) {
      body.innerHTML = `
        <div style="color:#475569;padding:24px;text-align:center;font-style:italic;">
          No requests yet.
        </div>`;
      return;
    }

    body.innerHTML = _log
      .map(
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
            ${_dur(e.duration)}${e.size !== null ? " · " + _size(e.size) : ""}
          </span>
          ${_statusBadge(e.status, e.state)}
        </div>
        ${
          e.url.length > 50
            ? `
          <div style="color:#7a8fa8;font-size:9px;font-family:monospace;padding-left:116px;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${e.url}">
            ${e.url}
          </div>`
            : ""
        }
        ${
          e.reqBody != null
            ? `
          <div style="padding-left:116px;display:flex;align-items:baseline;gap:6px;">
            <span style="color:#475569;font-size:9px;flex-shrink:0;">body</span>
            <span style="color:#f59e0b;font-size:9px;font-family:monospace;
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${e.reqBody}">
              ${e.reqBody}
            </span>
          </div>`
            : ""
        }
      </div>
    `,
      )
      .join("");
  }

  _render();

  clearBtn?.addEventListener("click", () => {
    _log.length = 0;
    _render();
  });
}