import {
  createStream
} from "../chunk-V6YMHTDE.mjs";

// src/hooks/vue.ts
import { ref, onMounted, onBeforeUnmount } from "vue";
function useStream(opts) {
  const stream = ref(null);
  const status = ref("idle");
  const messages = ref([]);
  onMounted(() => {
    const s = createStream(opts);
    s.on("status", (st) => status.value = st);
    s.on("message", (msg) => messages.value.push(msg));
    stream.value = s;
  });
  onBeforeUnmount(() => {
    stream.value?.close();
  });
  return { stream, status, messages };
}
export {
  useStream
};
//# sourceMappingURL=vue.mjs.map