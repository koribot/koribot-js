let overlayEl = null;

const ERROR_TYPES = {
    ELEMENT_NOT_FOUND: (message) => `[kore-js] Element not found: ${message}`,
    ELEMENTS_NOT_FOUND: (message) => `[kore-js] Elements not found: ${message}`,
    INVALID_SELECTOR: (message) => `[kore-js] Invalid selector: ${message}`,
    STORE_KEY_MISSING: (message) => `[kore-js] Store key does not exist: ${message}`,
    UNKNOWN: (message) => `[kore-js] Unknown runtime error: ${message || ''}`,
    TYPE_MISMATCH: (message) => `[kore-js] Type mismatch: ${message}`,
};

function createOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.id = '__kor_error_overlay__';

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
          ✕
        </button>
      </div>

      <pre id="__kor_message__"
        style="margin-top:16px;font-size:15px;white-space:pre-wrap;"></pre>

      <pre id="__kor_stack__"
        style="margin-top:16px;font-size:13px;opacity:0.8;white-space:pre-wrap;"></pre>
    </div>
  `;

    document.body.appendChild(overlayEl);

    overlayEl.querySelector('#__kor_close__').addEventListener('click', closeErrorOverlay);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeErrorOverlay();
    });
}

export function reportError({ type = '', message = '', cause = null, fatal = true } = {}) {
    const resolver = ERROR_TYPES[type];
    const finalMessage = resolver ? resolver(message) : `[kore-js] ${type}: ${message}`;

    const error = new Error(finalMessage);

    if (cause instanceof Error) {
        error.cause = cause;
    }

    // Show overlay
    if (!overlayEl) createOverlay();

    overlayEl.querySelector('#__kor_message__').textContent = error.message;
    overlayEl.querySelector('#__kor_stack__').textContent = error.stack || '';

    if (fatal) {
        throw error;
    }

    return error;
}

export function _devWarn(message, method) {
    const label = method ? `kor/${method}` : 'kor';
    console.warn(
        '%c ' + label + ' %c %s',
        'background:#f59e0b;color:#000;font-weight:bold;padding:2px 8px;border-radius:4px;',
        'color:inherit;',
        message,
    );
}

export function closeErrorOverlay() {
    if (overlayEl) {
        overlayEl.remove();
        overlayEl = null;
    }
}
