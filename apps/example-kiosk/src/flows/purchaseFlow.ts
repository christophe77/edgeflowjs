// Flow definition reference for the purchase flow (actual def lives in core run.ts)
export const PURCHASE_FLOW_STATES = ["idle", "scan", "action", "thankYou"] as const;
export type PurchaseState = (typeof PURCHASE_FLOW_STATES)[number];
