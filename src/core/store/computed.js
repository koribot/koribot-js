// TODO: uncomment when client-side navigation (SPA) feature is implemented.
// registerCleanup wires dom.js listeners into the scope system so they are
// automatically removed when a page scope is destroyed during navigation.
// import { registerCleanup } from '../store/scope.js';

export function computed(sources, keyOrFn) {
    // ── Normalise inputs ───────────────────────────────────────────────────────
    const stores = Array.isArray(sources) ? sources : [sources];

    if (!stores.length) {
        if (__DEV__) {
            window?.__korDevtools?.reportError?.({
                type: 'MISSING_ARGUMENT',
                message: `\ncomputed() requires at least one source store\nsources: ${stores.map((s) => (s._devName ? s._devName : ''))}`,
            });
        }
        throw new Error('computed() requires at least one source store');
    }

    // String key → state => state[key]  (works for single and array-of-one)
    // Function   → called with one state arg per store
    const picker =
        typeof keyOrFn === 'string'
            ? (state) => state[keyOrFn]
            : typeof keyOrFn === 'function'
              ? keyOrFn
              : null;

    if (!picker) {
        if (__DEV__)
            window?.__korDevtools?.reportError?.({
                type: 'MISSING_ARGUMENT',
                message: `\ncomputed() requires a key shorthand or Fn function\nsources: ${stores.map((s) => (s._devName ? s._devName : ''))}`,
            });
        throw new Error('computed() requires a key shorthand or Fn function');
    }

    // ── Internal reactive state ────────────────────────────────────────────────
    const _derive = () => picker(...stores.map((s) => s.getState()));
    let _value = _derive();
    let _updates = 0;
    const _listeners = new Set();

    // ── DEV scaffolding ────────────────────────────────────────────────────────
    let _devName = null;
    let _devHistory = null;
    let _devSubs = null;
    let _pickSrc = null;
    let _updating = false; // flag to prevent infinite recursion from circular setState

    if (__DEV__) {
        const storeNames = stores.map((s) => s._devName ?? '?').join(', ');
        _pickSrc =
            typeof keyOrFn === 'string'
                ? `'${keyOrFn}'`
                : (keyOrFn?.toString().slice(0, 40) ?? '?'); // just the first 40 chars
        _devName = `computed(${storeNames} → ${_pickSrc})`;
        _devHistory = [];
        _devSubs = new Map();
    }

    // ── Subscribe to all source stores ────────────────────────────────────────
    stores.forEach((source) => {
        const handler = () => {
            // If _updating is true it means the keyOrFn called setState on a source
            // store during derivation, which re-triggered this handler.
            // In __DEV__ throw so the developer can't miss it.
            // In prod warn and bail — no infinite loop, no white screen.
            if (_updating) {
                if (__DEV__) {
                    window?.__korDevtools?.reportError?.({
                        type: 'CIRCULAR_UPDATE',
                        message:
                            `\nCircular update detected in computed store "${_devName}". ` +
                            `A subscriber tried to mutate its own source. Update skipped.`,
                    });
                } else {
                    throw new Error(
                        `Circular update in computed store. A subscriber tried to mutate its own source. Update skipped.`,
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

                if (__DEV__ && _devHistory) {
                    _devHistory.unshift({
                        key: '(derived)',
                        oldVal: null,
                        newVal: next,
                        time: Date.now(),
                    });
                    if (_devHistory.length > 50) _devHistory.length = 50;
                }

                if (__DEV__) window.__korDevtools?._onStoreUpdate?.(_devName);
            } finally {
                _updating = false; // always reset even if listeners throw
            }
        };

        // Tag so store.js __DEV__ subscribe() doesn't count this as a manual sub
        if (__DEV__) handler.__korBinding = true;

        const unsub = source.subscribe(handler);
        // UNCOMMENT IF WE HAVE CLIENT-SIDE NAVIGATION FEATURE
        //registerCleanup(unsub);

        // ── Register computed as a named subscriber on the source store ──────────
        // This makes the computed appear in the source store's "Subscribed elements"
        // section in devtools, with a distinct "computed" type badge.
        if (__DEV__) {
            source._trackSubscriber?.(
                _devName, // use computed devName as the subscriber id
                typeof keyOrFn === 'string' ? [keyOrFn] : [], // keys it watches
                'computed', // binding type — rendered differently in devtools
                () => _value, // live value getter
                _pickSrc, // source snippet shown in the pill
            );
            // UNCOMMENT IF WE HAVE CLIENT-SIDE NAVIGATION FEATURE
            //registerCleanup(() => source._untrackSubscriber?.(_devName));
        }
    });

    // ── Read-only store object ─────────────────────────────────────────────────
    const computedStore = {
        _store_symbol: '__korejs_store',
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
        },
    };

    // ── DEV-only methods ───────────────────────────────────────────────────────
    if (__DEV__) {
        computedStore._updateCount = () => _updates;
        computedStore._subCount = () => [..._listeners].filter((fn) => !fn.__korDevtools).length;
        computedStore._manualSubCount = () => 0;
        computedStore._manualSubs = () => [];

        // dom.js _bind() calls these when an element subscribes to this computed
        computedStore._trackSubscriber = (elId, keys, type, getValue, src) => {
            keys.forEach((k) => {
                if (!_devSubs.has(k)) _devSubs.set(k, new Map());
                _devSubs.get(k).set(elId, { type, getValue, src });
            });
            window.__korDevtools?._onStoreUpdate?.(_devName);
        };

        computedStore._untrackSubscriber = (elId) => {
            _devSubs.forEach((map) => map.delete(elId));
            window.__korDevtools?._onStoreUpdate?.(_devName);
        };
    }

    // ── Proxy — forwards property access into the derived value ───────────────
    const proxy = new Proxy(computedStore, {
        get(target, key) {
            if (key in target) return target[key];
            const val = _value;
            if (val !== null && typeof val === 'object' && key in val) return val[key];
            if (typeof val !== 'object') return val;
            return undefined;
        },
        set() {
            if (__DEV__)
                window?.__korDevtools?.reportError?.({
                    type: 'SETTING_READ_ONLY_STORE',
                    message: `\ncomputed store is read-only.`,
                });
            throw new Error(`computed store is read-only.`);
        },
    });

    // ── DEV registry ──────────────────────────────────────────────────────────
    // Written AFTER proxy is fully built so store is never null.
    // Writes directly to __kor_stores — no dependency on __korDevtools timing.
    if (__DEV__ && typeof window !== 'undefined') {
        if (!window.__kor_stores) window.__kor_stores = new Map();
        window.__kor_stores.set(_devName, {
            store: proxy,
            history: _devHistory,
            subscribers: _devSubs,
            manualSubscribers: new Map(),
            isComputed: true,
            sourceNames: stores.map((s) => s._devName ?? '?'),
        });

        // Best-effort notify — works if panel already open.
        // _refreshStores() on next panel open handles the cold-start case.
        window.__korDevtools?._onStoreUpdate?.(_devName);
    }

    return proxy;
}
