import { tsupBase } from "../../configs/tsup/tsup.base";
import { defineConfig } from "tsup";

export default defineConfig({
  ...tsupBase,
  entry: { index: "src/index.ts", client: "src/client.ts" },
});
