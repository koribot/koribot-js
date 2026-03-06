# kore-js

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

     // the build-output will be on kore-js/dist
    ```

# APIs

## DOM

- `$()` — select or create elements, returns a chainable API
    - `.on()` — attach event listener
    - `.off()` — remove event listener
    - `.text()` — set text content (static or reactive)
    - `.html()` — set inner HTML (static or reactive)
    - `.attr()` — set attribute (static or reactive)
    - `.removeAttr()` — remove attribute
    - `.cls()` — toggle class (static or reactive)
    - `.addClass()` — add class
    - `.removeClass()` — remove class
    - `.style()` — set inline CSS property (static or reactive)
    - `.show()` — toggle visibility (static or reactive)
    - `.hide()` — set display none
    - `.if()` — conditionally render a template (reactive)
    - `.when()` — two-branch conditional render (reactive)
    - `.each()` — render a reactive list with LIS diffing
    - `.val()` — set input value + optional onChange callback
    - `.checked()` — set checkbox checked state (static or reactive)
    - `.booleanAttr()` — set boolean DOM property (static or reactive)
    - `.focus()` — programmatically focus element
    - `.append()` — append child(ren)
    - `.prepend()` — prepend child(ren)
    - `.before()` — insert sibling before
    - `.after()` — insert sibling after
    - `.remove()` — remove element from DOM
    - `.replaceWith()` — replace element with another
    - `.clone()` — deep clone element
    - `.find()` — scoped querySelector
    - `.findAll()` — scoped querySelectorAll
    - `.el` — raw DOM element (single selector)
    - `.els` — raw DOM elements (array selector)

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

## Scope (SPA — not yet active)

- `createScope()` — create a cleanup scope
- `withScope()` — run a function inside a scope
- `registerCleanup()` — register a cleanup function with the active scope

## Utilities

- `ready(fn)` — run fn when DOM is ready
- `onDomReadyState(state, fn)` — run fn when document reaches a specific ready state

# Output

- `kore-js.js` — minified, production build
- `kore-js.dev.js` — development build with devtools, error overlay, and runtime warnings/errors

# Note

- This is an experiment and learning project
- All suggestion, PR and criticism are welcome
- I use AI to help me build it

# Plans

- add animate effect
- more useful public api
- improve input/html sanitizer
- maybe add gzip or brotli file on production version
