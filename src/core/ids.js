
export { $ } from './dom/dom.js';

export function safeId(name = 'el', prefix = '') {
    const suffix =
        typeof crypto?.randomUUID === 'function'
            ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
            : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const id = `${prefix}${name}-${suffix}`;

    return {
        id,
        toString() {
            return id;
        },
    };
}
