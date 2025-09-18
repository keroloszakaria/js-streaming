import { StreamCore } from "../core/Stream";

import { BaseOptions } from "../core/types";

export interface WebRTCOptions extends BaseOptions {
  type: "webrtc";

  createPeer: () => RTCPeerConnection;

  onTrack: (stream: MediaStream) => void; // Deliver remote media so the host app can attach it

  dataChannelLabel?: string;
}

export function webrtcAdapter(core: StreamCore, opts: WebRTCOptions) {
  let pc: RTCPeerConnection | null = null;

  let dc: RTCDataChannel | null = null;

  return {
    async open() {
      pc = opts.createPeer();

      dc = pc.createDataChannel(opts.dataChannelLabel || "data");

      dc.onopen = () => core._onOpen();

      dc.onmessage = (e) => core._onMessage(e.data);

      dc.onerror = () => core._onError(new Error("WebRTC data channel error"));

      dc.onclose = () => core._onClose();

      pc.ontrack = (e) => opts.onTrack(e.streams[0]);

      // Signaling is handled by the host application outside this adapter
    },

    async close() {
      dc?.close();

      pc?.close();

      core._onClose();
    },

    send(data: unknown) {
      dc?.send(typeof data === "string" ? data : JSON.stringify(data));
    },
  };
}
