import { io, Socket } from "socket.io-client";
import { StreamCore } from "../core/Stream";
import { BaseOptions, StreamAPI, ListenerMap } from "../core/types";

export interface SocketIOOptions extends BaseOptions {
  type: "socketio";
}

export function socketioAdapter(
  core: StreamCore,
  opts: SocketIOOptions
): StreamAPI {
  const socket: Socket = io(opts.url, {
    reconnection: opts.autoReconnect ?? true,
    reconnectionAttempts: opts.maxRetries ?? 5,
  });

  socket.on("connect", () => core.emit("open"));
  socket.on("disconnect", (reason: string) => core.emit("close", reason));
  socket.on("connect_error", (err: Error) => core.emit("error", err));
  socket.onAny((event: string, data: unknown) => {
    core.emit("message", { event, data });
  });

  return {
    open: async () => {
      socket.connect();
    },
    close: async () => {
      socket.disconnect();
    },
    send: (d: unknown) => {
      socket.emit("message", d);
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    },
  };
}
