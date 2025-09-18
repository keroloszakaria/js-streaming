import { createStream, StreamStatus, ListenerMap, StreamState } from '../index.js';
import * as vue from 'vue';
import * as _vue_reactivity from '@vue/reactivity';

declare function useStream<T = unknown>(opts: Parameters<typeof createStream>[0]): {
    messages: vue.Ref<_vue_reactivity.UnwrapRefSimple<T>[], T[] | _vue_reactivity.UnwrapRefSimple<T>[]>;
    status: vue.Ref<StreamStatus, StreamStatus>;
    error: vue.Ref<Error | null, Error | null>;
    isOpen: vue.Ref<boolean, boolean>;
    open(): Promise<void>;
    close(): Promise<void>;
    send?(data: unknown): void;
    on<T_1 extends keyof ListenerMap>(evt: T_1, cb: ListenerMap[T_1][number]): () => void;
    off<T_1 extends keyof ListenerMap>(evt: T_1, cb: ListenerMap[T_1][number]): void;
    state: Readonly<StreamState>;
};

export { useStream };
