// kore-js/resource.js
// Store-friendly fetch wrapper.
// Wire it to your store via callbacks, or use it standalone.

/**
 * @typedef {'json' | 'params' | 'form'} SerializeMode
 *
 * @typedef {Object} ResourceOptions
 * @property {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} [method='GET']
 * @property {Record<string, string>} [headers]
 * @property {any} [body]
 * @property {SerializeMode} [serialize]
 * @property {Record<string, string|number|boolean>} [params]
 * @property {boolean} [lazy=false]
 * @property {(data: any)          => void} [onData]
 * @property {(loading: boolean)   => void} [onLoading]
 * @property {(error: string|null) => void} [onError]
 * @property {(status: number)     => void} [onStatus]
 * @property {(res: Response)      => void} [onResponse]
 */

/**
 * Create a fetch resource.
 *
 * Returns a handle with `data`, `loading`, `error`, `status`, `fetch()`, and
 * `abort()`. Callbacks fire alongside the plain return values and are the
 * primary way to integrate with a store.
 *
 * ---
 *
 * **Basic**
 * ```js
 * resource('/api/posts', {
 *   onData:    data => console.log(data),
 *   onLoading: bool => console.log('loading:', bool),
 *   onError:   err  => console.error(err),
 * })
 * ```
 *
 * **Destructure return values**
 * ```js
 * const { data, error, loading, status } = resource('/api/posts')
 * // Plain values — not reactive. Callbacks fire alongside them.
 * ```
 *
 * **Wire to a store**
 * ```js
 * const api = createStore({ data: null, loading: false, error: null })
 *
 * resource('/api/posts', {
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
 * **GET with query params**
 * ```js
 * resource('/api/posts', {
 *   params: { page: 1, limit: 10 },   // → /api/posts?page=1&limit=10
 *   onData: v => api.setState({ data: v }),
 * })
 * ```
 *
 * **POST — `serialize: 'json'`**
 * ```js
 * resource('/api/posts', {
 *   method:    'POST',
 *   serialize: 'json',
 *   body:      { title: 'Hello', content: 'World' },
 *   onData:    v => api.setState({ data: v }),
 * })
 * ```
 *
 * **POST — `serialize: 'params'`** (URL-encoded)
 * ```js
 * resource('/api/login', {
 *   method:    'POST',
 *   serialize: 'params',
 *   body:      { username: 'jay', password: '1234' },
 *   onData:    v => api.setState({ data: v }),
 * })
 * ```
 *
 * **POST — `serialize: 'form'`** (plain object → FormData automatically)
 * ```js
 * resource('/api/upload', {
 *   method:    'POST',
 *   serialize: 'form',
 *   body:      { name: 'avatar', file: fileInput.files[0] },
 *   onData:    v => api.setState({ data: v }),
 * })
 * ```
 *
 * **POST — raw FormData** (constructed manually from a `<form>` element)
 * ```js
 * const form = new FormData(formEl)
 * resource('/api/upload', {
 *   method: 'POST',
 *   body:   form,   // FormData instance — omit serialize
 *   onData: v => api.setState({ data: v }),
 * })
 * ```
 *
 * **Lazy fetch** — trigger manually, e.g. on button click
 * ```js
 * const req = resource('/api/posts', { lazy: true, onData: v => api.setState({ data: v }) })
 * req.fetch()
 * ```
 *
 * **Refetch on store change**
 * ```js
 * const filters = createStore({ page: 1, q: '' })
 *
 * filters.subscribe(s => {
 *   resource('/api/posts', {
 *     params: { page: s.page, q: s.q },
 *     onData: v => api.setState({ data: v }),
 *   })
 * })
 * ```
 *
 * **Abort an in-flight request**
 * ```js
 * const req = resource('/api/posts', { onData: v => api.setState({ data: v }) })
 * req.abort()
 * ```
 *
 * @param {string}          url
 * @param {ResourceOptions} [options]
 *
 * @returns {{
 *   data:    any,
 *   loading: boolean,
 *   error:   string|null,
 *   status:  number|null,
 *   fetch:   () => Promise<void>,
 *   abort:   () => void,
 * }}
 */
export function resource(url, options = {}) {
  const {
    method    = 'GET',
    headers   = {},
    body      = undefined,
    params    = {},
    serialize = undefined,
    lazy      = false,
    onData    = null,
    onLoading = null,
    onError   = null,
    onStatus  = null,
    onResponse = null,
  } = options;

  let _data    = null;
  let _loading = false;
  let _error   = null;
  let _status  = null;

  let abortController = null;

  const doFetch = async () => {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    _loading = true;
    _error   = null;
    onLoading?.(true);
    onError?.(null);

    const fullUrl = buildUrl(url, params);

    const fetchOpts = {
      method,
      headers: { ...headers },
      signal:  abortController.signal,
    };

    if (body != null && method !== 'GET' && method !== 'HEAD') {
      if (body instanceof FormData) {
        // Browser sets multipart/form-data + boundary automatically.
        // Never set Content-Type manually with FormData.
        fetchOpts.body = body;
      } else if (serialize === 'json') {
        fetchOpts.headers['Content-Type'] = 'application/json';
        fetchOpts.body = JSON.stringify(body);
      } else if (serialize === 'params') {
        fetchOpts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        fetchOpts.body = new URLSearchParams(body).toString();
      } else if (serialize === 'form') {
        // Plain object → FormData. Same as passing FormData directly but
        // without having to construct it manually. Do NOT set Content-Type —
        // the browser adds the multipart boundary automatically.
        const fd = new FormData();
        for (const [key, value] of Object.entries(body)) {
          fd.append(key, value);
        }
        fetchOpts.body = fd;
      } else {
        // Manual — body as-is, caller sets Content-Type via headers.
        fetchOpts.body = body;
      }
    }

    try {
      const res = await fetch(fullUrl, fetchOpts);

      _status = res.status;
      onStatus?.(res.status);
      onResponse?.(res);

      if (!res.ok) {
        const msg = `HTTP ${res.status}: ${res.statusText}`;
        _error = msg;
        onError?.(msg);
        return;
      }

      const contentType = res.headers.get('content-type') ?? '';
      const parsed = contentType.includes('application/json')
        ? await res.json()
        : await res.text();

      _data = parsed;
      onData?.(parsed);
    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err.message ?? String(err);
      _error = msg;
      onError?.(msg);
    } finally {
      _loading = false;
      onLoading?.(false);
    }
  };

  if (!lazy) doFetch();

  return {
    get data()    { return _data;    },
    get loading() { return _loading; },
    get error()   { return _error;   },
    get status()  { return _status;  },
    fetch()     { return doFetch(); },
    abort()  { abortController?.abort(); },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(base, params) {
  if (!params || !Object.keys(params).length) return base;
  const qs = new URLSearchParams(params).toString();
  return base.includes('?') ? `${base}&${qs}` : `${base}?${qs}`;
}