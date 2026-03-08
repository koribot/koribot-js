# koribot-js

A small frontend utility library for JavaScript inspired by jQuery to manipulate the DOM with a built-in reactive store.

# Features

- Built-in reactive object-based store
- Computed (derived) stores
- Dev tools for visualizing stores, bound events, network requests, and page metadata
- Automatic binding of Dom api to store for reactivity

# How to Build

- run

    ```js
     npm install

     // this will install esbuild
    ```

    then

    ```js
     npm run build

     // the build-output will be on koribot-js/dist
    ```

# How to use

```js
<script type="module">
  import { $ } from 'https://cdn.jsdelivr.net/npm/koribot-js@latest/+esm'
</script>

// if it does not work do
<script type="module">
  import { $ } from 'https://cdn.jsdelivr.net/npm/koribot-js@latest/dist/koribot-js.js'
</script>
```

or

```js
 npm install koribot-js
```

```js
//sample
import { $ } from 'koribot-js';

$('body').html('Hello')


//or with dev-tools
import { $ } from 'koribot-js/dev';
$('non-existing-selector')
// this will have an error UI
```

# APIs

## DOM

- `$(selector, props={})` — select or create elements, returns a chainable API
    - `.on(eventName, handler)` — attach event listener
    - `.off(eventName, handler)` — remove event listener
    - `.text(source, keyOrFn)` — set text content
    - `.html(source, keyOrTemplateFn)` — set inner HTML
    - `.attr(attrName, source, keyOrFn)` — set attribute
    - `.removeAttr(attrName)` — remove attribute
    - `.cls(className, source, keyOrFn)` — toggle class
    - `.addClass(className, source, keyOrFn, conditionFn)` — add class
    - `.removeClass(className)` — remove class
    - `.style(cssProp, source, keyOrFn)` — set inline CSS property
    - `.show(source, keyOrFn)` — toggle visibility
    - `.hide()` — set display none
    - `.if(source, keyOrFn, templateFn)` — conditionally render a template
    - `.when(source, keyOrFn, branches)` — two-branch conditional render
    - `.each(source, keyOrFn, templateFn, uniquekeyFn)` — render a list
    - `.val(_value, onChangeFn)` — set input value + optional onChange callback
    - `.checked(source, keyOrFn)` — set checkbox checked state
    - `.booleanAttr(propName, source, keyOrFn)` — set boolean DOM property
    - `.focus(source = true, keyOrFn)` — focus element
    - `.append(...targets)` — append child
    - `.prepend(...targets)` — prepend child
    - `.before(...targets)` — insert sibling before
    - `.after(...targets)` — insert sibling after
    - `.remove()` — remove element from DOM
    - `.replaceWith(target)` — replace element with another
    - `.clone(deep = true)` — deep clone element
    - `.find(_selector, callbackFn, options)` — scoped querySelector
    - `.findAll(_selector, callbackFn, options)` — scoped querySelectorAll
    - `.el` — raw DOM element
    - `.els` — raw DOM elements

## Store

- `createStore(initialState, name?)` — create a reactive store
    - `.getState()` — get current state
    - `.setState()` — update state (partial object or updater fn)
    - `.subscribe()` — manually subscribe to state changes
- `computed(store, fn)` — derive a read-only store from one or more stores

## HTML

- `raw\`\``— tagged template literal that marks a string as trusted HTML, bypassing sanitization.
    Use it when you own the content. Plain strings passed to`.html()`, `.if()`, `.when()`,
    and `.each()` are always sanitized first internally.

## Meta

- `meta.title()` — set document title (static or reactive)
- `meta.description()` — set meta description (static or reactive)
- `meta.og()` — set Open Graph tag (static or reactive)
- `meta.set()` — set any named meta tag (static or reactive)
- `meta.canonical()` — set canonical URL

## Network

- `resource(url, options?)` — fetch wrapper returning loading/data/error/status handles

## Utilities

- `ready(fn)` — run fn when DOM is ready
- `onDomReadyState(state, fn)` — run fn when document reaches a specific ready state

# Output

- `koribot-js.js` — minified, production build
- `koribot-js.dev.js` — development build with devtools, error overlay, and runtime warnings/errors
- `koribot-js.dev.js.map`

# Note

- This is an experiment and learning project
- All suggestion, PR and criticism are welcome
- I use AI to help me build it

# Plans

- add animate effect
- more useful public api
- improve input/html sanitizer
- maybe add gzip or brotli file on production version
