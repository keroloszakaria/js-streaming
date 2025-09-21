import { StreamCore } from "../core/Stream";
import { BaseOptions, StreamAPI } from "../core/types";
import Hls from "hls.js";

export interface HLSOptions extends BaseOptions {
  type: "hls";
  url: string;
  video: HTMLVideoElement;
}

export function hlsAdapter(core: StreamCore, opts: HLSOptions): StreamAPI {
  let hls: Hls | null = null;

  return {
    open: async () => {
      if (!opts.video) {
        throw new Error("HLS requires a video element in options.video");
      }

      // Native HLS support
      if (opts.video.canPlayType("application/vnd.apple.mpegurl")) {
        opts.video.src = opts.url;
      } else if (Hls.isSupported()) {
        // hls.js fallback
        hls = new Hls();
        hls.loadSource(opts.url);
        hls.attachMedia(opts.video);
      } else {
        core.emit("error", new Error("HLS not supported in this browser"));
        return;
      }

      core.emit("open");
      core.emit("message", { url: opts.url });
    },

    close: async () => {
      if (hls) {
        hls.destroy();
        hls = null;
      }
      if (opts.video) {
        opts.video.src = "";
      }
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
