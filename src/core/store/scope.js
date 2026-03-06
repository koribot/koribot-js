// THIS IS INTENDED FOR SPA FEATURE


// ── Global active scope ───────────────────────────────────────────────────────
let _activeScope = null

/** @returns {Scope|null} The currently active scope, if any. */
export function getActiveScope() { return _activeScope }

/**
 * Run fn inside a scope — any $().on(), $().text() etc. called during fn
 * will auto-register their cleanup with the scope.
 *
 * Scopes nest correctly: the previous scope is restored after fn returns.
 *
 * @param {Scope}    scope
 * @param {Function} fn
 */
export function withScope(scope, fn) {
  const prev = _activeScope
  _activeScope = scope
  try {
    fn()
  } finally {
    _activeScope = prev
  }
}

/**
 * Register a cleanup function with the currently active scope (if any).
 * Called internally by dom.js and meta.js — not usually called directly.
 *
 * @param {Function} fn
 */
export function registerCleanup(fn) {
  if (_activeScope && typeof fn === 'function') {
    _activeScope.add(fn)
  }
}

/**
 * Create a new cleanup scope.
 *
 * @returns {{
 *   on(target: EventTarget, event: string, handler: Function, options?: any): void,
 *   add(fn: Function): void,
 *   run(fn: Function): void,
 *   destroy(): void,
 *   readonly destroyed: boolean
 * }}
 */
export function createScope() {
  const cleanups = []
  let _destroyed = false

  const scope = {
    get destroyed() { return _destroyed },

    /**
     * Add a DOM event listener and register its removal.
     * @param {EventTarget} target
     * @param {string}      event
     * @param {Function}    handler
     * @param {any}         [options]
     */
    on(target, event, handler, options) {
      if (_destroyed) { console.warn('[kor] scope.on() on destroyed scope'); return }
      target.addEventListener(event, handler, options)
      cleanups.push(() => target.removeEventListener(event, handler, options))
    },

    /**
     * Register an arbitrary cleanup function.
     * Accepts store unsub functions directly: scope.add(store.subscribe(...))
     * @param {Function} fn
     */
    add(fn) {
      if (typeof fn !== 'function') return
      if (_destroyed) { fn(); return }
      cleanups.push(fn)
    },

    /**
     * Run a function inside this scope — equivalent to withScope(this, fn).
     * All $().on(), $().text() etc. inside fn auto-register with this scope.
     * @param {Function} fn
     */
    run(fn) {
      withScope(scope, fn)
    },

    /**
     * Destroy this scope — removes all listeners, cancels all subscriptions.
     * Safe to call multiple times.
     */
    destroy() {
      if (_destroyed) return
      _destroyed = true
      for (let i = cleanups.length - 1; i >= 0; i--) {
        try { cleanups[i]() } catch (e) { console.warn('[kor] scope cleanup error:', e) }
      }
      cleanups.length = 0
    }
  }

  return scope
}