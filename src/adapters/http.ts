import { StreamCore } from "../core/Stream";

import { BaseOptions } from "../core/types";

export interface HTTPStreamOptions extends BaseOptions {
  type: "http";

  url: string;

  requestInit?: RequestInit;
}

export function httpStreamAdapter(core: StreamCore, opts: HTTPStreamOptions) {
  let ctrl: AbortController | null = null;

  return {
    async open() {
      ctrl = new AbortController();

      try {
        const res = await fetch(opts.url, {
          ...(opts.requestInit || {}),

          signal: ctrl.signal,
        });

        if (!res.body) throw new Error("No body for HTTP stream");

        core._onOpen();

        const reader = res.body.getReader();

        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Attempt to split newline-delimited payloads such as JSON Lines

          chunk

            .split(/\r?\n/)

            .filter(Boolean)

            .forEach((line) => {
              let data: unknown = line;

              try {
                data = JSON.parse(line);
              } catch {}

              core._onMessage(data);
            });
        }

        core._onClose();
      } catch (e: any) {
        if (e.name !== "AbortError") core._onError(e);
      }
    },

    async close() {
      ctrl?.abort();
    },
  };
}
