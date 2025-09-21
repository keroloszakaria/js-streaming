import { StreamCore } from "../core/Stream";
import { WebRTCOptions, StreamAPI } from "../core/types";

export function webrtcAdapter(
  core: StreamCore,
  opts: WebRTCOptions
): StreamAPI {
  let pc: RTCPeerConnection | null = null;
  let channel: RTCDataChannel | null = null; // 🟢 fix: بدل sendChannel

  return {
    open: async () => {
      pc = new RTCPeerConnection();
      channel = pc.createDataChannel("data");

      channel.onopen = () => core.emit("open");
      channel.onclose = () => core.emit("close");
      channel.onerror = (e) => core.emit("error", e as any);
      channel.onmessage = (e) => core.emit("message", e.data);
    },
    close: async () => {
      pc?.close();
      core.emit("close");
    },
    send: (d: unknown) => {
      if (channel && channel.readyState === "open") {
        channel.send(typeof d === "string" ? d : JSON.stringify(d));
      }
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    },
  };
}
