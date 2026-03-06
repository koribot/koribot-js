// build.js
// Bundles kore-js/index.js → korjs/korjs.js using esbuild.
import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// ── 1. Bundle ────────────────────────────────────────────────────────────────
await build({
  entryPoints: [join(__dirname, "../core/index.js")],
  //outfile: join(__dirname, "../../../kore-testing/node_modules/kore-js/dist/kore-js.dev.js"),
  outfile: join(__dirname, "../../kore-js/dist/kore-js.dev.js"),
  bundle: true,
  format: "esm",
  minify: false,
  sourcemap: true,
//   sourcemap: 'inline',
  target: ["es2022"],
  define: {
    "process.env.NODE_ENV": "'development'",
    __DEV__: "true",
  },
});

console.log("✅ Built kore-js.dev.js");
