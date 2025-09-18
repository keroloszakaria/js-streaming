type StreamType = "websocket" | "sse" | "http" | "long-polling" | "hls" | "webrtc";
type StreamStatus = "idle" | "connecting" | "open" | "closing" | "closed" | "error";
type AnyConfig = Record<string, unknown>;
type HLSConfig = Omit<AnyConfig, "type" | "video">;
type WebRTCConfig = Omit<AnyConfig, "type" | "onTrack"> & {
    attachVideo?: boolean;
};
interface BaseOptions {
    type: StreamType;
    bufferLimit?: number;
    autoReconnect?: boolean;
    maxRetries?: number;
    heartbeatMs?: number;
    backoff?: {
        baseMs?: number;
        maxMs?: number;
        factor?: number;
        jitter?: boolean;
    };
}
type Message = unknown;
interface StreamState {
    status: StreamStatus;
    error: Error | null;
    messages: Message[];
    isOpen: boolean;
}
interface StreamAdapter {
    open(): Promise<void> | void;
    close(): Promise<void> | void;
    send?(data: unknown): void;
}
type ListenerMap = {
    open: (() => void)[];
    close: (() => void)[];
    error: ((err: Error) => void)[];
    message: ((msg: Message) => void)[];
    status: ((s: StreamStatus) => void)[];
};
interface StreamAPI {
    open(): Promise<void>;
    close(): Promise<void>;
    send?(data: unknown): void;
    on<T extends keyof ListenerMap>(evt: T, cb: ListenerMap[T][number]): () => void;
    off<T extends keyof ListenerMap>(evt: T, cb: ListenerMap[T][number]): void;
    readonly state: Readonly<StreamState>;
}

interface WebSocketOptions extends BaseOptions {
    type: "websocket";
    url: string;
    protocols?: string | string[];
}

interface SSEOptions extends BaseOptions {
    type: "sse";
    url: string;
    withCredentials?: boolean;
}

interface HTTPStreamOptions extends BaseOptions {
    type: "http";
    url: string;
    requestInit?: RequestInit;
}

interface LongPollingOptions extends BaseOptions {
    type: "long-polling";
    url: string;
    intervalMs?: number;
    requestInit?: RequestInit;
}

interface HLSOptions extends BaseOptions {
    type: "hls";
    url: string;
    video: HTMLVideoElement;
}

interface WebRTCOptions extends BaseOptions {
    type: "webrtc";
    createPeer: () => RTCPeerConnection;
    onTrack: (stream: MediaStream) => void;
    dataChannelLabel?: string;
}

type AnyOptions = WebSocketOptions | SSEOptions | HTTPStreamOptions | LongPollingOptions | HLSOptions | WebRTCOptions;
declare function createStream(opts: AnyOptions): StreamAPI;

export { type AnyConfig, type BaseOptions, type HLSConfig, type ListenerMap, type Message, type StreamAPI, type StreamAdapter, type StreamState, type StreamStatus, type StreamType, type WebRTCConfig, createStream };
