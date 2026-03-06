"use strict";
export function createStore(initial, _name) {
  let _state = { ...initial };
  const _listeners = new Set();

  let _updates = 0;
  const _keySubscribers = __DEV__ ? new Map() : null;
  const _manualSubscribers = __DEV__ ? new Map() : null;
  let _manualSubId = __DEV__ ? 0 : 0;
  const _history = __DEV__ ? [] : null;
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
      if (__DEV__) {
        _updates++;
        for (const key of Object.keys(patch)) {
          if (!Object.is(oldState[key], _state[key])) {
            _history.unshift({
              key,
              oldVal: oldState[key],
              newVal: _state[key],
              time: Date.now(),
            });
            if (_history.length > HISTORY_MAX) _history.length = HISTORY_MAX;
          }
        }
      }
      _listeners.forEach((fn) => fn(_state));
    },

    subscribe(listener) {
      _listeners.add(listener);

      if (__DEV__ && !listener.__korDevtools && !listener.__korBinding) {
        const src = listener?.toString() ?? "";
        const label = src.length > 60 ? src.slice(0, 59) + "…" : src;
        const id = `manual_${_manualSubId++}`;

        // Extract which state keys this listener touches (same regex as dom.js _devPickedKeys)
        const paramMatch = src.match(
          /^(?:(?:function\s*\w*\s*\((\w+))|(\w+)\s*=>|\((\w+)\)\s*=>)/,
        );
        const param =
          paramMatch?.[1] ?? paramMatch?.[2] ?? paramMatch?.[3] ?? "s";
        const keys = [
          ...new Set(
            [...src.matchAll(new RegExp(`\\b${param}\\.(\\w+)\\b`, "g"))].map(
              (m) => m[1],
            ),
          ),
        ];

        _manualSubscribers.set(listener, {
          id,
          label,
          registeredAt: Date.now(),
          keys,
        });
        if (name) window.__korDevtools?._onStoreUpdate?.(name);
      }

      return () => {
        _listeners.delete(listener);
        if (__DEV__ && _manualSubscribers.has(listener)) {
          _manualSubscribers.delete(listener);
          if (name) window.__korDevtools?._onStoreUpdate?.(name);
        }
      };
    },
  };

  if (__DEV__) {
    store._updateCount = () => _updates;
    store._subCount = () =>
      [..._listeners].filter((fn) => !fn.__korDevtools).length;
    store._manualSubCount = () => _manualSubscribers.size;
    store._manualSubs = () => [..._manualSubscribers.values()];

    if (typeof window !== "undefined") {
      if (!window.__kor_stores) window.__kor_stores = new Map();
      name = _name || `store_${window.__kor_stores.size + 1}`;
      window.__kor_stores.set(name, {
        store,
        history: _history,
        subscribers: _keySubscribers,
        manualSubscribers: _manualSubscribers,
        name,
      });
      store._devName = name;

      const _devNotify = () => {
        window.__korDevtools?._onStoreUpdate?.(name);
      };
      _devNotify.__korDevtools = true;
      store.subscribe(_devNotify);
    }

    store._trackSubscriber = (
      elId,
      keys,
      type = "?",
      getValue = null,
      src = null,
    ) => {
      for (const key of keys) {
        if (!_keySubscribers.has(key)) _keySubscribers.set(key, new Map());
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
    },
  });
}

export function isStore(v) {
  if (v?._store_symbol === "__korejs_store") return true;
  return (
    v != null &&
    typeof v === "object" &&
    typeof v.getState === "function" &&
    typeof v.setState === "function" &&
    typeof v.subscribe === "function"
  );
}

// // kore-js/store.js
// "use strict"
// export function createStore(initial, _name) {
//   let _state = { ...initial };
//   const _listeners = new Set();

//   // ── DEV metadata ──────────────────────────────────────────────────────────
//   let _updates = 0;
//   // subscribers map: key → Set of element IDs watching that key
//   const _keySubscribers = __DEV__ ? new Map() : null;
//   // change history: [{ key, oldVal, newVal, time }]
//   const _history = __DEV__ ? [] : null;
//   const HISTORY_MAX = 50;

//   const store = {
//     _store_symbol: '__korejs_store',
//     getState() {
//       return _state;
//     },

//     setState(updater) {
//       const oldState = _state;
//       const patch = typeof updater === "function" ? updater(_state) : updater;
//       _state = { ..._state, ...patch };
//       if (__DEV__) {
//         _updates++;
//         for (const key of Object.keys(patch)) {
//           if (!Object.is(oldState[key], _state[key])) {
//             _history.unshift({
//               key,
//               oldVal: oldState[key],
//               newVal: _state[key],
//               time: Date.now(),
//             });
//             if (_history.length > HISTORY_MAX) _history.length = HISTORY_MAX;
//           }
//         }
//       }
//       _listeners.forEach((fn) => fn(_state));
//     },

//     subscribe(listener) {
//       _listeners.add(listener);
//       return () => _listeners.delete(listener);
//     },
//   };

//   if (__DEV__) {
//     // _subCount excludes devtools-internal listeners so the UI shows real subs only
//     store._updateCount = () => _updates;
//     store._subCount    = () => [..._listeners].filter(fn => !fn.__korDevtools).length;

//     if (typeof window !== "undefined") {
//       if (!window.__kor_stores) window.__kor_stores = new Map();
//       const name = _name || `store_${window.__kor_stores.size + 1}`;
//       window.__kor_stores.set(name, {
//         store,
//         history: _history,
//         subscribers: _keySubscribers,
//         name,
//       });
//       store._devName = name;

//       // ── Push-notify devtools on every setState ─────────────────────────────
//       // Tag the listener so _subCount (above) and _trackSubscriber (below)
//       // both know to ignore it — keeps the devtools UI numbers honest.
//       const _devNotify = () => {
//         window.__korDevtools?._onStoreUpdate?.(name);
//       };
//       _devNotify.__korDevtools = true;
//       store.subscribe(_devNotify);
//     }

//     // Allow dom.js to register which element is watching which store keys,
//     // along with the binding type (.text, .html, .val, etc.).
//     // _keySubscribers: Map<key, Map<elId, type>>
//     // _keySubscribers: Map<key, Map<elId, { type, getValue, src }>>
//     store._trackSubscriber = (elId, keys, type = '?', getValue = null, src = null) => {
//       for (const key of keys) {
//         if (!_keySubscribers.has(key)) _keySubscribers.set(key, new Map());
//         _keySubscribers.get(key).set(elId, { type, getValue, src });
//       }
//     };
//     store._untrackSubscriber = (elId) => {
//       _keySubscribers.forEach((map) => map.delete(elId));
//     };
//   }

//   return new Proxy(store, {
//     get(target, key) {
//       if (key in target) return target[key];
//       return _state[key];
//     },
//     set(target, key, value) {
//       try {
//         store.setState({ [key]: value });
//         return true;
//       } catch (err) {
//         console.error("Failed to update state:", err);
//         return false;
//       }
//     },
//   });
// }

// export function isStore(v) {
//   if (v?._store_symbol === '__korejs_store') return true
//   return (
//     v != null &&
//     typeof v === "object" &&
//     typeof v.getState === "function" &&
//     typeof v.setState === "function" &&
//     typeof v.subscribe === "function"
//   );
// }
