// kore-js/meta.js

import { isStore } from '../store/store.js';
// TODO: uncomment when client-side navigation (SPA) feature is implemented.
// registerCleanup wires dom.js listeners into the scope system so they are
// automatically removed when a page scope is destroyed during navigation.
// import { registerCleanup } from '../store/scope.js';

function getMetaEl(attr, value) {
    let el = document.querySelector(`meta[${attr}="${value}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
    }
    return el;
}

function _sel(keyOrFn) {
    return typeof keyOrFn === 'string' ? (s) => s[keyOrFn] : keyOrFn;
}

function _bind(storeOrVal, keyOrFn, setter) {
    if (isStore(storeOrVal)) {
        const sel = _sel(keyOrFn);
        setter(sel(storeOrVal.getState()));
        const unsub = storeOrVal.subscribe((s) => setter(sel(s)));
        // UNCOMMENT IF WE HAVE CLIENT-SIDE NAVIGATION FEATURE
        //registerCleanup(unsub)
    } else {
        setter(storeOrVal);
    }
}

export const meta = {

    title(storeOrVal, keyOrFn) {
        _bind(storeOrVal, keyOrFn, (v) => {
            document.title = v;
        });
    },

    description(storeOrVal, keyOrFn) {
        const el = getMetaEl('name', 'description');
        _bind(storeOrVal, keyOrFn, (v) => el.setAttribute('content', v));
    },

    og(property, storeOrVal, keyOrFn) {
        const el = getMetaEl('property', property);
        _bind(storeOrVal, keyOrFn, (v) => el.setAttribute('content', v));
    },

    set(name, storeOrVal, keyOrFn) {
        const el = getMetaEl('name', name);
        _bind(storeOrVal, keyOrFn, (v) => el.setAttribute('content', v));
    },

    canonical(url) {
        let el = document.querySelector('link[rel="canonical"]');
        if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', 'canonical');
            document.head.appendChild(el);
        }
        el.setAttribute('href', url);
    },
};
