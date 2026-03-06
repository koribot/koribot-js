// Brand symbol — only code that imports __KORE_JS_TRUSTED_HTML  can check or forge it
export const __KORE_JS_TRUSTED_HTML  = Symbol('__KORE_JS_TRUSTED_HTML ');

// Helper — preferred over instanceof, works across subclasses
export const checkIfItReturnedByRaw = (val) => {
    const isRenderable = val?.[__KORE_JS_TRUSTED_HTML ] === true;
    return {
        isRenderable: isRenderable,
        content: isRenderable ? val : null,
    };
};

export class KoreJsSafeHtml extends String {
    get [__KORE_JS_TRUSTED_HTML ]() {
        return true;
    }
}

const ESC_MAP = {
    '&': '&amp;', // must be first to avoid double-escaping
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;', // prevents </script> injection
    '`': '&#96;', // attribute delimiter in some contexts
};

function esc(val) {
    return String(val ?? '').replace(/[&<>"'`/]/g, (c) => ESC_MAP[c]);
}

export function raw(strings, ...values) {
    let result = '';
    strings.forEach((str, i) => {
        result += str;
        if (i < values.length) {
            const val = values[i];
            if (Array.isArray(val)) {
                // Arrays: join mapped raw`` calls — each item already SafeHTML or escaped
                result += val
                    .map((v) => (checkIfItReturnedByRaw(v).isRenderable ? String(v) : esc(v)))
                    .join('');
            } else if (val == null || val === false) {
                // Skip nullish/false — clean conditional rendering
                result += '';
            } else if (checkIfItReturnedByRaw(val).isRenderable) {
                // Trusted nested raw`` — pass through untouched
                result += String(val);
            } else {
                // Plain user value — auto-escape
                result += esc(val);
            }
        }
    });
    return new KoreJsSafeHtml(result);
}
