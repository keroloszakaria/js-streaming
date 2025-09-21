import { StreamCore } from "../core/Stream";
import { BaseOptions, StreamAPI } from "../core/types";

export interface LongPollingOptions extends BaseOptions {
  type: "long-polling";
  interval?: number;
}

export function longPollingAdapter(
  core: StreamCore,
  opts: LongPollingOptions
): StreamAPI {
  let active = false;

  const poll = async () => {
    while (active) {
      try {
        const res = await fetch(opts.url);
        const data = await res.json();
        core.emit("message", data);
      } catch (err) {
        core.emit("error", err as any);
      }
      await new Promise((r) => setTimeout(r, opts.interval ?? 2000));
    }
  };

  return {
    open: async () => {
      active = true;
      core.emit("open");
      poll();
    },
    close: async () => {
      active = false;
      core.emit("close");
    },
    send: () => {
      throw new Error("Long polling does not support send()");
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    },
  };
}
