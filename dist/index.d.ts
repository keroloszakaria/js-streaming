import { B as BaseOptions, W as WebRTCOptions, S as StreamAPI } from './types-Djb2TFwW.js';
export { A as AnyOptions, f as HLSOptions, H as HTTPStreamOptions, L as ListenerMap, e as LongPollingOptions, d as SSEOptions, g as SocketIOOptions, b as StreamState, a as StreamStatus, c as WebSocketOptions } from './types-Djb2TFwW.js';

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
    url: string;
    video: HTMLVideoElement;
}

interface SocketIOOptions extends BaseOptions {
    type: "socketio";
}

type AnyOptions = WebSocketOptions | SSEOptions | HTTPStreamOptions | LongPollingOptions | HLSOptions | WebRTCOptions | SocketIOOptions;
declare function createStream(opts: AnyOptions): StreamAPI;

export { BaseOptions, StreamAPI, WebRTCOptions, createStream };
