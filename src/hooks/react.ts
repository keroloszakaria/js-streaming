import { useEffect, useMemo, useRef, useState } from "react";

import { createStream } from "../index";

import type { StreamAPI, StreamStatus, ListenerMap } from "../core/types";

export function useStream<T = unknown>(
  opts: Parameters<typeof createStream>[0]
) {
  const apiRef = useRef<StreamAPI | null>(null);

  // Local state mirrors the current stream status for React consumers

  const [messages, setMessages] = useState<T[]>([]);

  const [status, setStatus] = useState<StreamStatus>("idle");

  const [error, setError] = useState<Error | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (!apiRef.current) {
    apiRef.current = createStream(opts);

    // Sync the initial state from the underlying stream API

    setStatus(apiRef.current.state.status as StreamStatus);

    setIsOpen(apiRef.current.state.isOpen);
  }

  useEffect(() => {
    const api = apiRef.current!;

    const offOpen = api.on("open", () => setIsOpen(true));

    const offClose = api.on("close", () => setIsOpen(false));

    const offStatus = api.on("status", (s: StreamStatus) => setStatus(s));

    const offError = api.on("error", (e: Error) => setError(e));

    const offMsg = api.on("message", (m: unknown) =>
      setMessages((prev: T[]) => [...prev, m as T])
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

  // Expose the stream API along with the reactive pieces of state

  return useMemo(
    () => ({ ...apiRef.current!, messages, status, error, isOpen }),

    [messages, status, error, isOpen]
  );
}
