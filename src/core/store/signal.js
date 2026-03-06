// This is not being used at the moment 
// I did not delete it for reference
// We are using store.js for simplicity

// kore-js/signal.js
// Reactive core — state(), effect(), computed()
//
// Supports property-level dependency tracking for object/array signals via
// recursive Proxy. Reading signal.value.user.address.city inside an effect
// only re-runs that effect when city changes — not when unrelated properties change.

import { reportError } from "./devtools.js";

let currentEffect = null;

// ── DEV Signal Graph Registry ─────────────────────────────────────────────────
//
// In dev only, every signal and effect registers itself here so the in-page
// visualizer (signal-graph.client.js) can read the live graph without ever
// touching .value (which would corrupt dep tracking).
//
// Exposed on window.__korjs_graph so the visualizer can reach it.
// esbuild dead-code eliminates the entire block in production (if (__DEV__) → if (false)).

let _signalId = 0;
let _effectId = 0;

if (__DEV__) {
  window.__korjs_graph = {
    signals: new Map(), // id → signal
    effects: new Map(), // id → effect run fn
  };
}

// ── Errors ────────────────────────────────────────────────────────────────────
//
// All error messages live here. Each key is a type; the value is a function
// that takes context and returns an Error.
// Call _throw('type', context) anywhere in this file to report + throw.

const _errors = {
  asyncEffect: (fn) =>
    new Error(
      "[signal] effect() does not support async functions.\n\n" +
        String(fn) +
        "\n\n" +
        "Signal reads after the first await are not tracked.\n\n" +
        "Instead, read signals synchronously then call async inside:\n\n" +
        "  effect(() => {\n" +
        "    const id = mySignal.value   // tracked ✅\n" +
        "    async function load() {\n" +
        "      const data = await fetch(`/api/${id}`)\n" +
        "      result.set(data)\n" +
        "    }\n" +
        "    load()\n" +
        "  })\n\n" +
        "Or use resource() for data fetching.",
    ),

  mutationInComputed: (fn) =>
    new Error(
      "[signal] state.set() called inside computed().\n\n" +
        "computed() must be a pure derivation — no side effects or mutations.\n" +
        "Move the .set() call into an effect() instead.\n\n" +
        "Offending computed:\n\n" +
        String(fn),
    ),

  computedReadonly: (method) =>
    new Error(
      `[signal] computed() is read-only — .${method} is not allowed.\n\n` +
        "computed() derives its value automatically from its dependencies.\n" +
        "If you need a writable signal, use state() instead.",
    ),

  signalCoerced: () =>
    new Error(
      "[signal] A signal was coerced to a string via a template literal or concatenation.\n\n" +
        "This means you wrote something like:\n\n" +
        "  `Score: ${count}`          ❌ — resolves once, not reactive\n" +
        "  'Hello ' + name            ❌ — resolves once, not reactive\n\n" +
        "Pass the signal directly instead:\n\n" +
        "  $(el).text(count)          ✅ — reactive\n" +
        "  $(el).text(name)           ✅ — reactive\n\n" +
        "If you need to combine signals, use computed():\n\n" +
        "  const label = computed(() => `Score: ${count.value}`)\n" +
        "  $(el).text(label)          ✅ — reactive",
    ),
};

function _throw(type, context) {
  if (__DEV__) {
    const err = _errors[type](context);
    reportError(err);
    throw err;
  }
}

// ── Proxy wrapping ────────────────────────────────────────────────────────────

const _proxyCache = new WeakMap();

function _wrap(target) {
  if (target === null || typeof target !== "object") return target;
  if (target.__isProxy) return target;
  if (_proxyCache.has(target)) return _proxyCache.get(target);

  const deps = new Map();

  const proxy = new Proxy(target, {
    get(obj, key) {
      if (key === "__isProxy") return true;

      const value = obj[key];

      if (currentEffect && typeof key !== "symbol") {
        if (!deps.has(key)) deps.set(key, new Set());
        const bucket = deps.get(key);
        if (!bucket.has(currentEffect)) {
          bucket.add(currentEffect);
          currentEffect._deps.add({
            _unsubscribe(fn) {
              bucket.delete(fn);
            },
          });
        }
      }

      if (value !== null && typeof value === "object" && !value.__isProxy) {
        return _wrap(value);
      }

      return value;
    },

    set(obj, key, newValue) {
      const old = obj[key];
      if (Object.is(old, newValue)) return true;
      obj[key] = newValue;

      const bucket = deps.get(key);
      if (bucket) {
        [...bucket].filter((fn) => !fn._running).forEach((fn) => fn());
      }

      return true;
    },
  });

  _proxyCache.set(target, proxy);
  return proxy;
}

// ── state() ───────────────────────────────────────────────────────────────────

export function state(initial, _name) {
  let _raw = initial;
  let _value = _isObject(initial) ? _wrap(initial) : initial;

  const _subscribers = new Set();

  // In dev: assign a stable id for the graph visualizer.
  // Optional _name param lets callers give signals meaningful names:
  //   state(0, 'count')  →  shows as "count" in the graph panel
  const _id = __DEV__ ? (_name || `state_${_signalId++}`) : undefined;

  // ── DEV only closure vars ──────────────────────────────────────────────────
  // Tracked in closures so the visualizer reads them without touching .value.
  let _updates = 0;                           // how many times .set() changed the value
  const _created = __DEV__ ? Date.now() : 0; // creation timestamp

  const signal = {
    _isSignal: true,

    get value() {
      if (currentEffect) {
        _subscribers.add(currentEffect);
        currentEffect._deps.add(signal);
      }
      return _value;
    },

    set value(newValue) {
      this.set(newValue);
      if (__DEV__) {
        console.warn(
          "%c[STATE Warning]%c Directly assigning state.value!",
          "color: orange; font-weight: bold; font-size: 14px;",
          "color: black; font-size: 12px;",
        );
        console.warn(
          "Message: This is just a warning. Ideally use .set() or .update(). It will work anyway. Warning will be removed in production.",
        );
      }
    },

    set(newValue) {
      if (Object.is(newValue, _raw)) return;
      _raw = newValue;
      _value = _isObject(newValue) ? _wrap(newValue) : newValue;
      if (__DEV__) _updates++;               // track how many times value actually changed
      [..._subscribers].filter((fn) => !fn._running).forEach((fn) => fn());
    },

    update(fn) {
      this.set(fn(_raw));
    },

    _unsubscribe(effectFn) {
      _subscribers.delete(effectFn);
    },

    _subscribers,

    // ── toString / valueOf ────────────────────────────────────────────────────
    // Catches accidental coercion: `Score: ${count}` or 'Hi ' + name
    // In dev: throws a clear error pointing to computed() as the fix.
    // In prod: silently returns the string value so the app doesn't crash.

    toString() {
      if (__DEV__) _throw("signalCoerced");
      return String(_value);
    },

    valueOf() {
      if (__DEV__) _throw("signalCoerced");
      return _value;
    },
  };

  // ── DEV only: tag the signal and register it in the graph ──────────────────
  // All helpers close over raw vars — they NEVER call signal.value,
  // so the visualizer can never accidentally register itself as a subscriber.
  if (__DEV__) {
    signal._id          = _id;
    signal._type        = "state";
    signal._peek        = () => _raw;               // read value without dep tracking
    signal._subCount    = () => _subscribers.size;  // live subscriber count
    signal._updateCount = () => _updates;           // how many times value changed
    signal._createdAt   = _created;                 // ms timestamp for age display
    window.__korjs_graph.signals.set(_id, signal);
  }

  return signal;
}

// ── effect() ──────────────────────────────────────────────────────────────────

export function effect(fn, _name) {
  // ── DEV only: track run count via closure ─────────────────────────────────
  let _runs = 0;

  const run = () => {
    if (run._running) return;
    run._running = true;

    run._deps.forEach((dep) => dep._unsubscribe(run));
    run._deps.clear();

    const prev = currentEffect;
    currentEffect = run;
    try {
      const result = fn();
      if (__DEV__) {
        if (result instanceof Promise) _throw("asyncEffect", fn);
        _runs++;                               // count each successful execution
      }
    } finally {
      currentEffect = prev;
      run._running = false;
    }
  };

  run._deps    = new Set();
  run._running = false;
  run();

  // ── DEV only: tag and register the effect run fn ───────────────────────────
  if (__DEV__) {
    run._id        = _name || `effect_${_effectId++}`;
    run._runCount  = () => _runs;              // live run count for the visualizer
    run._createdAt = Date.now();
    window.__korjs_graph.effects.set(run._id, run);
  }

  return () => {
    run._deps.forEach((dep) => dep._unsubscribe(run));
    run._deps.clear();
    // Deregister from graph on cleanup so disposed effects don't linger
    if (__DEV__) window.__korjs_graph.effects.delete(run._id);
  };
}

// ── computed() ────────────────────────────────────────────────────────────────

export function computed(fn, _name) {
  // computed is built on top of state + effect internally.
  // We give the inner state the same _name so it shows up correctly
  // in the graph as "computed" rather than a nameless state_N.
  const _id = __DEV__ ? (_name || `computed_${_signalId++}`) : undefined;
  const result = state(undefined, _id);

  effect(() => result.set(fn()));

  const computedSignal = {
    _isSignal: true,
    _isComputed: true,

    get value() {
      return result.value;
    },

    set value(_) {
      if (__DEV__) {
        _throw("computedReadonly", "value =");
        debugger;
      }
    },
    set(_) {
      if (__DEV__) {
        _throw("computedReadonly", "set()");
        debugger;
      }
    },
    update(_) {
      if (__DEV__) {
        _throw("computedReadonly", "update()");
        debugger;
      }
    },

    // ── toString / valueOf ────────────────────────────────────────────────────
    toString() {
      if (__DEV__) _throw("signalCoerced");
      return String(result.value);
    },

    _subscribers: result._subscribers,

    valueOf() {
      if (__DEV__) _throw("signalCoerced");
      return result.value;
    },
  };

  // ── DEV only: override the inner state's graph entry with the computed one ─
  // state() already registered result under _id as type "state".
  // We overwrite it here with the computed wrapper so the visualizer
  // shows the correct type and all helpers point at the right internals.
  if (__DEV__) {
    computedSignal._id          = _id;
    computedSignal._type        = "computed";
    computedSignal._peek        = result._peek;         // reads _raw without getter
    computedSignal._subCount    = result._subCount;
    computedSignal._updateCount = result._updateCount;  // how many times derived value changed
    computedSignal._createdAt   = result._createdAt;
    computedSignal._subscribers = result._subscribers;
    window.__korjs_graph.signals.set(_id, computedSignal); // overwrite state entry
  }

  return computedSignal;
}


export function isSignal(v) {
  return v != null && v._isSignal === true;
}


function _isObject(v) {
  return v !== null && typeof v === "object";
}