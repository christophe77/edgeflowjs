export type Envelope<TType extends string, TPayload> = {
  id: string;
  type: TType;
  ts: number;
  payload: TPayload;
  traceId?: string;
};
