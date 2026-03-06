// ── DEV helpers ───────────────────────────────────────────────────────────────

export function _devElId(selector) {
    if (!__DEV__) return null;
    if (typeof selector === 'string')
        return selector.startsWith('#') ? selector.slice(1) : selector;
    if (typeof selector === 'object' && selector.id) return selector.id;
    if (selector instanceof Element) return selector.id || selector.tagName?.toLowerCase();
    return null;
}
export function _devPickedKeys(keyOrFn) {
    if (!__DEV__) return [];
    if (typeof keyOrFn === 'string') return [keyOrFn];
    const src = keyOrFn?.toString() ?? '';
    const paramMatch = src.match(/^(?:(?:function\s*\w*\s*\((\w+))|(\w+)\s*=>|\((\w+)\)\s*=>)/);
    const param = paramMatch?.[1] ?? paramMatch?.[2] ?? paramMatch?.[3] ?? 's';
    const keys = [...src.matchAll(new RegExp(`\\b${param}\\.(\\w+)\\b`, 'g'))].map((m) => m[1]);
    return [...new Set(keys)];
}

export function _devPickerSrc(keyOrFn) {
    if (!__DEV__) return null;
    if (typeof keyOrFn === 'string') return `'${keyOrFn}'`;
    const src = keyOrFn?.toString() ?? '';
    return src.length > 48 ? src.slice(0, 47) + '…' : src;
}

export function _devMeta(selector, keyOrFn, bindingType) {
    if (!__DEV__) return null;
    return {
        elId: _devElId(selector),
        keys: _devPickedKeys(keyOrFn),
        type: bindingType,
        src: _devPickerSrc(keyOrFn),
    };
}
