// TODO: make this work for Client side navigation
let _activePageScope = null;

export async function navigate(target, options = {}) {
    let path;

    if (typeof target === 'string') {
        path = target;
    } else {
        if (__DEV__ && !(target instanceof HTMLAnchorElement))
            throw new Error(`[kor] navigate() requires an <a> element or a path string.`);
        path = new URL(target.href, location.origin).pathname;
    }

    if (path === location.pathname) return;

    if (_activePageScope) {
        _activePageScope.destroy();
        _activePageScope = null;
    }

    let fragment;
    try {
        const res = await fetch(path, { headers: { 'X-Kor-Navigate': 'true' } });
        fragment = await res.json();
    } catch (err) {
        console.error('[kor] navigate() fetch failed:', err);
        location.href = path;
        return;
    }

    const outlet = document.getElementById('kor-app');
    if (outlet) outlet.innerHTML = fragment.html;
    if (fragment.title) document.title = fragment.title;

    if (options.replace) history.replaceState(null, '', path);
    else history.pushState(null, '', path);

    if (fragment.scriptUrl) {
        try {
            const mod = await import(fragment.scriptUrl + '?t=' + Date.now());
            if (typeof mod.script === 'function') {
                const { createScope, withScope } = await import('./scope.js');
                _activePageScope = createScope();
                withScope(_activePageScope, () => mod.script());
            }
        } catch (err) {
            console.error('[kor] navigate() failed to load page script:', err);
        }
    }

    if (__DEV__) window.__korDevtools?._onNavigate?.();
}

if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[preserved="true"]');
        if (!link) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(link);
    });

    window.addEventListener('popstate', () => {
        if (_activePageScope) {
            _activePageScope.destroy();
            _activePageScope = null;
        }
    });
}
