import * as esbuild from "esbuild"

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/bundle.js",
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "solid-js",
  platform: "node",
  target: "es2022",
  external: [
    "@opencode-ai/plugin",
    "@opencode-ai/sdk",
    "solid-js",
    "@opentui/core",
    "@opentui/solid",
  ],
  sourcemap: true,
})