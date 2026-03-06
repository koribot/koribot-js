// kore-js/dom.js
import { isStore } from '../store/store.js';
// TODO: uncomment when client-side navigation (SPA) feature is implemented.
// registerCleanup wires dom.js listeners into the scope system so they are
// automatically removed when a page scope is destroyed during navigation.
// import { registerCleanup } from '../store/scope.js';
import { checkIfItReturnedByRaw, KoreJsSafeHtml } from '../html/html.js';
import { _lis } from './internal/lis.js';
import { _resolveElement } from './internal/resolve-element.js';
import { _safeAttrVal, _sanitize } from './internal/sanitizers.js';
import { _devMeta } from './__dev/dev-tool-helpers.js';
import { _bind } from './internal/bind.js';
import { _resolveTarget } from './internal/resolve-target.js';

function _toFn(keyOrFn) {
    return typeof keyOrFn === 'string' ? (state) => state[keyOrFn] : keyOrFn;
}

// ── Main $ API ────────────────────────────────────────────────────────────────
export function $(selector, props = {}) {
    const isSelectorArr =
        (Array.isArray(selector) && selector.length > 0) ||
        NodeList.prototype.isPrototypeOf(selector) ||
        HTMLCollection.prototype.isPrototypeOf(selector);

    // WE CHECK IF WE PASS A NULL/UNDEFINED AS PARAMETER then call resolvedEl(Selector = null or undefined) it will return null
    //  - useful if in findAll, find if we dont fint the element we pass null as param
    // Otherwise resolvedEl will be return the document if we call _resolveElement()
    const resolvedEl = arguments.length > 0 ? _resolveElement(selector) : _resolveElement();

    // helper: run a callback for each el, or just the single el
    const forEachEl = (fn) => {
        if (isSelectorArr) resolvedEl.forEach((el) => el && fn(el));
        else if (resolvedEl) fn(resolvedEl);
    };

    // Unified listener registry: el → Map<eventName, Map<handler, activeHandler>>
    // - Duplicate detection:  map.has(handler)
    // - Active handler lookup: map.get(handler)  (prod: handler → handler, dev: handler → wrapper)
    const _listeners = new WeakMap();

    const _getHandlerMap = (el, eventName) => _listeners.get(el)?.get(eventName);

    const _isDuplicate = (el, eventName, handler) =>
        _getHandlerMap(el, eventName)?.has(handler) ?? false;

    const _trackListener = (el, eventName, handler, activeHandler) => {
        if (!_listeners.has(el)) _listeners.set(el, new Map());
        const byEvent = _listeners.get(el);
        if (!byEvent.has(eventName)) byEvent.set(eventName, new Map());
        byEvent.get(eventName).set(handler, activeHandler);
    };

    const _untrackListener = (el, eventName, handler) =>
        _getHandlerMap(el, eventName)?.delete(handler);

    // ── Internal helpers for DOM events ───────────────────────────────────────
    const attachListener = (el, eventName, handler, devStoreMeta) => {
        if (el && _isDuplicate(el, eventName, handler)) {
            if (__DEV__) {
                window?.__korDevtools?._devWarn?.(
                    `[kore-js] (on) Duplicate listener ignored for event "${eventName}" on`,
                    'DUPLICATE_EVENT',
                );
            }
            console.warn(
                `[kore-js] (on) Duplicate listener ignored for event "${eventName}" on`,
                'DUPLICATE_EVENT',
            );
            return;
        }
        const elId = el?.id ?? null;
        const elTag = el?.tagName?.toLowerCase() ?? '';
        const elCls = el?.className ?? '';
        let devRegKey = null;

        if (__DEV__) {
            if (!window.__kor_events) window.__kor_events = new Map();

            const identity = elId ? `#${elId}` : `${elTag}${elCls ? '.' + elCls : ''}`;
            devRegKey = `${eventName}::${identity}`;

            const handlerSnippet = (() => {
                const s = handler?.toString() ?? '';
                return s.length > 60 ? s.slice(0, 59) + '…' : s;
            })();

            if (!window.__kor_events.has(devRegKey)) {
                window.__kor_events.set(devRegKey, {
                    type: eventName,
                    elId,
                    elTag,
                    elCls,
                    store: devStoreMeta?.store ?? null,
                    keys: devStoreMeta?.keys ?? [],
                    handlerSrc: handlerSnippet,
                    fires: 0,
                    lastFire: null,
                });
            }

            window.__korDevtools?._onEventRegister?.();
        }

        const activeHandler = __DEV__
            ? function (e) {
                  const entry = window.__kor_events?.get(devRegKey);
                  if (entry) {
                      entry.fires++;
                      entry.lastFire = Date.now();
                  }
                  window.__kor_recordFire?.(devRegKey);
                  return handler.call(this, e);
              }
            : handler;

        if (el) {
            el.addEventListener(eventName, activeHandler);
            _trackListener(el, eventName, handler, activeHandler);
            // TODO: enable when client-side navigation (SPA) is implemented.
            // registerCleanup(() => {
            //     el.removeEventListener(eventName, activeHandler);
            //     _untrackListener(el, eventName, handler);
            // });
            return;
        }

        // fallback to delegation in case failure in adding listener directly to element
        const delegated = (e) => {
            const target = e.target.closest?.(selector);
            if (target) activeHandler.call(target, e);
        };
        document.addEventListener(eventName, delegated);
        // TODO: enable when client-side navigation (SPA) is implemented.
        // registerCleanup(() => document.removeEventListener(eventName, delegated));
    };

    // Apply props/attrs/events to created elements ($('<div>', { ... }))
    // NOTE: this block is intentionally placed after attachListener so that
    // function props (event listeners) go through attachListener and get
    // cleanup registration, duplicate detection, and dev tracking for free.
    if (typeof selector === 'string' && selector.startsWith('<') && Object.keys(props).length) {
        const targets = Array.isArray(resolvedEl) ? resolvedEl : [resolvedEl];

        for (const el of targets) {
            for (const [key, val] of Object.entries(props)) {
                if (typeof val === 'function') {
                    // route through attachListener for cleanup, dedup, and dev tracking
                    attachListener(el, key, val);
                } else if (key === 'class') {
                    el.className = val;
                } else if (key === 'style' && typeof val === 'object') {
                    Object.assign(el.style, val);
                } else if (key in el) {
                    // known DOM property (value, checked, disabled, etc.)
                    el[key] = val;
                } else {
                    // fallback to attribute
                    el.setAttribute(key, val);
                }
            }
        }
    }

    const reactiveOrStatic = (source, keyOrFn, bindingType, apply) => {
        const _source = typeof source === 'function' ? source() : source;
        forEachEl((el) => {
            if (isStore(_source)) {
                _bind(
                    _source,
                    _toFn(keyOrFn),
                    (v) => apply(el, v),
                    _devMeta(selector, keyOrFn, bindingType),
                );
            } else {
                apply(el, _source);
            }
        });
    };

    // ──────────────────────────────────────────────────────────────//
    //                        PUBLIC API                             //
    // ──────────────────────────────────────────────────────────────//
    const api = {
        on(eventName, handler, devStoreMeta) {
            forEachEl((el) => attachListener(el, eventName, handler, devStoreMeta));
            return api;
        },

        off(eventName, handler) {
            forEachEl((el) => {
                const active = _getHandlerMap(el, eventName)?.get(handler) ?? handler;
                el.removeEventListener(eventName, active);
                _untrackListener(el, eventName, handler);
            });
            return api;
        },

        text(source, keyOrFn) {
            reactiveOrStatic(source, keyOrFn, 'text', (el, v) => {
                el.textContent = v ?? '';
            });
            return api;
        },

        html(source, keyOrTemplateFn) {
            reactiveOrStatic(source, keyOrTemplateFn, 'html', (el, v) => {
                if (typeof source !== 'function') {
                    el.innerHTML = _sanitize(v ?? '');
                    return;
                }
                const _html = source();
                if (typeof _html !== 'string' && !(_html instanceof KoreJsSafeHtml)) {
                    if (__DEV__)
                        window?.__korDevtools?.reportError?.({
                            type: 'TYPE_MISMATCH',
                            message: `Source should be a string or instance of KoreJsSafeHtml(raw``), but got ${typeof _html}\nsource: ${JSON.stringify(_html)}\nstore: ${JSON.stringify(source._devName)}\nkeyOrFn: ${keyOrTemplateFn}\nselector: ${selector}`,
                        });
                    throw new Error(
                        `[kore-js] TYPE_MISMATCH: Source should be a string or instance of KoreJsSafeHtml(raw``), but got ${typeof _html}`,
                    );
                }
                el.innerHTML = _sanitize(_html);
            });
            return api;
        },

        attr(attrName, source, keyOrFn) {
            const _attrName = typeof attrName === 'function' ? attrName() : attrName;
            const _source = typeof source === 'function' ? source() : source;
            forEachEl((el) => {
                if (isStore(_source)) {
                    _bind(
                        _source,
                        _toFn(keyOrFn),
                        (v) => el.setAttribute(_attrName, _safeAttrVal(_attrName, v)),
                        _devMeta(selector, keyOrFn, 'attr'),
                    );
                } else {
                    el.setAttribute(_attrName, _safeAttrVal(_attrName, _source));
                }
            });
            return api;
        },

        removeAttr(attrName) {
            forEachEl((el) => el.removeAttribute(attrName));
            return api;
        },

        cls(className, source, keyOrFn) {
            const _className = typeof className === 'function' ? className() : className;
            const _source = typeof source === 'function' ? source() : source;
            forEachEl((el) => {
                if (isStore(_source)) {
                    _bind(
                        _source,
                        _toFn(keyOrFn),
                        (v) => el.classList.toggle(_className, !!v),
                        _devMeta(selector, keyOrFn, 'cls'),
                    );
                } else {
                    el.classList.toggle(_className, !!_source);
                }
            });
            return api;
        },

        addClass(className, source, keyOrFn, conditionFn) {
            const _className = typeof className === 'function' ? className() : className;
            reactiveOrStatic(source, keyOrFn, 'addClass', (el, v) => {
                if (typeof conditionFn === 'function') {
                    const conditionFnRes = conditionFn(v);
                    if (typeof conditionFnRes !== 'boolean') {
                        if (__DEV__)
                            window?.__korDevtools?.reportError?.({
                                type: 'TYPE_MISMATCH',
                                message: `conditionFn should return a boolean value, but got ${typeof conditionFnRes}\nconditionFn: ${conditionFn.toString()}\nstore: ${JSON.stringify(source._devName)}\nkeyOrFn: ${keyOrFn}\nselector: ${selector}`,
                            });
                        throw new Error(
                            `[kore-js] TYPE_MISMATCH: conditionFn should return a boolean value, but got ${typeof conditionFnRes}`,
                        );
                    }
                    conditionFnRes && el.classList.add(_className);
                } else {
                    el.classList.add(_className);
                }
            });
            return api;
        },

        removeClass(className) {
            forEachEl((el) => el.classList.remove(className));
            return api;
        },

        style(cssProp, source, keyOrFn) {
            const _cssProp = typeof cssProp === 'function' ? cssProp() : cssProp;
            const _source = typeof source === 'function' ? source() : source;
            forEachEl((el) => {
                if (isStore(_source)) {
                    _bind(
                        _source,
                        _toFn(keyOrFn),
                        (v) => {
                            el.style[_cssProp] = v;
                        },
                        _devMeta(selector, keyOrFn, 'style'),
                    );
                } else {
                    el.style[_cssProp] = _source;
                }
            });
            return api;
        },

        show(source, keyOrFn) {
            reactiveOrStatic(source, keyOrFn, 'show', (el, v) => {
                el.style.display = v ? '' : 'none';
            });
            return api;
        },

        hide() {
            forEachEl((el) => {
                el.style.display = 'none';
            });
            return api;
        },

        if(source, keyOrFn, templateFn) {
            const hasStore = isStore(source);
            const func = hasStore ? _toFn(keyOrFn) : null;
            const callbackFn = hasStore ? templateFn : keyOrFn;

            forEachEl((el) => {
                let lastState = null;
                const render = (condition) => {
                    if (condition) {
                        if (lastState === true) return;

                        const InstanceOfRawOrPrimitiveString = hasStore
                            ? callbackFn(source)
                            : callbackFn();

                        el.innerHTML = _sanitize(InstanceOfRawOrPrimitiveString);

                        lastState = true;
                    } else {
                        if (lastState === false) return;
                        el.innerHTML = '';
                        lastState = false;
                    }
                };

                if (hasStore) {
                    _bind(source, func, render, _devMeta(selector, keyOrFn, 'if'));
                } else {
                    const _source = typeof source === 'function' ? source() : source;
                    if (typeof source !== 'boolean') {
                        if (__DEV__)
                            window.__korDevtools?.reportError?.({
                                type: 'TYPE_MISMATCH',
                                message: `source must be a "boolean" but received a typeof "${typeof source}": source->${JSON.stringify(source) || source} ${hasStore ? 'Store-> ' + source._devName : ''}`,
                            });
                        throw new Error(
                            `[kore-js] TYPE_MISMATCH: source must be a "boolean" but received typeof "${typeof source}"`,
                        );
                    }
                    render(_source);
                }
            });

            return api;
        },

        when(source, keyOrFn, branches) {
            const hasStore = isStore(source);
            const func = hasStore ? _toFn(keyOrFn) : null;
            const branchMap = hasStore ? branches : keyOrFn;

            forEachEl((el) => {
                let lastBranch = null;
                const render = (condition) => {
                    const branch = condition ? 'true' : 'false';
                    if (branch === lastBranch) return;

                    const InstanceOfRawOrPrimitiveString = (
                        condition ? branchMap.true : branchMap.false
                    )?.();

                    el.innerHTML = _sanitize(InstanceOfRawOrPrimitiveString);

                    lastBranch = branch;
                };

                if (hasStore) {
                    _bind(source, func, render, _devMeta(selector, keyOrFn, 'when'));
                } else {
                    const _source = typeof source === 'function' ? source() : source;
                    if (typeof source !== 'boolean') {
                        if (__DEV__)
                            window.__korDevtools?.reportError?.({
                                type: 'TYPE_MISMATCH',
                                message: `source must be a "boolean" but received a typeof "${typeof source}": source->${JSON.stringify(source) || source} ${hasStore ? 'Store-> ' + source._devName : ''}`,
                            });
                        throw new Error(
                            `[kore-js] TYPE_MISMATCH: source must be a "boolean" but received typeof "${typeof source}"`,
                        );
                    }
                    render(_source);
                }
            });

            return api;
        },

        each(source, keyOrFn, templateFn, uniquekeyFn) {
            const hasStore = isStore(source);
            const picker = hasStore ? _toFn(keyOrFn) : null;
            const tplFn = hasStore ? templateFn : keyOrFn;
            const getKey = hasStore
                ? (uniquekeyFn ?? ((_, i) => i))
                : (templateFn ?? ((_, i) => i));

            forEachEl((el) => {
                const nodesByKey = new Map();

                const render = (items) => {
                    if (!Array.isArray(items)) return;

                    const seen = new Set();

                    items.forEach((item, i) => {
                        const _key = getKey(item, i);
                        if (typeof _key !== 'string' && typeof _key !== 'number') {
                            if (__DEV__)
                                window.__korDevtools?.reportError?.({
                                    type: 'TYPE_MISMATCH',
                                    message: `uniquekeyFn must return a string or number but received a "${_key}"\n${hasStore && 'Store -> ' + source._devName}\nuniquekeyFn used -> ${getKey}\nitem -> ${JSON.stringify(item)}`,
                                });
                            throw new Error(
                                `[kore-js] TYPE_MISMATCH: uniquekeyFn must return a string or number but received "${_key}"`,
                            );
                        }
                        const rowKey = String(_key);

                        if (seen.has(rowKey)) {
                            if (__DEV__)
                                window.__korDevtools?.reportError?.({
                                    type: 'DUPLICATE_KEY',
                                    message: `\n-Duplicate key "${rowKey}" found in each() list. Each key must be unique.\n-item->${JSON.stringify(item)}\n-You use this to derive key->${getKey}`,
                                });
                            throw new Error(
                                `[kore-js] DUPLICATE_KEY: Duplicate key "${rowKey}" found in each() list`,
                            );
                        }
                        seen.add(rowKey);

                        if (nodesByKey.has(rowKey)) {
                            const entry = nodesByKey.get(rowKey);
                            if (!Object.is(entry.item, item)) {
                                const tmp = document.createElement('template');
                                tmp.innerHTML = _sanitize(tplFn(item, i));

                                if (tmp.content.childElementCount > 1) {
                                    if (__DEV__)
                                        window.__korDevtools?._devWarn?.(
                                            'Template returned multiple root elements. Wrap them in a single parent.',
                                            'each',
                                        );
                                    console.warn(
                                        '[kore-js] (each) Template returned multiple root elements. Wrap them in a single parent.',
                                    );
                                }

                                const newNode = tmp.content.firstElementChild;
                                if (newNode) {
                                    newNode.dataset.korKey = rowKey;
                                    entry.node.replaceWith(newNode);
                                    entry.node = newNode;
                                    entry.item = item;
                                }
                            }
                        } else {
                            const tmp = document.createElement('template');
                            const rendered = tplFn(item, i);
                            tmp.innerHTML = _sanitize(rendered);

                            if (tmp.content.childElementCount > 1) {
                                if (__DEV__)
                                    window.__korDevtools?._devWarn?.(
                                        'Template returned multiple root elements. Wrap them in a single parent.',
                                        'each',
                                    );
                                console.warn(
                                    '[kore-js] (each) Template returned multiple root elements. Wrap them in a single parent.',
                                );
                            }

                            const node = tmp.content.firstElementChild;
                            if (node) {
                                node.dataset.korKey = rowKey;
                                el.appendChild(node);
                                nodesByKey.set(rowKey, { item, node });
                            }
                        }
                    });

                    // remove stale
                    nodesByKey.forEach(({ node }, rowKey) => {
                        if (!seen.has(rowKey)) {
                            node.remove();
                            nodesByKey.delete(rowKey);
                        }
                    });

                    // reorder with LIS — only move nodes not in longest increasing subsequence
                    const domOrder = [...el.children].map((n) => n.dataset.korKey);
                    const keyToPos = new Map(domOrder.map((k, i) => [k, i]));
                    const expectedKeys = items.map((item, i) => String(getKey(item, i)));
                    const positions = expectedKeys.map((k) => keyToPos.get(k) ?? -1);

                    const lisIndices = _lis(positions);

                    let cursor = null;
                    for (let i = expectedKeys.length - 1; i >= 0; i--) {
                        const n = nodesByKey.get(expectedKeys[i]);
                        const node = n ? n.node : null;
                        if (!lisIndices.has(i)) {
                            el.insertBefore(node, cursor);
                        }
                        cursor = node;
                    }
                };

                if (hasStore) _bind(source, picker, render, _devMeta(selector, keyOrFn, 'each'));
                else render(source);
            });

            return api;
        },

        val(_value, onChangeFn) {
            forEachEl((el) => {
                el.value = (typeof _value === 'function' ? _value() : _value) ?? '';
                if (typeof onChangeFn === 'function') {
                    const handler = (e) => onChangeFn(e.target.value, e);
                    el.addEventListener('input', handler);
                    // TODO: enable when client-side navigation (SPA) is implemented.
                    // registerCleanup(() => el.removeEventListener('input', handler));
                }
            });
            return api;
        },

        checked(source, keyOrFn) {
            reactiveOrStatic(source, keyOrFn, 'checked', (el, v) => {
                el.checked = !!v;
            });
            return api;
        },

        booleanAttr(propName, source, keyOrFn) {
            reactiveOrStatic(source, keyOrFn, 'booleanAttr', (el, v) => {
                el[propName] = !!v;
            });
            return api;
        },

        focus(source = true, keyOrFn) {
            reactiveOrStatic(source, keyOrFn, 'focus', (el, v) => {
                if (v) el.focus();
            });
            return api;
        },

        find(_selector, callbackFn, options) {
            const _options = (typeof callbackFn === 'object' ? callbackFn : options) || {};
            const found = [];

            forEachEl((el) => {
                const _el = el.querySelector(_selector);
                if (!_el && _options.strict) {
                    if (__DEV__)
                        window.__korDevtools?.reportError?.({
                            type: 'INVALID_SELECTOR',
                            message: `Failed to find element with selector: ${_selector}`,
                        });
                    throw new Error(
                        `[kore-js] INVALID_SELECTOR: Failed to find element with selector: ${_selector}`,
                    );
                }
                if (_el) found.push(_el);
                callbackFn && typeof callbackFn === 'function' && callbackFn($(_el));
            });

            return found.length === 0 ? $(null) : found.length === 1 ? $(found[0]) : $(found);
        },

        findAll(_selector, callbackFn, options) {
            const _options = (typeof callbackFn === 'object' ? callbackFn : options) || {};
            const found = [];

            forEachEl((el) => {
                const _els = [...el.querySelectorAll(_selector)];
                if (!_els.length && _options.strict) {
                    if (__DEV__)
                        window.__korDevtools?.reportError?.({
                            type: 'ELEMENTS_NOT_FOUND',
                            message: `Failed to find element/elements with selector: ${_selector}`,
                        });
                    throw new Error(
                        `[kore-js] ELEMENTS_NOT_FOUND: Failed to find element/elements with selector: ${_selector}`,
                    );
                }
                found.push(..._els);
                callbackFn && typeof callbackFn === 'function' && callbackFn($(_els));
            });

            return found.length === 0 ? $(null) : found.length === 1 ? $(found[0]) : $(found);
        },

        // ── DOM Manipulation ──────────────────────────────────────────────────────────

        append(...targets) {
            forEachEl((el) => {
                for (const target of targets) {
                    if (target && typeof target === 'object' && target.el) {
                        // $ instance
                        el.appendChild(target.el);
                    } else if (target && typeof target === 'object' && target.els) {
                        // $ multi instance
                        target.els.forEach((t) => el.appendChild(t));
                    } else if (typeof target === 'string') {
                        // HTML string
                        const template = document.createElement('template');
                        template.innerHTML = target;
                        el.appendChild(template.content);
                    } else if (target instanceof Node) {
                        // raw DOM node
                        el.appendChild(target);
                    } else if (__DEV__) {
                        console.warn('[kore-js] (append) Unsupported target type:', typeof target);
                    }
                }
            });
            return api;
        },

        prepend(...targets) {
            forEachEl((el) => {
                // reverse so multiple targets end up in the right order
                for (const target of [...targets].reverse()) {
                    if (target && typeof target === 'object' && target.el) {
                        el.insertBefore(target.el, el.firstChild);
                    } else if (target && typeof target === 'object' && target.els) {
                        target.els.forEach((t) => el.insertBefore(t, el.firstChild));
                    } else if (typeof target === 'string') {
                        const template = document.createElement('template');
                        template.innerHTML = target;
                        el.insertBefore(template.content, el.firstChild);
                    } else if (target instanceof Node) {
                        el.insertBefore(target, el.firstChild);
                    } else if (__DEV__) {
                        console.warn('[kore-js] (prepend) Unsupported target type:', typeof target);
                    }
                }
            });
            return api;
        },

        before(...targets) {
            forEachEl((el) => {
                for (const target of targets) {
                    const node = _resolveTarget(target);
                    if (node) el.parentNode?.insertBefore(node, el);
                }
            });
            return api;
        },

        after(...targets) {
            forEachEl((el) => {
                for (const target of [...targets].reverse()) {
                    const node = _resolveTarget(target);
                    if (node) el.parentNode?.insertBefore(node, el.nextSibling);
                }
            });
            return api;
        },

        remove() {
            forEachEl((el) => el.remove());
            return api;
        },

        replaceWith(target) {
            forEachEl((el) => {
                const node = _resolveTarget(target);
                if (node) el.replaceWith(node);
            });
            return api;
        },

        clone(deep = true) {
            // returns a new $ instance wrapping the cloned node(s)
            let cloned = null;
            forEachEl((el) => {
                cloned = el.cloneNode(deep);
            });
            return cloned ? $(cloned) : api;
        },
    };

    if (isSelectorArr) {
        Object.defineProperty(api, 'els', {
            get() {
                return resolvedEl;
            },
            enumerable: true,
        });
    } else {
        Object.defineProperty(api, 'el', {
            get() {
                return resolvedEl;
            },
            enumerable: true,
        });
    }

    return api;
}