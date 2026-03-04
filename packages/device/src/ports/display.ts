export type DisplayPort = {
  setBrightness(percent: number): Promise<void>;
  setOrientation?(orientation: "landscape" | "portrait"): Promise<void>;
};
