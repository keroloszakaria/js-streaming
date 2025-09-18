import { StreamCore } from "./core/Stream";

import { BaseOptions, StreamAPI, ListenerMap } from "./core/types";

import { websocketAdapter, WebSocketOptions } from "./adapters/websocket";

import { sseAdapter, SSEOptions } from "./adapters/sse";

import { httpStreamAdapter, HTTPStreamOptions } from "./adapters/http";

import { longPollingAdapter, LongPollingOptions } from "./adapters/longPolling";

import { hlsAdapter, HLSOptions } from "./adapters/hls";

import { webrtcAdapter, WebRTCOptions } from "./adapters/webrtc";

type AnyOptions =
  | WebSocketOptions
  | SSEOptions
  | HTTPStreamOptions
  | LongPollingOptions
  | HLSOptions
  | WebRTCOptions;

export function createStream(opts: AnyOptions): StreamAPI {
  let adapter;

  // Create the core with a temporary adapter so we can configure it first

  // We instantiate the core without an adapter and wire it up afterwards

  // In practice we pass the core into the adapter factories so they can bind callbacks

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

    default:
      throw new Error(`Unknown stream type: ${(opts as any).type}`);
  }

  // Attach the concrete adapter that matches the requested protocol

  (core as any).adapter = adapter;

  return {
    open: () => core.open(),

    close: () => core.close(),

    send: (d: unknown) => core.send(d),

    on<T extends keyof ListenerMap>(evt: T, cb: ListenerMap[T][number]) {
      return core.on(evt, cb as any);
    },

    off<T extends keyof ListenerMap>(evt: T, cb: ListenerMap[T][number]) {
      return core.off(evt, cb as any);
    },

    get state() {
      return core.state;
    },
  };
}

export * from "./core/types";
