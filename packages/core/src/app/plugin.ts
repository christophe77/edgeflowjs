import type { EdgeflowContext } from "./createEdgeflowApp.js";

export type EdgeflowPlugin = {
  name: string;
  start(ctx: EdgeflowContext): Promise<void>;
  stop?(ctx: EdgeflowContext): Promise<void>;
};
