import { A as AnyOptions, S as StreamAPI, a as StreamStatus } from '../types-Djb2TFwW.cjs';

declare function useStream(opts: AnyOptions): {
    stream: StreamAPI | null;
    status: StreamStatus;
    messages: any[];
};

export { useStream };
