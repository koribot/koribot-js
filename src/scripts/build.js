// build.js
// Bundles kore-js/index.js → korjs/korjs.js using esbuild.

import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.argv.includes("--prod");

// ── Devtools stub plugin ──────────────────────────────────────────────────────
//
// esbuild does NOT tree-shake dynamic import() calls even when they're inside
// a dead `if (false)` block — it still analyzes and bundles the target modules.
// This plugin intercepts all devtools/error-overlay imports in prod and replaces
// them with an empty stub so they are never included in the production bundle.
//
const stubDevtoolsPlugin = {
  name: "stub-devtools",
  setup(build) {
    build.onResolve(
      { filter: /devtools|error-overlay/ },
      (args) => ({ path: args.path, namespace: "devtools-stub" }),
    );
    build.onLoad(
      { filter: /.*/, namespace: "devtools-stub" },
      () => ({
        // Export every name that any runtime file statically imports from
        // devtools or error-overlay modules. esbuild requires named exports
        // to exist in the stub or it throws "No matching export".
        contents: `
          export const reportError       = null
          export const closeErrorOverlay = () => {}
          export const mountDevtools     = () => {}
          export const initStoresPanel   = () => {}
          export const initEventsPanel   = () => {}
          export const initNetworkPanel  = () => {}
          export const initPagePanel     = () => {}
          export default {}
        `,
        loader: "js",
      }),
    );
  },
};

// ── 1. Bundle ────────────────────────────────────────────────────────────────
await build({
  entryPoints: [join(__dirname, "../core/index.js")],
//   outfile: join(__dirname, "../../../kore-testing/node_modules/kore-js/dist/kore-js.js"),
  outfile: join(__dirname, "../../kore-js/dist/kore-js.js"),
  bundle: true,
  format: "esm",
  minify: isProd,
  sourcemap: !isProd,
  target: ["es2022"],
  define: {
    "process.env.NODE_ENV": isProd ? '"production"' : '"development"',
    __DEV__: isProd ? "false" : "true",
  },
  // In prod: strip console/debugger and stub out all devtools modules.
  // In dev: keep everything — devtools, sourcemaps, console logs.
  ...(isProd
    ? { drop: ["console", "debugger"], plugins: [stubDevtoolsPlugin] }
    : {}),
});
console.log("✅ Built kore-js.js");

