import { StreamCore } from "../core/Stream";
import { BaseOptions, StreamAPI } from "../core/types";

export interface SSEOptions extends BaseOptions {
  type: "sse";
}

export function sseAdapter(core: StreamCore, opts: SSEOptions): StreamAPI {
  let es: EventSource | null = null;

  return {
    open: async () => {
      es = new EventSource(opts.url);

      es.onopen = () => core.emit("open");
      es.onerror = (err) => core.emit("error", err as any);
      es.onmessage = (msg) => core.emit("message", msg.data);
    },
    close: async () => {
      es?.close();
      core.emit("close");
    },
    send: () => {
      throw new Error("SSE does not support send()");
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    },
  };
}
