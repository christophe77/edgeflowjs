import { tsupBase } from "../../configs/tsup/tsup.base";
import { defineConfig } from "tsup";

export default defineConfig({
  ...tsupBase,
  entry: ["src/index.ts"],
  external: ["onoff", "serialport"],
});
