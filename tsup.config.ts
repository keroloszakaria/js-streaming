import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/hooks/vue.ts", "src/hooks/react.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  outExtension({ format }) {
    return { js: format === "esm" ? ".mjs" : ".cjs" };
  },
});
