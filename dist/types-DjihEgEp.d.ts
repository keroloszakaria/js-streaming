type StreamStatus = "idle" | "connecting" | "open" | "closed" | "error";
interface StreamState {
    status: StreamStatus;
    retries: number;
}
interface ListenerMap {
    open: [];
    close: [reason?: string];
    error: [Error];
    message: [unknown];
    status: [StreamStatus];
}
interface BaseOptions {
    type: string;
    url: string;
    autoReconnect?: boolean;
    maxRetries?: number;
}
interface WebSocketOptions extends BaseOptions {
    type: "websocket";
}
interface SSEOptions extends BaseOptions {
    type: "sse";
}
interface HTTPStreamOptions extends BaseOptions {
    type: "http";
}
interface LongPollingOptions extends BaseOptions {
    type: "long-polling";
    interval?: number;
}
interface HLSOptions extends BaseOptions {
    type: "hls";
}
interface WebRTCOptions extends BaseOptions {
    type: "webrtc";
}
interface SocketIOOptions extends BaseOptions {
    type: "socketio";
}
type AnyOptions = WebSocketOptions | SSEOptions | HTTPStreamOptions | LongPollingOptions | HLSOptions | WebRTCOptions | SocketIOOptions;
interface StreamAPI {
    open: () => Promise<void>;
    close: () => Promise<void>;
    send: (data: unknown) => void;
    on<T extends keyof ListenerMap>(evt: T, cb: (...args: ListenerMap[T]) => void): () => void;
    off<T extends keyof ListenerMap>(evt: T, cb: (...args: ListenerMap[T]) => void): void;
    readonly state: Readonly<StreamState>;
}

export type { AnyOptions as A, BaseOptions as B, HTTPStreamOptions as H, ListenerMap as L, StreamAPI as S, WebRTCOptions as W, StreamStatus as a, StreamState as b, WebSocketOptions as c, SSEOptions as d, LongPollingOptions as e, HLSOptions as f, SocketIOOptions as g };
