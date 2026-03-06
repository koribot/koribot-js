// Resolves a $-instance, raw Node, or HTML string into a Node/DocumentFragment
export function _resolveTarget(target) {
    if (target && typeof target === 'object' && target.el) return target.el;
    if (target && typeof target === 'object' && target.els) {
        const frag = document.createDocumentFragment();
        target.els.forEach((el) => frag.appendChild(el));
        return frag;
    }
    if (target instanceof Node) return target;
    if (typeof target === 'string') {
        const template = document.createElement('template');
        template.innerHTML = target;
        return template.content;
    }
    if (__DEV__) console.warn('[kore-js] Unsupported target type passed to DOM method:', typeof target);
    return null;
}