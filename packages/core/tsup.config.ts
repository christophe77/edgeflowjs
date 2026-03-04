import { tsupBase } from "../../configs/tsup/tsup.base";
import { defineConfig } from "tsup";

export default defineConfig({
  ...tsupBase,
  entry: ["src/index.ts", "src/run.ts"],
  noExternal: [/@edgeflowjs\//],
  external: ["better-sqlite3", "ws"],
});
