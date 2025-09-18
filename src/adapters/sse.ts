import { StreamCore } from "../core/Stream";
import { BaseOptions } from "../core/types";

export interface SSEOptions extends BaseOptions {
  type: "sse";
  url: string;
  withCredentials?: boolean;
}

export function sseAdapter(core: StreamCore, opts: SSEOptions) {
  let es: EventSource | null = null;

  return {
    open() {
      es = new EventSource(opts.url, {
        withCredentials: !!opts.withCredentials,
      });
      es.onopen = () => core._onOpen();
      es.onerror = () => core._onError(new Error("SSE error"));
      es.onmessage = (e) => {
        let data: unknown = e.data;
        try {
          data = JSON.parse(e.data);
        } catch {}
        core._onMessage(data);
      };
    },
    close() {
      es?.close();
    },
  };
}
