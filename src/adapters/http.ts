import { StreamCore } from "../core/Stream";
import { BaseOptions, StreamAPI } from "../core/types";

export interface HTTPStreamOptions extends BaseOptions {
  type: "http";
}

export function httpStreamAdapter(
  core: StreamCore,
  opts: HTTPStreamOptions
): StreamAPI {
  let controller: AbortController | null = null;

  return {
    open: async () => {
      controller = new AbortController();
      const res = await fetch(opts.url, { signal: controller.signal });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      core.emit("open");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        core.emit("message", new TextDecoder().decode(value));
      }

      core.emit("close");
    },
    close: async () => {
      controller?.abort();
      core.emit("close");
    },
    send: () => {
      throw new Error("HTTP streaming does not support send()");
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    },
  };
}
