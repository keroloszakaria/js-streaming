import { A as AnyOptions, S as StreamAPI, a as StreamStatus } from '../types-DjihEgEp.cjs';

declare function useStream(opts: AnyOptions): {
    stream: StreamAPI | null;
    status: StreamStatus;
    messages: any[];
};

export { useStream };
