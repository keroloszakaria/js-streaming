import { StreamCore } from "../core/Stream";

import { BaseOptions } from "../core/types";

export interface HLSOptions extends BaseOptions {
  type: "hls";

  url: string; // m3u8 playlist URL

  video: HTMLVideoElement; // Video element that will render the stream
}

export function hlsAdapter(core: StreamCore, opts: HLSOptions) {
  let HlsLib: any;

  let hls: any;

  return {
    async open() {
      try {
        // If the browser supports native HLS (Safari, iOS, etc.)

        if (opts.video.canPlayType("application/vnd.apple.mpegURL")) {
          opts.video.src = opts.url;

          opts.video.addEventListener("loadedmetadata", () => {
            core._onOpen();

            core._onMessage({ event: "hls:loaded" });
          });

          opts.video.addEventListener("error", () =>
            core._onError(new Error("HLS video error"))
          );

          return;
        }

        // Fallback to hls.js (declared as a peer dependency)

        const mod = await import("hls.js");

        HlsLib = mod.default || mod;

        if (!HlsLib.isSupported()) throw new Error("hls.js not supported");

        hls = new HlsLib();

        hls.on(HlsLib.Events.ERROR, (_e: any, data: any) =>
          core._onError(new Error(`HLS: ${data?.details || "error"}`))
        );

        hls.on(HlsLib.Events.MANIFEST_PARSED, () =>
          core._onMessage({ event: "hls:manifest_parsed" })
        );

        hls.loadSource(opts.url);

        hls.attachMedia(opts.video);

        core._onOpen();
      } catch (e: any) {
        core._onError(e);
      }
    },

    async close() {
      try {
        if (hls) hls.destroy();
      } catch {}

      opts.video.removeAttribute("src");

      opts.video.load();

      core._onClose();
    },
  };
}
