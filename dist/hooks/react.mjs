import {
  createStream
} from "../chunk-Z32DF6OG.mjs";

// src/hooks/react.ts
import { useEffect, useMemo, useRef, useState } from "react";
function useStream(opts) {
  const apiRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  if (!apiRef.current) {
    apiRef.current = createStream(opts);
    setStatus(apiRef.current.state.status);
    setIsOpen(apiRef.current.state.isOpen);
  }
  useEffect(() => {
    const api = apiRef.current;
    const offOpen = api.on("open", () => setIsOpen(true));
    const offClose = api.on("close", () => setIsOpen(false));
    const offStatus = api.on("status", (s) => setStatus(s));
    const offError = api.on("error", (e) => setError(e));
    const offMsg = api.on(
      "message",
      (m) => setMessages((prev) => [...prev, m])
    );
    api.open();
    return () => {
      offOpen();
      offClose();
      offStatus();
      offError();
      offMsg();
      api.close();
    };
  }, []);
  return useMemo(
    () => ({ ...apiRef.current, messages, status, error, isOpen }),
    [messages, status, error, isOpen]
  );
}
export {
  useStream
};
//# sourceMappingURL=react.mjs.map