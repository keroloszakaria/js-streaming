import * as vue from 'vue';
import { A as AnyOptions, L as ListenerMap, a as StreamStatus, S as StreamAPI } from '../types-Djb2TFwW.cjs';

declare function useStream(opts: AnyOptions): {
    stream: vue.Ref<{
        open: () => Promise<void>;
        close: () => Promise<void>;
        send: (data: unknown) => void;
        on: <T extends keyof ListenerMap>(evt: T, cb: (...args: ListenerMap[T]) => void) => () => void;
        off: <T extends keyof ListenerMap>(evt: T, cb: (...args: ListenerMap[T]) => void) => void;
        readonly state: {
            readonly status: StreamStatus;
            readonly retries: number;
        };
    } | null, StreamAPI | {
        open: () => Promise<void>;
        close: () => Promise<void>;
        send: (data: unknown) => void;
        on: <T extends keyof ListenerMap>(evt: T, cb: (...args: ListenerMap[T]) => void) => () => void;
        off: <T extends keyof ListenerMap>(evt: T, cb: (...args: ListenerMap[T]) => void) => void;
        readonly state: {
            readonly status: StreamStatus;
            readonly retries: number;
        };
    } | null>;
    status: vue.Ref<StreamStatus, StreamStatus>;
    messages: vue.Ref<any[], any[]>;
};

export { useStream };
