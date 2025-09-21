import { StreamCore } from "../core/Stream";
import { BaseOptions, StreamAPI } from "../core/types";

export interface WebSocketOptions extends BaseOptions {
  type: "websocket";
}

export function websocketAdapter(
  core: StreamCore,
  opts: WebSocketOptions
): StreamAPI {
  let socket: WebSocket | null = null;

  return {
    open: async () => {
      socket = new WebSocket(opts.url);

      socket.onopen = () => core.emit("open");
      socket.onclose = () => core.emit("close");
      socket.onerror = (err) => core.emit("error", err as any);
      socket.onmessage = (msg) => core.emit("message", msg.data);
    },
    close: async () => {
      socket?.close();
    },
    send: (d: unknown) => {
      socket?.send(typeof d === "string" ? d : JSON.stringify(d));
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    },
  };
}
