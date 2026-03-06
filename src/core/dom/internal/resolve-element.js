import { nodeChecker } from './node-checker';

export function _resolveElement(selector) {
    if ((selector === null || selector === undefined) && arguments.length > 0) {
        return null;
    }
    if (arguments.length === 0 || selector === 'document') {
        const document = window?.document;
        if (!document) {
            if (__DEV__) {
                window.__korDevtools?.reportError?.({
                    type: 'ELEMENT_NOT_FOUND',
                    message: `Failed to get html document`,
                });
            }
            return null;
        }
        return document;
    }
    if (nodeChecker(selector).isNode) return selector;
    if (typeof selector === 'string' && selector.startsWith('<')) {
        const template = document.createElement('template');
        try {
            template.innerHTML = selector;
        } catch (err) {
            template.replaceChildren();
            if (__DEV__) {
                window.__korDevtools?.reportError?.({
                    type: 'FAILED_TO_CREATE_ELEMENT',
                    message: `Failed to create Element for selector: $('${selector}')`,
                });
            }
            throw new Error(
                `[kore-js] FAILED_TO_CREATE_ELEMENT: Failed to create Element for selector: $('${selector}')`,
            );
        }

        const els = [...template.content.children];

        if (!els.length) {
            if (__DEV__) {
                window.__korDevtools?.reportError?.({
                    type: 'FAILED_TO_CREATE_ELEMENT',
                    message: `No elements were created from: $('${selector}')`,
                });
            }
            throw new Error(
                `[kore-js] FAILED_TO_CREATE_ELEMENT: No elements were created from: $('${selector}')`,
            );
        }

        return els.length === 1 ? els[0] : els;
    }
    if (Array.isArray(selector)) {
        // array of raw DOM nodes — return as-is, forEachEl handles them
        if (selector.every((s) => s && s.nodeType)) {
            return selector;
        }

        // array of CSS selector strings
        try {
            const els = [...document.querySelectorAll(selector.join(', '))];
            if (!els.length) {
                if (__DEV__)
                    window.__korDevtools?.reportError?.({
                        type: 'ELEMENT_NOT_FOUND',
                        message: `No elements found for selectors: $('${selector.join(', ')}')`,
                    });
                throw new Error(
                    `[kore-js] ELEMENT_NOT_FOUND: No elements found for selectors: $('${selector.join(', ')}')`,
                );
            }
            return els;
        } catch (err) {
            if (__DEV__) window.__korDevtools?.reportError?.({ message: err.message ?? err });
            throw err;
        }
    }

    let el = null;
    if (typeof selector === 'object' && selector.id) {
        el = document.getElementById(selector.id);
    } else if (typeof selector === 'string') {
        try {
            el = selector.startsWith('#')
                ? document.getElementById(selector.slice(1))
                : document.querySelector(selector);
        } catch (err) {
            const formatted = `$('${selector ?? ''}')`;

            if (__DEV__) {
                window.__korDevtools?.reportError?.({
                    type: 'ELEMENT_NOT_FOUND',
                    message: `Failed to find element for selector: ${formatted}`,
                });
            }

            throw new Error(
                `[kore-js] ELEMENT_NOT_FOUND: Failed to find element for selector: ${formatted}`,
            );
        }
    }

    // fallback
    if (!el) {
        const formatted = `$('${selector ?? ''}')`;

        if (__DEV__) {
            window.__korDevtools?.reportError?.({
                type: 'ELEMENT_NOT_FOUND',
                message: `Element not found for selector: ${formatted}`,
            });
        }
        throw new Error(
            `[kore-js] ELEMENT_NOT_FOUND: Element not found for selector: ${formatted}`,
        );
    }

    return el;
}
