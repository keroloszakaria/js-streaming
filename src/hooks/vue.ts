import { ref, onMounted, onBeforeUnmount } from "vue";
import { createStream } from "../index";
import { AnyOptions, StreamAPI, StreamStatus } from "../core/types";

export function useStream(opts: AnyOptions) {
  const stream = ref<StreamAPI | null>(null);
  const status = ref<StreamStatus>("idle");
  const messages = ref<any[]>([]);

  onMounted(() => {
    const s = createStream(opts);

    s.on("status", (st: StreamStatus) => (status.value = st));
    s.on("message", (msg: unknown) => messages.value.push(msg));

    stream.value = s;
  });

  onBeforeUnmount(() => {
    stream.value?.close();
  });

  return { stream, status, messages };
}
