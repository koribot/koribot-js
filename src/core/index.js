// kore-js/index.js
export { createStore, isStore }                     from './store/store.js';
export { $ }                                        from './dom/dom.js';
export { navigate }                                 from './router/navigate.js';
export { ready, onDomReadyState }                   from './dom/dom-ready-state.js';
export { safeId }                                   from './ids.js';
export { meta }                                     from './meta/meta.js';
export { 
    raw, 
    checkIfItReturnedByRaw,
    __KORE_JS_TRUSTED_HTML,
    KoreJsSafeHtml
}                                                   from './html/html.js';
export { resource }                                 from './resource-network/resource.js';
export { computed }                                 from './store/computed.js';

if (__DEV__) {
    let reportError = null;
    let _devWarn = null;

    // ── Error overlay ──────────────────────────────────────────────────────────
    const errorMod = await import('./dev-tools/error-overlay.js');
    reportError = errorMod.reportError;
    _devWarn = errorMod._devWarn;

    // ── Devtools ───────────────────────────────────────────────────────────────
    window.__korDevtools ??= {};
    window.__korDevtools.reportError = reportError;
    window.__korDevtools._devWarn = _devWarn;

    // Lazy panel initialisers — called once on first open by devtools-overlay.js
    window.__korDevtools.stores = async () => {
        const { initStoresPanel } = await import('./dev-tools/devtools-stores.client.js');
        initStoresPanel();
    };
    window.__korDevtools.events = async () => {
        const { initEventsPanel } = await import('./dev-tools/devtools-events.client.js');
        initEventsPanel();
    };
    window.__korDevtools.network = async () => {
        const { initNetworkPanel } = await import('./dev-tools/devtools-network.client.js');
        initNetworkPanel();
    };
    window.__korDevtools.page = async () => {
        const { initPagePanel } = await import('./dev-tools/devtools-page.client.js');
        initPagePanel();
    };

    // Mount the overlay into the DOM
    const { mountDevtools } = await import('./dev-tools/devtools-overlay.js');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountDevtools, {
            once: true,
        });
    } else {
        mountDevtools();
    }
}
