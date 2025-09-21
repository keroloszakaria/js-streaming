import { useEffect, useState } from "react";
import { createStream } from "../index";
import { AnyOptions, StreamAPI, StreamStatus } from "../core/types";

export function useStream(opts: AnyOptions) {
  const [stream, setStream] = useState<StreamAPI | null>(null);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const s = createStream(opts);

    s.on("status", (st: StreamStatus) => setStatus(st)); // 🟢 typed
    s.on("message", (msg: unknown) => setMessages((prev) => [...prev, msg]));

    setStream(s);

    return () => {
      s.close();
    };
  }, [opts]);

  return { stream, status, messages };
}
