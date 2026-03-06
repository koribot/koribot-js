export function ready(fn) {
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn, { once: true })
}

// state: 'loading' | 'interactive' | 'complete'
export function onDomReadyState(state, fn) {
    if (document.readyState === state) fn()
    else document.addEventListener('readystatechange', function handler() {
        if (document.readyState === state) {
            document.removeEventListener('readystatechange', handler)
            fn()
        }
    })
}