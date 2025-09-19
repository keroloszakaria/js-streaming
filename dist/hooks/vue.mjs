import {
  createStream
} from "../chunk-Z32DF6OG.mjs";

// src/hooks/vue.ts
import { ref, onMounted, onUnmounted } from "vue";
function useStream(opts) {
  const api = createStream(opts);
  const messages = ref([]);
  const status = ref(api.state.status);
  const error = ref(null);
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
    messages.value = [...messages.value, m];
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
export {
  useStream
};
//# sourceMappingURL=vue.mjs.map