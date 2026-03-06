// This is not being used at the moment 
// I did not delete it for reference
// We are using store.js for simplicity



import { raw } from "../korjs/korjs.js";

export function signalGraphOvelay() {
  return raw`
    <!-- ⚡ korjs Signal Graph Overlay — DEV ONLY -->

  <!-- Draggable floating button -->
  <div id="sg-tab" style="
    position:fixed; bottom:24px; left:24px;
    z-index:999998;
    background:#0f0f0f;
    border:1px solid #3b82f655;
    border-radius:8px;
    padding:8px 14px;
    cursor:grab;
    display:flex; align-items:center; gap:8px;
    font-family:monospace; font-size:12px; color:#3b82f6;
    box-shadow:0 4px 24px rgba(0,0,0,0.6);
    user-select:none;
  ">
    <span style="font-size:14px;">⚡</span>
    <span style="font-weight:600;">Signals</span>
    <span id="sg-count" style="
      background:#3b82f6; color:white;
      border-radius:10px; padding:1px 7px;
      font-size:11px; font-weight:bold;
    ">0</span>
  </div>

  <!-- Backdrop -->
  <div id="sg-backdrop" style="
    display:none; position:fixed; inset:0;
    background:rgba(0,0,0,0.7);
    z-index:999998; backdrop-filter:blur(3px);
  "></div>

  <!-- Modal -->
  <div id="sg-modal" style="
    display:none; position:fixed;
    top:50%; left:50%; transform:translate(-50%,-50%);
    z-index:999999;
    background:#0d0d0d;
    border:1px solid #3b82f633;
    border-radius:12px;
    width:min(1100px, 95vw);
    height:min(700px, 90vh);
    flex-direction:column;
    font-family:monospace; font-size:12px;
    box-shadow:0 32px 80px rgba(0,0,0,0.9);
    overflow:hidden;
  ">
    <!-- Modal header -->
    <div style="
      display:flex; align-items:center; gap:10px;
      padding:14px 20px;
      border-bottom:1px solid #3b82f620;
      flex-shrink:0;
      background:#0f0f0f;
    ">
      <span style="font-size:16px;">⚡</span>
      <span style="color:#3b82f6;font-weight:bold;font-size:14px;">Signal Graph</span>
      <span id="sg-modal-count" style="
        background:#3b82f6; color:white;
        border-radius:10px; padding:1px 8px;
        font-size:11px; font-weight:bold;
      ">0</span>

      <!-- Legend -->
      <div style="display:flex;gap:12px;margin-left:8px;font-size:11px;color:#555;">
        <span style="display:flex;align-items:center;gap:4px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:3px;
            background:#3b82f6;"></span> state
        </span>
        <span style="display:flex;align-items:center;gap:4px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:3px;
            background:#8b5cf6;"></span> computed
        </span>
        <span style="display:flex;align-items:center;gap:4px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:3px;
            background:#10b981;"></span> effect
        </span>
      </div>

      <!-- Controls -->
      <div style="margin-left:auto;display:flex;align-items:center;gap:10px;">
        <label style="font-size:11px;color:#666;
          display:flex;align-items:center;gap:5px;cursor:pointer;">
          <input type="checkbox" id="sg-live" checked style="cursor:pointer;" /> Live
        </label>
        <button id="sg-refresh" style="
          background:none; border:1px solid #3b82f644;
          color:#3b82f6; border-radius:5px;
          padding:3px 10px; cursor:pointer;
          font-size:11px; font-family:monospace;
        ">↻ Refresh</button>
        <button id="sg-close" style="
          background:none; border:none;
          color:#444; font-size:20px;
          cursor:pointer; padding:0 4px; line-height:1;
        ">✕</button>
      </div>
    </div>

    <!-- Modal body: signals grid left, effects right -->
    <div style="display:flex;flex:1;overflow:hidden;">

      <!-- Signals -->
      <div style="flex:1;overflow-y:auto;padding:16px;border-right:1px solid #3b82f610;">
        <div style="font-size:10px;color:#444;font-weight:700;
          text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">
          Signals
        </div>
        <div id="sg-grid" style="
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
          gap:10px; align-content:start;
        "></div>
      </div>

      <!-- Effects -->
      <div style="width:360px;flex-shrink:0;overflow-y:auto;padding:16px;">
        <div style="font-size:10px;color:#444;font-weight:700;
          text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">
          Effects
        </div>
        <div id="sg-effects-grid" style="display:flex;flex-direction:column;gap:8px;"></div>
      </div>

    </div>
  </div>
  <script type="module">
      import { signalGraphScript } from './korjs/korjs.js'  
      signalGraphScript()
  </script>
  <script>
    (function () {
      var tab      = document.getElementById('sg-tab')
      var modal    = document.getElementById('sg-modal')
      var backdrop = document.getElementById('sg-backdrop')

      // ── Open / close ────────────────────────────────────────────────────────
      function open() {
        modal.style.display    = 'flex'
        backdrop.style.display = 'flex'
        // Sync the floating badge count into the modal header too
        var mc = document.getElementById('sg-modal-count')
        var fc = document.getElementById('sg-count')
        if (mc && fc) mc.textContent = fc.textContent
      }
      function shut() {
        modal.style.display    = 'none'
        backdrop.style.display = 'none'
      }

      document.getElementById('sg-close').addEventListener('click', shut)
      backdrop.addEventListener('click', shut)
      document.addEventListener('keydown', function(e) { if (e.key === 'Escape') shut() })

      // ── Draggable tab ────────────────────────────────────────────────────────
      var dragging = false, startX, startY, origLeft, origBottom

      tab.addEventListener('mousedown', function(e) {
        // Don't drag if it was a quick click (handled by click event)
        dragging = false
        startX   = e.clientX
        startY   = e.clientY
        origLeft   = tab.offsetLeft
        origBottom = parseInt(tab.style.bottom) || 24

        function onMove(e) {
          var dx = e.clientX - startX
          var dy = e.clientY - startY
          if (!dragging && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
          dragging = true
          tab.style.cursor = 'grabbing'
          tab.style.left   = Math.max(0, origLeft + dx) + 'px'
          tab.style.bottom = Math.max(0, origBottom - dy) + 'px'
        }

        function onUp() {
          tab.style.cursor = 'grab'
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
          // Fire open only if it wasn't a drag
          if (!dragging) open()
          dragging = false
        }

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        e.preventDefault()
      })
    })()
  </script>
`;
}
