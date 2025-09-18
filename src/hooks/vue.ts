import { ref, onMounted, onUnmounted } from "vue";
import { createStream } from "../index";
import type { StreamAPI } from "../core/types";

export function useStream<T = unknown>(
  opts: Parameters<typeof createStream>[0]
) {
  const api: StreamAPI = createStream(opts);
  const messages = ref<T[]>([]);
  const status = ref(api.state.status);
  const error = ref<Error | null>(null);
  const isOpen = ref(api.state.isOpen);

  const offOpen = api.on("open", () => {
    isOpen.value = true;
  });
  const offClose = api.on("close", () => {
    isOpen.value = false;
  });
  const offStatus = api.on("status", (s) => {
    status.value = s;
  });
  const offError = api.on("error", (e) => {
    error.value = e;
  });
  const offMsg = api.on("message", (m) => {
    // Fix: Create new array to avoid Vue reactive typing issues
    messages.value = [...messages.value, m] as T[];
  });

  onMounted(() => {
    api.open();
  });
  onUnmounted(() => {
    offOpen();
    offClose();
    offStatus();
    offError();
    offMsg();
    api.close();
  });

  return { ...api, messages, status, error, isOpen };
}
