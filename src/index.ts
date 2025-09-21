import { StreamCore } from "./core/Stream";
import { BaseOptions, StreamAPI, ListenerMap } from "./core/types";

import { websocketAdapter, WebSocketOptions } from "./adapters/websocket";
import { sseAdapter, SSEOptions } from "./adapters/sse";
import { httpStreamAdapter, HTTPStreamOptions } from "./adapters/http";
import { longPollingAdapter, LongPollingOptions } from "./adapters/longPolling";
import { hlsAdapter, HLSOptions } from "./adapters/hls";
import { webrtcAdapter } from "./adapters/webrtc";
import { WebRTCOptions } from "./core/types";
import { socketioAdapter, SocketIOOptions } from "./adapters/socketio";

type AnyOptions =
  | WebSocketOptions
  | SSEOptions
  | HTTPStreamOptions
  | LongPollingOptions
  | HLSOptions
  | WebRTCOptions
  | SocketIOOptions;

export function createStream(opts: AnyOptions): StreamAPI {
  let adapter;
  const dummy = {} as any;
  const core = new StreamCore(dummy, opts as BaseOptions);

  switch (opts.type) {
    case "websocket":
      adapter = websocketAdapter(core, opts);
      break;
    case "sse":
      adapter = sseAdapter(core, opts);
      break;
    case "http":
      adapter = httpStreamAdapter(core, opts);
      break;
    case "long-polling":
      adapter = longPollingAdapter(core, opts);
      break;
    case "hls":
      adapter = hlsAdapter(core, opts);
      break;
    case "webrtc":
      adapter = webrtcAdapter(core, opts);
      break;
    case "socketio":
      adapter = socketioAdapter(core, opts);
      break;
    default:
      throw new Error(`Unknown stream type: ${(opts as any).type}`);
  }

  (core as any).adapter = adapter;

  return adapter;
}

export * from "./core/types";
