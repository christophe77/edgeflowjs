import { defineConfig } from "tsup";

export const tsupBase = defineConfig({
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node18",
});
