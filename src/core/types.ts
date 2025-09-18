export type StreamType =
  | "websocket"
  | "sse"
  | "http"
  | "long-polling"
  | "hls"
  | "webrtc";

// Stream lifecycle statuses exposed by the core

export type StreamStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closing"
  | "closed"
  | "error";

// Generic configuration bag to avoid coupling to specific implementations

export type AnyConfig = Record<string, unknown>;

// HLS options expect the consumer to provide the target video element

export type HLSConfig = Omit<AnyConfig, "type" | "video">;

// WebRTC options wire up onTrack internally and support optional helpers

export type WebRTCConfig = Omit<AnyConfig, "type" | "onTrack"> & {
  attachVideo?: boolean;
};

export interface BaseOptions {
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

export type Message = unknown;

export interface StreamState {
  status: StreamStatus;

  error: Error | null;

  messages: Message[];

  isOpen: boolean;
}

export interface StreamAdapter {
  open(): Promise<void> | void;

  close(): Promise<void> | void;

  send?(data: unknown): void; // Only protocols like WebSocket/WebRTC implement sending
}

export type ListenerMap = {
  open: (() => void)[];

  close: (() => void)[];

  error: ((err: Error) => void)[];

  message: ((msg: Message) => void)[];

  status: ((s: StreamStatus) => void)[];
};

// send remains optional so receive-only protocols can conform to StreamAPI

export interface StreamAPI {
  open(): Promise<void>;

  close(): Promise<void>;

  send?(data: unknown): void;

  on<T extends keyof ListenerMap>(
    evt: T,

    cb: ListenerMap[T][number]
  ): () => void;

  off<T extends keyof ListenerMap>(evt: T, cb: ListenerMap[T][number]): void;

  readonly state: Readonly<StreamState>;
}
