import { StreamCore } from "../core/Stream";

import { BaseOptions } from "../core/types";

export interface LongPollingOptions extends BaseOptions {
  type: "long-polling";

  url: string;

  intervalMs?: number; // Delay between polling attempts when the server responds immediately

  requestInit?: RequestInit;
}

export function longPollingAdapter(core: StreamCore, opts: LongPollingOptions) {
  let stopped = false;

  async function loop() {
    while (!stopped) {
      try {
        const res = await fetch(opts.url, opts.requestInit);

        const text = await res.text();

        const lines = text.split(/\r?\n/).filter(Boolean);

        for (const line of lines) {
          let data: unknown = line;

          try {
            data = JSON.parse(line);
          } catch {}

          core._onMessage(data);
        }

        // If the server responds immediately, wait before the next poll

        await new Promise((r) => setTimeout(r, opts.intervalMs ?? 3000));
      } catch (e: any) {
        core._onError(e);

        await new Promise((r) => setTimeout(r, opts.intervalMs ?? 3000));
      }
    }

    core._onClose();
  }

  return {
    async open() {
      stopped = false;

      core._onOpen();

      loop();
    },

    async close() {
      stopped = true;
    },
  };
}
