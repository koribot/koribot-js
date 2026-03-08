// koribot-js/index.d.ts

// ── HTML ──────────────────────────────────────────────────────────────────────

export declare const __KORE_JS_TRUSTED_HTML: unique symbol;

/** 
 * **__KORE_JS_TRUSTED_HTML** is a brand symbol that can be used to check if a value was returned by raw`` - It does not sanitize the html only marks it as trusted
 * by escaping characters that can break the html
 */
export class KoreJsSafeHtml extends String {
    readonly [__KORE_JS_TRUSTED_HTML]: true;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export interface IStore<T extends object = object> {
    getState(): T;

    /**
     * Update the store state. The updater is a partial state object or a fn that receives the current state and returns a partial state object.
     *
     * @example
     * store.setState({ count: 1 })
     * store.setState((state) => ({ count: state.count + 1 }))
     */
    setState(updater: Partial<T> | ((state: T) => Partial<T>)): void;
    /**
     * Subscribe to state changes. The listener is called with the new state on every `setState()`.
     * Returns an unsubscribe function — call it to remove the listener and stop receiving updates.
     *
     * @example
     * const unsub = store.subscribe((state) => console.log(state.count))
     * unsub() // stop listening
     */
    subscribe(listener: (state: T) => void): () => void;
}

/**
 * Dev-only methods injected onto a {@link IStore} when `__DEV__` is `true`.
 * These do NOT exist in production builds — accessing them in prod will return `undefined`.
 * Use `Partial<IStoreDevMethods>` when typing a store that may be in dev or prod.
 *
 * Available via the koribot-js devtools panel to inspect store internals at runtime.
 */
export interface IStoreDevMethods {
    /**
     * The internal name used to identify this store in the devtools panel.
     * Set automatically if unnamed (e.g. `store_1`), or uses the name passed to {@link createStore}.
     */
    readonly _devName: string;
    /** Total number of `setState()` calls since store creation. */
    _updateCount(): number;
    /** Number of active DOM bindings on this store (excludes internal devtools listeners). */
    _subCount(): number;
    /** Number of manual `subscribe()` calls currently active. */
    _manualSubCount(): number;
    /** Metadata for each active manual subscriber — label, keys it watches, and registration time. */
    _manualSubs(): { id: string; label: string; registeredAt: number; keys: string[] }[];
}

/**
 * Dev-only methods injected onto a {@link computed} store when `__DEV__` is `true`.
 * These do NOT exist in production builds.
 *
 * Extends {@link IStoreDevMethods} with a computed-specific marker.
 */
export interface IComputedStoreDevMethods extends IStoreDevMethods {
    /** Always `true` — identifies this store as a derived {@link computed} store. */
    readonly _isComputed: true;
}

// ── Type aliases ──────────────────────────────────────────────────────────────

export type TPrimitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * A source value for a DOM binding — can be a {@link IStore}, a static {@link TPrimitive},
 * or a function that returns either a {@link IStore} or a {@link TPrimitive}.
 * If a function is passed it will be called once at bind time to resolve the value.
 */
export type TSource<T extends object = object> =
    | IStore<T>
    | TPrimitive
    | (() => IStore<T> | TPrimitive);

/**
 * A top-level state key string or a fn.
 * String shorthand only accesses the **top-level** key of the store state —
 * e.g. `'name'` maps to `state.name`.
 * ⚠️ For nested access, always use a fn: `(s) => s.user.name`.
 */
export type TKeyOrFn<T extends object = object> = string | ((state: T) => any);

/**
 * A template function that optionally receives a {@link IStore} and returns
 * {@link KoreJsSafeHtml} or a plain string.
 */
export type TTemplateFn<T extends object = object> = (store?: IStore<T>) => KoreJsSafeHtml | string;

/**
 * Branch map for {@link I$ApiMethods.when} — both true and false branches must be defined.
 * Each branch is a {@link TTemplateFn}.
 */
export type TBranches<T extends object = object> = { true: TTemplateFn<T>; false: TTemplateFn<T> };

/**
 * A function that returns a unique key per item in {@link I$ApiMethods.each}.
 * Return value must be a `string` or `number`.
 */
export type TUniqueKeyFn<T = any> = (item: T, index: number) => string | number;

/**
 * A plain string or a function that returns a string.
 * Used for attribute names, class names, CSS property names, and DOM property names
 * — all of which can be derived at bind time via a function.
 */
export type TStringOrFn = string | (() => string);

/**
 * A valid target for DOM manipulation methods such as {@link I$ApiMethods.append},
 * {@link I$ApiMethods.prepend}, {@link I$ApiMethods.before}, {@link I$ApiMethods.after},
 * and {@link I$ApiMethods.replaceWith}.
 *
 * Accepts:
 * - A {@link I$ApiMethodWithSingleElement} instance (from `$()`)
 * - A {@link I$ApiMethodWithMultiElement} instance (from `$([...])`)
 * - A raw DOM `Node`
 * - An HTML string — parsed via `<template>` before insertion
 */
export type TDomTarget = I$ApiMethodWithSingleElement | I$ApiMethodWithMultiElement | Node | string;

/**
 * Props map accepted by `$('<tag>', props)` — the second argument to {@link $}
 * when creating elements from an HTML string.
 *
 * - Function values → registered as event listeners (bare name: `'click'`, `'input'`, …)
 * - `'class'` → sets `element.className`
 * - `'style'` as an object → merged via `Object.assign(el.style, …)`
 * - Keys that exist on the element → set as DOM properties (`value`, `checked`, `disabled`, …)
 * - Everything else → `setAttribute(key, value)`
 *
 * @example
 * $('<button>', {
 *   class: 'btn',
 *   type:  'submit',
 *   style: { color: 'red' },
 *   click: () => console.log('clicked'),
 * })
 */
export type TElementProps = Record<
    string,
    string | number | boolean | Record<string, string> | ((e: Event) => void)
>;

// ── $ API ─────────────────────────────────────────────────────────────────────

export interface I$ApiMethods {
    /**
     * Attach an event listener to the element(s).
     *
     * @param eventName - the event name e.g. `'click'`, `'input'`
     * @param handler - the event handler
     *
     * @example
     * $('#btn').on('click', (e) => console.log('clicked'))
     * $(['#btn', '#btn2']).on('click', (e) => console.log('clicked'))
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    on(eventName: string, handler: (e: Event) => void): I$ApiMethods;

    /**
     * Remove an event listener from the element(s).
     *
     * @param eventName - the event name e.g. `'click'`, `'input'`
     * @param handler - the same handler reference passed to {@link I$ApiMethods.on}
     *
     * @example
     * const handler = (e) => console.log('clicked')
     * $('#btn').on('click', handler)
     * $('#btn').off('click', handler)
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    off(eventName: string, handler: (e: Event) => void): I$ApiMethods;

    /**
     * Set the text content of the element(s). If source is a {@link IStore}, it will be reactive.
     *
     * @param source - a {@link IStore}, a static {@link TPrimitive}, or a function returning either
     * @param [keyOrFn] - a top-level state key string or a fn.
     *                    ⚠️ String shorthand only accesses **top-level** keys — `'name'` maps to `state.name`.
     *                    For nested state, always use a fn: `(s) => s.user.name`
     *
     * @example
     * $('#el').text('hello')
     * $('#el').text(store, 'name')
     * $('#el').text(store, (s) => s.name)
     * $('#el').text(() => store)    // function returning a store
     * $('#el').text(() => 'hello')  // function returning a primitive
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    text(source: TSource, keyOrFn?: TKeyOrFn): I$ApiMethods;

    /**
     * Set the inner HTML of the element(s). Source must return a string or {@link KoreJsSafeHtml} (`raw\`\``).
     * If source is a {@link IStore}, it will be reactive. Always use `raw\`\`` to safely escape HTML.
     *
     * @param source - a {@link IStore}, static value, {@link KoreJsSafeHtml}, or a {@link TTemplateFn} returning HTML
     * @param [keyOrTemplateFn] - if source is a {@link IStore}: a top-level state key string or a fn.
     *                             ⚠️ String shorthand only accesses **top-level** keys. For nested state use a fn: `(s) => s.user.name`.
     *                             if source is a function: this is the templateFn returning {@link KoreJsSafeHtml} or string
     *
     * @example
     * $('#el').html(raw`<p>hello</p>`)
     * $('#el').html(store, 'content')
     * $('#el').html(store, (s) => raw`<p>${s.name}</p>`)
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    html(
        source: TSource | KoreJsSafeHtml | TTemplateFn,
        keyOrTemplateFn?: TKeyOrFn | TTemplateFn,
    ): I$ApiMethods;

    /**
     * Set an attribute on the element(s). If source is a {@link IStore}, it will be reactive.
     * The attribute value is sanitized before being set.
     *
     * For known boolean attributes (`disabled`, `checked`, `readonly`, `required`, etc.)
     * the value is set as a DOM property (`el[attrName] = !!v`) rather than via `setAttribute`,
     * ensuring correct falsy behaviour (e.g. `disabled = false` actually re-enables the element).
     *
     * @param attrName - the attribute name, or a {@link TStringOrFn} returning it
     * @param source - a {@link IStore}, a static {@link TPrimitive}, or a function returning either
     * @param [keyOrFn] - a top-level state key string or a fn.
     *                    ⚠️ String shorthand only accesses **top-level** keys — `'url'` maps to `state.url`.
     *                    For nested state, always use a fn: `(s) => s.user.url`
     * $('#el').attr('href', store, 'url')
     * $('#el').attr('disabled', store, (s) => s.isDisabled)   // boolean attr — sets el.disabled
     * $('#el').attr('required', true)                          // boolean attr — sets el.required
     * $('#el').attr(() => dynAttr, store, 'value')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    attr(attrName: TStringOrFn, source: TSource, keyOrFn?: TKeyOrFn): I$ApiMethods;

    /**
     * Remove an attribute from the element(s).
     *
     * @param attrName - the attribute name to remove
     *
     * @example
     * $('#el').removeAttr('disabled')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    removeAttr(attrName: string): I$ApiMethods;

    /**
     * Toggle a class on the element(s) based on a reactive {@link IStore} or a static boolean.
     *
     * @param className - the class to toggle, or a {@link TStringOrFn} returning it
     * @param source - a {@link IStore}, a static boolean, or a function returning either
     * @param [keyOrFn] - a top-level state key string or a fn.
     *                    ⚠️ String shorthand only accesses **top-level** keys — `'isActive'` maps to `state.isActive`.
     *                    For nested state, always use a fn: `(s) => s.user.isActive`
     * $('#el').cls('active', store, 'isActive')
     * $('#el').cls('active', store, (s) => s.isActive)
     * $('#el').cls(() => dynClass, store, 'isActive')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    cls(className: TStringOrFn, source: TSource, keyOrFn?: TKeyOrFn): I$ApiMethods;

    /**
     * Add a class to the element(s), optionally guarded by a condition function.
     * If source is a {@link IStore}, it will be reactive.
     *
     * @param className - the class to add, or a {@link TStringOrFn} returning it
     * @param source - a {@link IStore}, a static {@link TPrimitive}, or a function returning either
     * @param keyOrFn - a top-level state key string or a fn.
     *                  ⚠️ String shorthand only accesses **top-level** keys — `'count'` maps to `state.count`.
     *                  For nested state, always use a fn: `(s) => s.user.count`
     * @param [conditionFn] - receives the value and must return a boolean — class only added if `true`
     *
     * @example
     * $('#el').addClass('active', store, 'count', (v) => v > 0)
     * $('#el').addClass('visible', store, (s) => s.show)
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    addClass(
        className: TStringOrFn,
        source: TSource,
        keyOrFn: TKeyOrFn,
        conditionFn?: (v: any) => boolean,
    ): I$ApiMethods;

    /**
     * Remove a class from the element(s).
     *
     * @param className - the class to remove
     *
     * @example
     * $('#el').removeClass('active')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    removeClass(className: string): I$ApiMethods;

    /**
     * Set a CSS property on the element(s). If source is a {@link IStore}, it will be reactive.
     *
     * @param cssProp - the CSS property name e.g. `'color'`, or a {@link TStringOrFn} returning it
     * @param source - a {@link IStore}, a static {@link TPrimitive}, or a function returning either
     * @param [keyOrFn] - a top-level state key string or a fn.
     *                    ⚠️ String shorthand only accesses **top-level** keys — `'color'` maps to `state.color`.
     *                    For nested state, always use a fn: `(s) => s.user.color`
     * $('#el').style('color', store, 'color')
     * $('#el').style('opacity', store, (s) => s.visible ? '1' : '0')
     * $('#el').style(() => dynProp, store, 'value')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    style(cssProp: TStringOrFn, source: TSource, keyOrFn?: TKeyOrFn): I$ApiMethods;

    /**
     * Show or hide the element(s) by toggling `display`. If source is a {@link IStore}, it will be reactive.
     * Truthy sets `display` to `''` (restores), falsy sets `display` to `'none'`.
     *
     * @param source - a {@link IStore}, a static boolean, or a function returning either
     * @param [keyOrFn] - a top-level state key string or a fn.
     *                    ⚠️ String shorthand only accesses **top-level** keys — `'isVisible'` maps to `state.isVisible`.
     *                    For nested state, always use a fn: `(s) => s.user.isVisible`
     * $('#el').show(store, 'isVisible')
     * $('#el').show(store, (s) => s.isVisible)
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    show(source: TSource, keyOrFn?: TKeyOrFn): I$ApiMethods;

    /**
     * Hide the element(s) by setting `display` to `'none'`.
     * Complement of {@link I$ApiMethods.show}.
     *
     * @example
     * $('#el').hide()
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    hide(): I$ApiMethods;

    /**
     * Conditionally render HTML inside the element based on a boolean condition.
     * Clears the element's `innerHTML` when condition is `false`.
     * If source is a {@link IStore}, it will be reactive.
     *
     * For two-branch rendering (true/false), use {@link I$ApiMethods.when} instead.
     *
     * @param source - a {@link IStore}, a static boolean, or a function returning either
     * @param keyOrFn - if source is a {@link IStore}: a top-level state key string or a fn.
     *                  ⚠️ String shorthand only accesses **top-level** keys. For nested state use a fn: `(s) => s.user.isOn`.
     *                  if source is static/function: this becomes the templateFn
     * @param [templateFn] - returns the HTML to render when condition is `true`.
     *                                     Only required when source is a {@link IStore}.
     *
     * @example
     * // Static
     * $('#el').if(true, () => raw`<p>visible</p>`)
     *
     * // Function source
     * $('#el').if(() => isLoggedIn, () => raw`<p>welcome</p>`)
     *
     * // Store with key
     * $('#el').if(store, 'isVisible', (s) => raw`<p>${s.getState().name}</p>`)
     *
     * // Store with function
     * $('#el').if(store, (s) => s.isVisible, (s) => raw`<p>visible</p>`)
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    if(source: TSource, keyOrFn: TKeyOrFn | TTemplateFn, templateFn?: TTemplateFn): I$ApiMethods;

    /**
     * Render one of two HTML branches based on a boolean condition.
     * Unlike {@link I$ApiMethods.if}, both true and false branches are always defined via {@link TBranches}.
     * If source is a {@link IStore}, it will be reactive.
     *
     * @param source - a {@link IStore}, a static boolean, or a function returning either
     * @param keyOrFn - if source is a {@link IStore}: a top-level state key string or a fn.
     *                  ⚠️ String shorthand only accesses **top-level** keys. For nested state use a fn: `(s) => s.user.isOn`.
     *                  if source is static/function: this becomes the {@link TBranches} object
     * @param [branches] - {@link TBranches} object with `true` and `false` keys, each a {@link TTemplateFn}.
     *                                 Only required when source is a {@link IStore}.
     *
     * @example
     * // Static
     * $('#el').when(true, { true: () => raw`<p>yes</p>`, false: () => raw`<p>no</p>` })
     *
     * // Store with key
     * $('#el').when(store, 'isOn', { true: () => raw`<p>on</p>`, false: () => raw`<p>off</p>` })
     *
     * // Store with function
     * $('#el').when(store, (s) => s.isOn, { true: () => raw`<p>on</p>`, false: () => raw`<p>off</p>` })
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    when(source: TSource, keyOrFn: TKeyOrFn | TBranches, branches?: TBranches): I$ApiMethods;

    /**
     * Render a list of items into the element using LIS-based diffing to minimize DOM moves.
     * If source is a {@link IStore}, it will be reactive.
     * Provide a {@link TUniqueKeyFn} for stable keyed diffing — falls back to index if omitted.
     *
     * @param source - a {@link IStore}, a static array, or a function returning either
     * @param keyOrFn - if source is a {@link IStore}: a top-level state key string or a fn.
     *                  ⚠️ String shorthand only accesses **top-level** keys. For nested state use a fn: `(s) => s.data.items`.
     *                  if source is a static array: this becomes the templateFn
     * @param [templateFn] - receives each item and its index, returns an HTML string.
     *                                     Only required when source is a {@link IStore}.
     * @param [uniquekeyFn] - {@link TUniqueKeyFn} that returns a unique key per item.
     *                                       Defaults to index if not provided.
     *
     * @example
     * // Static
     * $('#list').each([1, 2, 3], (item) => `<li>${item}</li>`)
     *
     * // Store with key
     * $('#list').each(store, 'items', (item) => `<li>${item.name}</li>`, (item) => item.id)
     *
     * // Store with function
     * $('#list').each(store, (s) => s.items, (item) => `<li>${item.name}</li>`, (item) => item.id)
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    each(
        source: TSource | any[],
        keyOrFn: TKeyOrFn | TTemplateFn,
        templateFn?: TTemplateFn,
        uniquekeyFn?: TUniqueKeyFn,
    ): I$ApiMethods;

    /**
     * Set the value of an input element and optionally listen for changes.
     * If `_value` is a function, it will be called to get the initial value.
     *
     * @param _value - the initial value as a {@link TPrimitive}, or a function returning one
     * @param [onChangeFn] - fired on `'input'` event, receives the new string value and the event
     *
     * @example
     * $('#input').val('hello')
     * $('#input').val(() => getDefaultValue())
     * $('#input').val('hello', (v, e) => console.log(v))
     * $('#input').val(() => store.getState().name, (v) => store.setState({ name: v }))
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    val(
        _value: TPrimitive | (() => TPrimitive),
        onChangeFn?: (v: string, e: Event) => void,
    ): I$ApiMethods;

    /**
     * Set the `checked` state of a checkbox or radio input.
     * If source is a {@link IStore}, it will be reactive.
     *
     * @param source - a {@link IStore}, a static boolean, or a function returning either
     * @param [keyOrFn] - a top-level state key string or a fn.
     *                    ⚠️ String shorthand only accesses **top-level** keys — `'isChecked'` maps to `state.isChecked`.
     *                    For nested state, always use a fn: `(s) => s.user.isChecked`
     * $('#checkbox').checked(store, 'isChecked')
     * $('#checkbox').checked(store, (s) => s.isChecked)
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    checked(source: TSource, keyOrFn?: TKeyOrFn): I$ApiMethods;

    /**
     * Set a boolean attribute on the element(s) via the DOM property (`el[attr] = !!v`).
     * This is the correct way to toggle boolean attributes like `disabled`, `readonly`, `required`, etc.
     * since it respects falsy values — unlike `setAttribute` which treats any string as truthy.
     *
     * If source is a {@link IStore}, it will be reactive.
     *
     * @param propName - the boolean attribute name e.g. `'disabled'`, or a {@link TStringOrFn} returning it
     * @param source - a {@link IStore}, a static boolean, or a function returning either
     * @param [keyOrFn] - a top-level state key string or a fn.
     *                    ⚠️ String shorthand only accesses **top-level** keys — `'isDisabled'` maps to `state.isDisabled`.
     *                    For nested state, always use a fn: `(s) => s.user.isDisabled`
     *
     * @example
     * $('#btn').booleanAttr('disabled', true)
     * $('#btn').booleanAttr('disabled', store, 'isDisabled')              // top-level key shorthand
     * $('#btn').booleanAttr('readonly', store, (s) => s.isReadonly)       // fn
     * $('#btn').booleanAttr('disabled', store, (s) => s.user.isDisabled)  // nested — must use fn
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    booleanAttr(propName: TStringOrFn, source: TSource, keyOrFn?: TKeyOrFn): I$ApiMethods;

    /**
     * Focus the element when the source is truthy. If source is a {@link IStore}, it will be reactive.
     *
     * @param [source] - a {@link IStore}, a static boolean, or a function returning either. Defaults to `true`.
     * @param [keyOrFn] - a top-level state key string or a fn.
     *                    ⚠️ String shorthand only accesses **top-level** keys — `'shouldFocus'` maps to `state.shouldFocus`.
     *                    For nested state, always use a fn: `(s) => s.user.shouldFocus`
     * $('#input').focus(store, 'shouldFocus')
     * $('#input').focus(store, (s) => s.shouldFocus)
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    focus(source?: TSource, keyOrFn?: TKeyOrFn): I$ApiMethods;

    /**
     * Find the first matching child element and return a new {@link I$ApiMethods} scoped to it.
     * Throws if no element is found.
     *
     * @param selector - a CSS selector to search within the element
     * @param [callbackFn] - optional callback that receives the scoped {@link I$ApiMethods} for the found element
     *
     * @example
     * $('#parent').find('.child')
     * $('#parent').find('.child', ($child) => $child.text('hello'))
     * const { el } = $('#parent').find('.child')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining, with `.el` pointing to the found element.
     */
    find(
        selector: string,
        callbackFn?: (api: I$ApiMethods) => void,
    ): I$ApiMethods & { el: Element | null };

    /**
     * Find all matching child elements and return a new {@link I$ApiMethods} scoped to them.
     * Throws if no elements are found.
     *
     * @param selector - a CSS selector to search within the element
     * @param [callbackFn] - optional callback that receives the `NodeList` of found elements
     *
     * @example
     * $('#parent').findAll('.item')
     * $('#parent').findAll('.item', (els) => console.log(els.length))
     * const { els } = $('#parent').findAll('.item')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining, with `.els` pointing to the found elements.
     */
    findAll(
        selector: string,
        callbackFn?: (els: NodeList) => void,
    ): I$ApiMethods & { els: NodeList };

    // ── DOM Manipulation ──────────────────────────────────────────────────────

    /**
     * Append one or more targets as the last child of the element(s).
     * Accepts a {@link TDomTarget} — a `$` instance, a raw `Node`, or an HTML string.
     * Multiple targets are appended in the order provided.
     *
     * @param targets - one or more {@link TDomTarget} values to append
     *
     * @example
     * $('#list').append($('<li>item</li>'))
     * $('#list').append('<li>item</li>')
     * $('#list').append(rawNode)
     * $('#list').append($item1, $item2, $item3)   // multiple
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    append(...targets: TDomTarget[]): I$ApiMethods;

    /**
     * Insert one or more targets as the first child of the element(s).
     * Accepts a {@link TDomTarget} — a `$` instance, a raw `Node`, or an HTML string.
     * Multiple targets are inserted maintaining their relative order.
     *
     * @param targets - one or more {@link TDomTarget} values to prepend
     *
     * @example
     * $('#list').prepend($('<li>first</li>'))
     * $('#list').prepend('<li>first</li>')
     * $('#list').prepend($item1, $item2)   // both land before existing children, in order
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    prepend(...targets: TDomTarget[]): I$ApiMethods;

    /**
     * Insert one or more targets as siblings immediately before the element(s) in the DOM.
     * Unlike {@link I$ApiMethods.prepend}, this inserts *outside* the element — not inside.
     *
     * @param targets - one or more {@link TDomTarget} values to insert before
     *
     * @example
     * $('#item2').before($('#item1'))
     * $('#item2').before('<li>injected</li>')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    before(...targets: TDomTarget[]): I$ApiMethods;

    /**
     * Insert one or more targets as siblings immediately after the element(s) in the DOM.
     * Unlike {@link I$ApiMethods.append}, this inserts *outside* the element — not inside.
     *
     * @param targets - one or more {@link TDomTarget} values to insert after
     *
     * @example
     * $('#item1').after($('#item2'))
     * $('#item1').after('<li>injected</li>')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    after(...targets: TDomTarget[]): I$ApiMethods;

    /**
     * Remove the element(s) from the DOM entirely.
     * Complement of {@link I$ApiMethods.append} — no target needed.
     *
     * @example
     * $('#modal').remove()
     * $(card).remove()   // raw node wrapped in $
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    remove(): I$ApiMethods;

    /**
     * Replace the element(s) in the DOM with a new {@link TDomTarget}.
     * The replacement takes the element's exact position in the parent.
     *
     * @param target - a {@link TDomTarget} to swap in — `$` instance, raw `Node`, or HTML string
     *
     * @example
     * $('#old').replaceWith($('<div class="new">replacement</div>'))
     * $('#old').replaceWith('<div>replacement</div>')
     *
     * @returns The same {@link I$ApiMethods} instance for chaining.
     */
    replaceWith(target: TDomTarget): I$ApiMethods;

    /**
     * Deep-clone the element and return a new chainable {@link I$ApiMethodWithSingleElement}.
     * The clone is detached — append it wherever needed.
     *
     * @param [deep=true] - when `true` (default) the entire subtree is cloned, including children.
     *                      Pass `false` for a shallow clone of the element only.
     *
     * @example
     * const copy = $('#card').clone()
     * $('#container').append(copy)
     *
     * // shallow clone — no children
     * const shell = $('#card').clone(false)
     *
     * @returns A new {@link I$ApiMethodWithSingleElement} wrapping the cloned node.
     */
    clone(deep?: boolean): I$ApiMethodWithSingleElement;
}

/**
 * Returned when {@link $} is called with a single selector — `.el` is guaranteed to exist.
 */
export interface I$ApiMethodWithSingleElement extends I$ApiMethods {
    /** The resolved DOM element for this `$` instance. */
    readonly el: Element | Document | null;
}

/**
 * Returned when {@link $} is called with an array of selectors.
 * `.els` holds all matched elements in document order.
 */
export interface I$ApiMethodWithMultiElement extends I$ApiMethods {
    /** The resolved DOM elements for this `$` instance. */
    readonly els: Element[];
}

// ── $ ─────────────────────────────────────────────────────────────────────────
// ── $ ─────────────────────────────────────────────────────────────────────────
/**
 * Select one or more DOM elements and return a chainable {@link I$ApiMethods} api.
 *
 * - Single selector → returns {@link I$ApiMethodWithSingleElement} (`.el` available)
 * - Array of selectors → returns {@link I$ApiMethodWithMultiElement} (`.els` available)
 *
 * @param selector - accepts any of the following:
 *                   - Selector string: `'#id'`, `'.class'`, `'div > span'`, `[data-columns="3"]` etc.
 *                   - HTML string starting with `<` to create a new element: `'<div>'`, `'<button>'`
 *                   - A DOM node: `Element`, `Document`, `Node`, `NodeList`, `HTMLCollection`
 *                   - An object with an `.id` property: `{ id: 'myEl' }` (shorthand for `'#myEl'`)
 *                   - An array of selector strings — returns {@link I$ApiMethodWithMultiElement}
 * @param [props] - {@link TElementProps} — only applies when `selector` starts with `<`.
 *                  Sets attributes, DOM properties, inline styles, and event listeners on the created element.
 *
 * @example
 * // Selector strings
 * $('#el').text('hello')
 * $('input[type="text"]').val('hello')
 *
 * // DOM node
 * $(document).on('click', handler)
 * $(domNode).addClass('active')
 *
 * // Object with id
 * $({ id: 'myEl' }).text('hello')
 *
 * // Multiple selectors
 * $(['#a', '#b']).on('click', handler)
 *
 * // Element creation — HTML string + props
 * $('<div>')
 * $('<button>', { class: 'btn', type: 'submit', click: () => console.log('clicked') })
 * $('<input>',  { type: 'text', value: 'hello', style: { color: 'red' } })
 *
 * @returns {@link I$ApiMethodWithSingleElement} or {@link I$ApiMethodWithMultiElement} depending on the selector type.
 */
// Element creation — selector is an HTML string starting with '<'
export function $(selector: `<${string}>`, props?: TElementProps): I$ApiMethodWithSingleElement;
// Selector string, object with .id, or DOM node
export function $(
    selector: string | Element | Document | Node | NodeList | HTMLCollection | { id: string },
    props?: TElementProps,
): I$ApiMethodWithSingleElement;
// Array of selector strings
export function $(selector: string[], props?: TElementProps): I$ApiMethodWithMultiElement;

// ── createStore ───────────────────────────────────────────────────────────────
/**
 * Create a reactive {@link IStore}.
 * The store is a Proxy — you can read state keys directly (e.g. `store.count`)
 * and set them directly (e.g. `store.count = 1`) in addition to using `getState()`/`setState()`.
 *
 * In `__DEV__` mode the store is registered in `window.__kor_stores` and exposes
 * additional dev-only methods via {@link IStoreDevMethods}. These are NOT available in production.
 *
 * @param initial - the initial state object
 * @param [name] - optional name shown in devtools. Auto-assigned if omitted (e.g. `store_1`)
 *
 * @example
 * const store = createStore({ count: 0 }, 'counter')
 * store.setState({ count: 1 })
 * store.getState()  // { count: 1 }
 * store.count       // 1  — Proxy forwards property reads to state
 * store.count = 2   // — Proxy forwards property writes to setState
 *
 * @returns An {@link IStore} combined with `Partial<`{@link IStoreDevMethods}`>`.
 */
export function createStore<T extends object>(
    initial: T,
    name?: string,
): IStore<T> & Partial<IStoreDevMethods>;

// ── computed ──────────────────────────────────────────────────────────────────

/**
 * Create a derived read-only {@link IStore} that recomputes whenever its source store(s) change.
 * Fully compatible with all {@link $} binding methods — satisfies `isStore()`.
 *
 * The computed store is a Proxy — you can read derived value keys directly
 * (e.g. `upper.value`) without calling `getState()`.
 *
 * In `__DEV__` mode the computed store is registered in `window.__kor_stores` with
 * `isComputed: true` and exposes dev-only methods via {@link IComputedStoreDevMethods}.
 * These are NOT available in production.
 *
 * ⚠️ The fn must be pure — never call `setState()` inside it.
 * In `__DEV__` a circular update is detected and thrown. In prod it is also thrown.
 *
 * @param sources - one {@link IStore} or an array of {@link IStore}s to derive from
 * @param keyOrFn - a top-level state key string or a fn.
 *                  For multiple stores the fn receives one state arg per store.
 *
 * @example
 * // Single store, key shorthand
 * const upper = computed(textStore, 'value')
 * $('#el').text(upper)
 * console.log(upper.value)
 *
 * // Single store, fn
 * const full = computed(userStore, (s) => s.first + ' ' + s.last)
 * $('#el').text(full)
 *
 * // Multiple stores
 * const summary = computed([userStore, cartStore], (user, cart) => ({
 *     label: user.name,
 *     total: cart.total,
 * }))
 * $('#el').text(summary, 'label')
 * console.log(summary.label)
 *
 * @returns An {@link IStore} combined with `Partial<`{@link IComputedStoreDevMethods}`>`.
 */
// ✅ after
export function computed<R extends object = any>(
    sources: IStore | IStore[],
    keyOrFn: string | ((...states: any[]) => R),
): IStore<R> & Partial<IComputedStoreDevMethods>;

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type SerializeMode = 'json' | 'params' | 'form';

export interface IResource<T> {
    readonly data: T | null;
    readonly loading: boolean;
    readonly error: string | null;
    readonly status: number | null;
    /** Manually trigger the fetch (used with `lazy: true`). */
    fetch(): Promise<void>;
    /** Abort the in-flight request. */
    abort(): void;
}

export interface IResourceOptions<T> {
    /**
     * HTTP method to use.
     * @default 'GET'
     */
    method?: HttpMethod;

    /**
     * Additional request headers merged with any defaults.
     * @example { 'Authorization': 'Bearer token123' }
     */
    headers?: Record<string, string>;

    /**
     * Request body. Can be a plain object, a `FormData` instance, or any
     * serialisable value. How it is encoded depends on {@link IResourceOptions.serialize}.
     *
     * @example { title: 'Hello', content: 'World' }
     * @example new FormData(formElement)
     */
    body?: unknown;

    /**
     * Controls how a plain-object {@link IResourceOptions.body} is encoded before sending.
     *
     * - `'json'`   → `JSON.stringify(body)` + `Content-Type: application/json`
     * - `'params'` → `URLSearchParams(body)` + `Content-Type: application/x-www-form-urlencoded`
     * - `'form'`   → `new FormData()` built from object entries — no `Content-Type` set manually
     *                (the browser adds it with the correct multipart boundary). Useful when you
     *                want to send a plain object as multipart without constructing `FormData` yourself.
     *
     * Omit when passing a `FormData` instance directly as {@link IResourceOptions.body}.
     *
     * @example 'json'
     * @example 'params'
     * @example 'form'
     */
    serialize?: SerializeMode;

    /**
     * Query-string parameters appended to the URL.
     * @example { page: 1, limit: 10 }  // → /api/posts?page=1&limit=10
     */
    params?: Record<string, string | number | boolean>;

    /**
     * When `true`, the fetch is not triggered automatically on creation.
     * Call {@link IResource.fetch} manually when needed.
     * @default false
     * @example
     * const req = resource('/api/posts', { lazy: true, onData: v => console.log(v) })
     * req.fetch() // trigger on button click, etc.
     */
    lazy?: boolean;

    /**
     * Called with the parsed response body when the request succeeds.
     * @param data - The deserialised response payload.
     * @example onData: data => store.setState({ posts: data })
     */
    onData?: (data: T) => void;

    /**
     * Called with `true` when the request starts and `false` when it settles.
     * Mirrors {@link IResource.loading}.
     * @param loading - Whether a request is currently in-flight.
     * @example onLoading: loading => store.setState({ loading })
     */
    onLoading?: (loading: boolean) => void;

    /**
     * Called with an error message when the request fails, or `null` on success.
     * Mirrors {@link IResource.error}.
     * @param error - The error message, or `null` when cleared.
     * @example onError: err => store.setState({ error: err })
     */
    onError?: (error: string | null) => void;

    /**
     * Called with the raw HTTP status code after every response.
     * Mirrors {@link IResource.status}.
     * @param status - e.g. `200`, `404`, `500`.
     * @example onStatus: status => console.log('HTTP', status)
     */
    onStatus?: (status: number) => void;

    /**
     * Called with the raw `Response` object for full low-level access.
     * @param response - The native Fetch API `Response`.
     * @example onResponse: res => console.log(res.headers.get('X-Request-Id'))
     */
    onResponse?: (response: Response) => void;
}

// ─── resource() ───────────────────────────────────────────────────────────────

/**
 * Create a fetch resource.
 *
 * Returns an {@link IResource} with `data`, `loading`, `error`, `status`,
 * `fetch()`, and `abort()`. Callbacks (`onData`, `onLoading`, …) fire
 * alongside the return values and are the primary way to integrate with
 * a {@link IStore}.
 *
 * @typeParam T - Shape of the expected response payload.
 *
 * @param url     - Endpoint to request.
 * @param options - {@link IResourceOptions} — method, body, params, callbacks, …
 * @returns       An {@link IResource} handle — starts immediately unless {@link IResourceOptions.lazy} is `true`.
 *
 * ---
 *
 * **Basic — read return values**
 * ```ts
 * const { data, error, loading, status } = await resource<Post[]>('/api/posts')
 * // data / error / loading / status are plain values, not reactive.
 * ```
 *
 * ---
 *
 * **Wire to a store**
 * ```ts
 * const api = createStore({ data: null, loading: false, error: null })
 *
 * resource<Post[]>('/api/posts', {
 *   onData:    v => api.setState({ data: v }),
 *   onLoading: v => api.setState({ loading: v }),
 *   onError:   v => api.setState({ error: v }),
 * })
 *
 * $('#list').each(api, 'data', item => raw`<li>${item.name}</li>`, i => i.id)
 * $('#spinner').show(api, 'loading')
 * $('#error').text(api, 'error')
 * ```
 *
 * ---
 *
 * **GET with query params**
 * ```ts
 * resource<Post[]>('/api/posts', {
 *   params: { page: 1, limit: 10 },      // → /api/posts?page=1&limit=10
 *   onData: v => api.setState({ data: v }),
 * })
 * ```
 *
 * ---
 *
 * **POST — JSON body**
 * ```ts
 * resource<Post>('/api/posts', {
 *   method:    'POST',
 *   serialize: 'json',
 *   body:      { title: 'Hello', content: 'World' },
 *   onData:    v => api.setState({ data: v }),
 * })
 * ```
 *
 * ---
 *
 * **POST — URL-encoded body**
 * ```ts
 * resource<Session>('/api/login', {
 *   method:    'POST',
 *   serialize: 'params',
 *   body:      { username: 'jay', password: '1234' },
 *   onData:    v => api.setState({ data: v }),
 * })
 * ```
 *
 * ---
 *
 * **POST — FormData (file upload)**
 * ```ts
 * const form = new FormData(formEl)
 *
 * resource<UploadResult>('/api/upload', {
 *   method: 'POST',
 *   body:   form,         // FormData — do NOT set serialize
 *   onData: v => api.setState({ data: v }),
 * })
 * ```
 *
 * ---
 *
 * **POST — `serialize: 'form'`** — plain object → FormData automatically
 * ```ts
 * resource<UploadResult>('/api/upload', {
 *   method:    'POST',
 *   serialize: 'form',
 *   body:      { name: 'avatar', file: fileInput.files[0] },
 *   onData:    v => api.setState({ data: v }),
 * })
 * ```
 *
 * ---
 *
 * **Lazy fetch** — trigger manually, e.g. on a button click
 * ```ts
 * const req = resource<Post[]>('/api/posts', {
 *   lazy:   true,
 *   onData: v => api.setState({ data: v }),
 * })
 *
 * req.fetch()   // call whenever you're ready
 * ```
 *
 * ---
 *
 * **Refetch on store change**
 * ```ts
 * const filters = createStore({ page: 1, q: '' })
 *
 * filters.subscribe(s => {
 *   resource<Post[]>('/api/posts', {
 *     params: { page: s.page, q: s.q },
 *     onData: v => api.setState({ data: v }),
 *   })
 * })
 * ```
 *
 * ---
 *
 * **Abort an in-flight request**
 * ```ts
 * const req = resource<Post[]>('/api/posts', {
 *   onData: v => api.setState({ data: v }),
 * })
 *
 * req.abort()
 * ```
 */
export function resource<T>(url: string, options?: IResourceOptions<T>): IResource<T>;

/**
 * Run a function when the DOM is ready.
 * If the document is already past `'loading'`, `fn` is called immediately.
 * Otherwise waits for `DOMContentLoaded`.
 *
 * @param fn - the function to run
 *
 * @example
 * ready(() => {
 *   $('#app').text('hello')
 * })
 */
export function ready(fn: () => void): void;

/**
 * Run a function when the document reaches a specific ready state.
 * If the document is already at that state, `fn` is called immediately.
 * Otherwise waits for `readystatechange`.
 *
 * @param state - `'loading'` | `'interactive'` | `'complete'`
 * @param fn    - the function to run
 *
 * ⚠️ `'loading'` is only reachable from an inline `<script>` in `<head>`.
 * Module scripts (`type="module"`) and deferred scripts are always executed
 * after the DOM is parsed — by then `'loading'` is already past.
 *
 * @example
 * onDomReadyState('loading', () => { ... })     // inline <script> in <head> only
 * onDomReadyState('interactive', () => { ... }) // DOM ready, subresources may still be loading
 * onDomReadyState('complete', () => { ... })    // everything including images is loaded
 */
export function onDomReadyState(
    state: 'loading' | 'interactive' | 'complete',
    fn: () => void,
): void;

// ── meta ──────────────────────────────────────────────────────────────────────

/**
 * Reactive document `<head>` helpers — set title, meta tags, OG tags, and
 * canonical URL. All methods accept a static value or a {@link IStore} for
 * reactive updates that re-run automatically on every `setState()`.
 *
 * @example
 * import { meta } from 'koribot-js'
 *
 * // static
 * meta.title('My Page')
 * meta.description('A great page')
 * meta.og('og:image', 'https://example.com/og.png')
 * meta.canonical('https://example.com/page')
 *
 * // reactive — updates whenever store changes
 * meta.title(store, 'pageTitle')
 * meta.description(store, (s) => s.description)
 * meta.og('og:title', store, 'title')
 */
export declare const meta: {
    /**
     * Set `document.title`. Accepts a static value or a {@link IStore}.
     *
     * @param storeOrVal - A static string or a {@link IStore}.
     * @param [keyOrFn]  - State key or selector fn — required when `storeOrVal` is a store.
     *
     * @example
     * meta.title('My Page')
     * meta.title(store, 'pageTitle')
     * meta.title(store, (s) => `${s.name} — My App`)
     */
    title(storeOrVal: string | IStore, keyOrFn?: TKeyOrFn): void;

    /**
     * Set the `<meta name="description">` tag. Creates the tag if it doesn't exist.
     *
     * @param storeOrVal - A static string or a {@link IStore}.
     * @param [keyOrFn]  - State key or selector fn — required when `storeOrVal` is a store.
     *
     * @example
     * meta.description('A great page')
     * meta.description(store, 'description')
     */
    description(storeOrVal: string | IStore, keyOrFn?: TKeyOrFn): void;

    /**
     * Set an Open Graph `<meta property="og:...">` tag. Creates the tag if it doesn't exist.
     *
     * @param property   - The OG property e.g. `'og:title'`, `'og:description'`, `'og:image'`.
     * @param storeOrVal - A static string or a {@link IStore}.
     * @param [keyOrFn]  - State key or selector fn — required when `storeOrVal` is a store.
     *
     * @example
     * meta.og('og:title', 'My Page')
     * meta.og('og:image', store, 'ogImage')
     * meta.og('og:description', store, (s) => s.description)
     */
    og(property: string, storeOrVal: string | IStore, keyOrFn?: TKeyOrFn): void;

    /**
     * Set any named `<meta name="...">` tag. Creates the tag if it doesn't exist.
     * Use for tags not covered by the other helpers — e.g. `'robots'`, `'author'`, `'theme-color'`.
     *
     * @param name       - The meta `name` attribute e.g. `'robots'`, `'author'`.
     * @param storeOrVal - A static string or a {@link IStore}.
     * @param [keyOrFn]  - State key or selector fn — required when `storeOrVal` is a store.
     *
     * @example
     * meta.set('robots', 'noindex')
     * meta.set('theme-color', store, 'themeColor')
     */
    set(name: string, storeOrVal: string | IStore, keyOrFn?: TKeyOrFn): void;

    /**
     * Set the `<link rel="canonical">` URL. Creates the tag if it doesn't exist.
     *
     * @param url - The canonical URL string.
     *
     * @example
     * meta.canonical('https://example.com/page')
     */
    canonical(url: string): void;
};
