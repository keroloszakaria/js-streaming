export type StreamStatus = "idle" | "connecting" | "open" | "closed" | "error";

export interface StreamState {
  status: StreamStatus;
  retries: number;
}

export interface ListenerMap {
  open: []; // مفيش args
  close: [reason?: string]; // Arg واحد اختياري
  error: [Error]; // Arg واحد Error
  message: [unknown]; // Arg واحد msg
  status: [StreamStatus]; // Arg واحد status
}

export interface BaseOptions {
  type: string;
  url: string; // 🟢 fix: كل بروتوكول لازم يكون عنده url
  autoReconnect?: boolean;
  maxRetries?: number;
}

// ======================
// All protocol options
// ======================
export interface WebSocketOptions extends BaseOptions {
  type: "websocket";
}

export interface SSEOptions extends BaseOptions {
  type: "sse";
}

export interface HTTPStreamOptions extends BaseOptions {
  type: "http";
}

export interface LongPollingOptions extends BaseOptions {
  type: "long-polling";
  interval?: number;
}

export interface HLSOptions extends BaseOptions {
  type: "hls";
  url: string;
  video: HTMLVideoElement;
}

export interface WebRTCOptions extends BaseOptions {
  type: "webrtc";
}

export interface SocketIOOptions extends BaseOptions {
  type: "socketio";
}

// 🟢 Union type
export type AnyOptions =
  | WebSocketOptions
  | SSEOptions
  | HTTPStreamOptions
  | LongPollingOptions
  | HLSOptions
  | WebRTCOptions
  | SocketIOOptions;

export interface StreamAPI {
  open: () => Promise<void>;
  close: () => Promise<void>;
  send: (data: unknown) => void;

  on<T extends keyof ListenerMap>(
    evt: T,
    cb: (...args: ListenerMap[T]) => void
  ): () => void;

  off<T extends keyof ListenerMap>(
    evt: T,
    cb: (...args: ListenerMap[T]) => void
  ): void;

  readonly state: Readonly<StreamState>;
}
