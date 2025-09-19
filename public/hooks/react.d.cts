import { createStream, StreamStatus, ListenerMap, StreamState } from '../index.cjs';

declare function useStream<T = unknown>(opts: Parameters<typeof createStream>[0]): {
    messages: T[];
    status: StreamStatus;
    error: Error | null;
    isOpen: boolean;
    open(): Promise<void>;
    close(): Promise<void>;
    send?(data: unknown): void;
    on<T_1 extends keyof ListenerMap>(evt: T_1, cb: ListenerMap[T_1][number]): () => void;
    off<T_1 extends keyof ListenerMap>(evt: T_1, cb: ListenerMap[T_1][number]): void;
    state: Readonly<StreamState>;
};

export { useStream };
