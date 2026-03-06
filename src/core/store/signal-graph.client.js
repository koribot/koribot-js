// This is not being used at the moment 
// I did not delete it for reference
// We are using store.js for simplicity


function _formatValue(v) {
  if (v === undefined) return '<span style="color:#555">undefined</span>'
  if (v === null)      return '<span style="color:#555">null</span>'
  if (typeof v === 'boolean') return `<span style="color:#f59e0b">${v}</span>`
  if (typeof v === 'number')  return `<span style="color:#34d399">${v}</span>`
  if (typeof v === 'string') {
    const s = v.length > 28 ? v.slice(0, 28) + '…' : v
    return `<span style="color:#f87171">"${s}"</span>`
  }
  if (Array.isArray(v))       return `<span style="color:#818cf8">Array(${v.length})</span>`
  if (typeof v === 'object') {
    const keys = Object.keys(v)
    const preview = keys.slice(0, 3).join(', ') + (keys.length > 3 ? '…' : '')
    return `<span style="color:#818cf8">{${preview}}</span>`
  }
  return String(v)
}

function _timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

// Which effect IDs are subscribed to this signal?
function _subscriberIds(signal) {
  if (!signal._subscribers) return []
  return [...signal._subscribers]
    .map(fn => fn._id)
    .filter(Boolean)
}

// Which signal IDs does this effect read?
function _depIds(run) {
  return [...run._deps]
    .map(s => s._id)
    .filter(Boolean)
}

// ── Signal card ───────────────────────────────────────────────────────────────

function _renderSignalCard(signal) {
  const type       = signal._type || 'state'
  const value      = signal._peek ? signal._peek() : undefined
  const subs       = signal._subCount ? signal._subCount() : 0
  const updates    = signal._updateCount ? signal._updateCount() : 0
  const subIds     = _subscriberIds(signal)
  const age        = signal._createdAt ? _timeAgo(signal._createdAt) : ''

  const isComputed = type === 'computed'
  const color      = isComputed ? '#8b5cf6' : '#3b82f6'
  const dimColor   = isComputed ? '#8b5cf622' : '#3b82f622'

  return `
    <div style="
      background:#111;
      border:1px solid #ffffff0f;
      border-top:2px solid ${color};
      border-radius:8px;
      padding:12px;
      display:flex;
      flex-direction:column;
      gap:8px;
    ">
      <!-- Type badge + name -->
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="
          background:${dimColor};color:${color};
          border-radius:4px;padding:1px 7px;
          font-size:10px;font-weight:700;letter-spacing:0.05em;
          text-transform:uppercase;flex-shrink:0;
        ">${type}</span>
        <span style="
          color:#e2e8f0;font-weight:600;font-size:13px;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;
        " title="${signal._id}">${signal._id}</span>
        ${isComputed ? `<span style="font-size:10px;color:#555;flex-shrink:0;">readonly</span>` : ''}
      </div>

      <!-- Current value -->
      <div style="
        background:#0a0a0a;border-radius:5px;
        padding:7px 10px;font-size:13px;
        border:1px solid #ffffff08;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      ">
        ${_formatValue(value)}
      </div>

      <!-- Stats row -->
      <div style="display:flex;gap:10px;font-size:11px;color:#555;">
        <span title="Subscribers">
          <span style="color:#3b82f6;">●</span> ${subs} sub${subs !== 1 ? 's' : ''}
        </span>
        <span title="Times value changed">
          <span style="color:#10b981;">↺</span> ${updates} update${updates !== 1 ? 's' : ''}
        </span>
        <span title="Created" style="margin-left:auto;">${age}</span>
      </div>

      <!-- Subscribed effects -->
      ${subIds.length ? `
        <div style="font-size:10px;color:#555;border-top:1px solid #ffffff08;padding-top:6px;">
          <span style="color:#444;text-transform:uppercase;letter-spacing:0.05em;font-size:9px;">
            read by
          </span><br/>
          <div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:3px;">
            ${subIds.map(id => `
              <span style="background:#10b98115;color:#10b981;
                border-radius:3px;padding:1px 5px;font-size:10px;">${id}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `
}

// ── Effect row ────────────────────────────────────────────────────────────────

function _renderEffectRow(run) {
  const deps  = _depIds(run)
  const runs  = run._runCount ? run._runCount() : 0
  const age   = run._createdAt ? _timeAgo(run._createdAt) : ''

  return `
    <div style="
      background:#111;
      border:1px solid #ffffff0f;
      border-left:3px solid #10b981;
      border-radius:6px;
      padding:10px 12px;
      display:flex;
      flex-direction:column;
      gap:6px;
    ">
      <!-- Name + stats -->
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="
          background:#10b98115;color:#10b981;
          border-radius:4px;padding:1px 7px;
          font-size:10px;font-weight:700;letter-spacing:0.05em;
          text-transform:uppercase;flex-shrink:0;
        ">effect</span>
        <span style="color:#e2e8f0;font-weight:600;font-size:13px;flex:1;">${run._id}</span>
        <span style="font-size:11px;color:#555;">↺ ${runs} run${runs !== 1 ? 's' : ''}</span>
        <span style="font-size:11px;color:#444;">${age}</span>
      </div>

      <!-- Deps -->
      <div style="font-size:11px;color:#555;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="color:#444;text-transform:uppercase;letter-spacing:0.05em;font-size:9px;">reads</span>
        ${deps.length
          ? deps.map(id => `
              <span style="background:#3b82f615;color:#3b82f6;
                border-radius:3px;padding:1px 6px;font-size:10px;">${id}</span>
            `).join('')
          : '<span style="color:#333;font-size:10px;font-style:italic;">nothing tracked</span>'
        }
      </div>
    </div>
  `
}

// ── Render ────────────────────────────────────────────────────────────────────

function _render() {
  const graph = window.__korjs_graph
  if (!graph) return

  const signals = [...graph.signals.values()]
  const effects = [...graph.effects.values()]

  // Count badge
  const countEl = document.getElementById('sg-count')
  if (countEl) countEl.textContent = signals.length + effects.length

  // Signal grid
  const grid = document.getElementById('sg-grid')
  if (grid) {
    grid.innerHTML = signals.length
      ? signals.map(_renderSignalCard).join('')
      : '<div style="color:#444;font-size:12px;padding:20px 0;text-align:center;">No signals registered on this page.</div>'
  }

  // Effects list
  const effGrid = document.getElementById('sg-effects-grid')
  if (effGrid) {
    effGrid.innerHTML = effects.length
      ? effects.map(_renderEffectRow).join('')
      : '<div style="color:#444;font-size:12px;font-style:italic;">No effects registered.</div>'
  }
}

// ── Bind ──────────────────────────────────────────────────────────────────────

export function bindSignalGraph() {
  let _interval = null

  document.getElementById('sg-refresh')?.addEventListener('click', _render)

  const liveToggle = document.getElementById('sg-live')

  function _startLive() {
    if (_interval) return
    _interval = setInterval(_render, 300)
  }

  function _stopLive() {
    clearInterval(_interval)
    _interval = null
  }

  liveToggle?.addEventListener('change', () => {
    liveToggle.checked ? _startLive() : _stopLive()
  })

  _render()
  _startLive()
}