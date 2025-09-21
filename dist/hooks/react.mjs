import {
  createStream
} from "../chunk-V6YMHTDE.mjs";

// src/hooks/react.ts
import { useEffect, useState } from "react";
function useStream(opts) {
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState("idle");
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const s = createStream(opts);
    s.on("status", (st) => setStatus(st));
    s.on("message", (msg) => setMessages((prev) => [...prev, msg]));
    setStream(s);
    return () => {
      s.close();
    };
  }, [opts]);
  return { stream, status, messages };
}
export {
  useStream
};
//# sourceMappingURL=react.mjs.map