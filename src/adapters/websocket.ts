import { StreamCore } from "../core/Stream";
import { BaseOptions } from "../core/types";

export interface WebSocketOptions extends BaseOptions {
  type: "websocket";
  url: string;
  protocols?: string | string[];
}

export function websocketAdapter(core: StreamCore, opts: WebSocketOptions) {
  let ws: WebSocket | null = null;

  return {
    open() {
      ws = new WebSocket(opts.url, opts.protocols);
      ws.onopen = () => core._onOpen();
      ws.onclose = () => core._onClose();
      ws.onerror = (ev: Event) => core._onError(new Error("WebSocket error"));
      ws.onmessage = (ev: MessageEvent) => {
        let data: unknown = ev.data;
        try {
          data = JSON.parse(ev.data);
        } catch {}
        core._onMessage(data);
      };
    },
    close() {
      ws?.close();
    },
    send(data: unknown) {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      ws?.send(payload);
    },
  };
}
