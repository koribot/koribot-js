// ── HTML Sanitizer ────────────────────────────────────────────────────────────
// Cleans attributes only — never removes tags.
//   on*               → removed   (onerror, onclick, onload, …)
//   javascript:/data: → blanked,  attribute kept
const _URI_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'xlink:href']);
const _BAD_URI = /^\s*(javascript|data)\s*:/i;

export function _sanitize(html) {
    if (!html) return '';

    const tpl = document.createElement('template');
    tpl.innerHTML = html;

    tpl.content.querySelectorAll('*').forEach((node) => {
        for (const { name, value } of [...node.attributes]) {
            if (/^on/i.test(name)) {
                node.removeAttribute(name);
                continue;
            }
            if (_URI_ATTRS.has(name.toLowerCase()) && _BAD_URI.test(value))
                node.setAttribute(name, '');
        }
    });

    const wrapper = document.createElement('div');
    wrapper.appendChild(tpl.content.cloneNode(true));
    return wrapper.innerHTML;
}

export function _safeAttrVal(attrName, value) {
    return _URI_ATTRS.has(attrName.toLowerCase()) && _BAD_URI.test(value ?? '') ? '' : value;
}
