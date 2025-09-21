import { StreamCore } from "../core/Stream";
import { BaseOptions, StreamAPI } from "../core/types";

export interface HLSOptions extends BaseOptions {
  type: "hls";
}

export function hlsAdapter(core: StreamCore, opts: HLSOptions): StreamAPI {
  return {
    open: async () => {
      core.emit("open");
      core.emit("message", { url: opts.url });
    },
    close: async () => {
      core.emit("close");
    },
    send: () => {
      throw new Error("HLS does not support send()");
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    },
  };
}
