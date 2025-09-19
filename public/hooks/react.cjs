"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/hooks/react.ts
var react_exports = {};
__export(react_exports, {
  useStream: () => useStream
});
module.exports = __toCommonJS(react_exports);
var import_react = require("react");

// src/core/backoff.ts
function createBackoff(opts) {
  const base = opts?.baseMs ?? 500;
  const max = opts?.maxMs ?? 15e3;
  const factor = opts?.factor ?? 2;
  const jitter = opts?.jitter ?? true;
  let attempt = 0;
  return {
    reset() {
      attempt = 0;
    },
    next() {
      const exp = Math.min(max, base * Math.pow(factor, attempt++));
      return jitter ? Math.random() * exp : exp;
    }
  };
}

// src/core/Stream.ts
var StreamCore = class {
  constructor(adapter, opts) {
    this._state = {
      status: "idle",
      error: null,
      messages: [],
      isOpen: false
    };
    this.listeners = {
      open: [],
      close: [],
      error: [],
      message: [],
      status: []
    };
    this.adapter = null;
    this.retrying = false;
    this.retries = 0;
    this.backoff = createBackoff();
    // hooks adapters will call:
    this._onOpen = () => {
      this.retries = 0;
      this.backoff.reset();
      this.setStatus("open");
      this.emit("open");
    };
    this._onClose = () => {
      this.setStatus("closed");
      this.emit("close");
      if (this.opts.autoReconnect && this.retries < (this.opts.maxRetries ?? 10)) {
        this.retrying = true;
        const delay = this.backoff.next();
        setTimeout(() => this.open(), delay);
      }
    };
    this._onError = (e) => this.setError(e);
    this._onMessage = (m) => this.pushMessage(m);
    this.adapter = adapter;
    this.opts = {
      bufferLimit: 500,
      autoReconnect: true,
      maxRetries: 10,
      ...opts
    };
    if (opts.backoff) this.backoff = createBackoff(opts.backoff);
  }
  get state() {
    return this._state;
  }
  setStatus(s) {
    this._state.status = s;
    this._state.isOpen = s === "open";
    this.emit("status", s);
  }
  setError(e) {
    this._state.error = e;
    this.setStatus("error");
    this.emit("error", e);
  }
  pushMessage(m) {
    const limit = this.opts.bufferLimit;
    const arr = this._state.messages;
    arr.push(m);
    if (arr.length > limit) arr.splice(0, arr.length - limit);
    this.emit("message", m);
  }
  async open() {
    if (!this.adapter) return;
    this.setStatus("connecting");
    try {
      await this.adapter.open();
    } catch (e) {
      this.retries++;
      this.setError(e);
      if (this.opts.autoReconnect && this.retries <= (this.opts.maxRetries ?? 10)) {
        const delay = this.backoff.next();
        setTimeout(() => this.open(), delay);
      }
    }
  }
  async close() {
    this.setStatus("closing");
    try {
      await this.adapter?.close();
    } finally {
      this.setStatus("closed");
    }
  }
  send(data) {
    this.adapter?.send?.(data);
  }
  on(evt, cb) {
    this.listeners[evt].push(cb);
    return () => this.off(evt, cb);
  }
  off(evt, cb) {
    const arr = this.listeners[evt];
    const i = arr.indexOf(cb);
    if (i >= 0) arr.splice(i, 1);
  }
  emit(evt, payload) {
    for (const cb of this.listeners[evt]) cb(payload);
  }
};

// src/adapters/websocket.ts
function websocketAdapter(core, opts) {
  let ws = null;
  return {
    open() {
      ws = new WebSocket(opts.url, opts.protocols);
      ws.onopen = () => core._onOpen();
      ws.onclose = () => core._onClose();
      ws.onerror = (ev) => core._onError(new Error("WebSocket error"));
      ws.onmessage = (ev) => {
        let data = ev.data;
        try {
          data = JSON.parse(ev.data);
        } catch {
        }
        core._onMessage(data);
      };
    },
    close() {
      ws?.close();
    },
    send(data) {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      ws?.send(payload);
    }
  };
}

// src/adapters/sse.ts
function sseAdapter(core, opts) {
  let es = null;
  return {
    open() {
      es = new EventSource(opts.url, {
        withCredentials: !!opts.withCredentials
      });
      es.onopen = () => core._onOpen();
      es.onerror = () => core._onError(new Error("SSE error"));
      es.onmessage = (e) => {
        let data = e.data;
        try {
          data = JSON.parse(e.data);
        } catch {
        }
        core._onMessage(data);
      };
    },
    close() {
      es?.close();
    }
  };
}

// src/adapters/http.ts
function httpStreamAdapter(core, opts) {
  let ctrl = null;
  return {
    async open() {
      ctrl = new AbortController();
      try {
        const res = await fetch(opts.url, {
          ...opts.requestInit || {},
          signal: ctrl.signal
        });
        if (!res.body) throw new Error("No body for HTTP stream");
        core._onOpen();
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          chunk.split(/\r?\n/).filter(Boolean).forEach((line) => {
            let data = line;
            try {
              data = JSON.parse(line);
            } catch {
            }
            core._onMessage(data);
          });
        }
        core._onClose();
      } catch (e) {
        if (e.name !== "AbortError") core._onError(e);
      }
    },
    async close() {
      ctrl?.abort();
    }
  };
}

// src/adapters/longPolling.ts
function longPollingAdapter(core, opts) {
  let stopped = false;
  async function loop() {
    while (!stopped) {
      try {
        const res = await fetch(opts.url, opts.requestInit);
        const text = await res.text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          let data = line;
          try {
            data = JSON.parse(line);
          } catch {
          }
          core._onMessage(data);
        }
        await new Promise((r) => setTimeout(r, opts.intervalMs ?? 3e3));
      } catch (e) {
        core._onError(e);
        await new Promise((r) => setTimeout(r, opts.intervalMs ?? 3e3));
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
    }
  };
}

// src/adapters/hls.ts
function hlsAdapter(core, opts) {
  let HlsLib;
  let hls;
  return {
    async open() {
      try {
        if (opts.video.canPlayType("application/vnd.apple.mpegURL")) {
          opts.video.src = opts.url;
          opts.video.addEventListener("loadedmetadata", () => {
            core._onOpen();
            core._onMessage({ event: "hls:loaded" });
          });
          opts.video.addEventListener(
            "error",
            () => core._onError(new Error("HLS video error"))
          );
          return;
        }
        const mod = await import("hls.js");
        HlsLib = mod.default || mod;
        if (!HlsLib.isSupported()) throw new Error("hls.js not supported");
        hls = new HlsLib();
        hls.on(
          HlsLib.Events.ERROR,
          (_e, data) => core._onError(new Error(`HLS: ${data?.details || "error"}`))
        );
        hls.on(
          HlsLib.Events.MANIFEST_PARSED,
          () => core._onMessage({ event: "hls:manifest_parsed" })
        );
        hls.loadSource(opts.url);
        hls.attachMedia(opts.video);
        core._onOpen();
      } catch (e) {
        core._onError(e);
      }
    },
    async close() {
      try {
        if (hls) hls.destroy();
      } catch {
      }
      opts.video.removeAttribute("src");
      opts.video.load();
      core._onClose();
    }
  };
}

// src/adapters/webrtc.ts
function webrtcAdapter(core, opts) {
  let pc = null;
  let dc = null;
  return {
    async open() {
      pc = opts.createPeer();
      dc = pc.createDataChannel(opts.dataChannelLabel || "data");
      dc.onopen = () => core._onOpen();
      dc.onmessage = (e) => core._onMessage(e.data);
      dc.onerror = () => core._onError(new Error("WebRTC data channel error"));
      dc.onclose = () => core._onClose();
      pc.ontrack = (e) => opts.onTrack(e.streams[0]);
    },
    async close() {
      dc?.close();
      pc?.close();
      core._onClose();
    },
    send(data) {
      dc?.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  };
}

// src/index.ts
function createStream(opts) {
  let adapter;
  const dummy = {};
  const core = new StreamCore(dummy, opts);
  switch (opts.type) {
    case "websocket":
      adapter = websocketAdapter(core, opts);
      break;
    case "sse":
      adapter = sseAdapter(core, opts);
      break;
    case "http":
      adapter = httpStreamAdapter(core, opts);
      break;
    case "long-polling":
      adapter = longPollingAdapter(core, opts);
      break;
    case "hls":
      adapter = hlsAdapter(core, opts);
      break;
    case "webrtc":
      adapter = webrtcAdapter(core, opts);
      break;
    default:
      throw new Error(`Unknown stream type: ${opts.type}`);
  }
  core.adapter = adapter;
  return {
    open: () => core.open(),
    close: () => core.close(),
    send: (d) => core.send(d),
    on(evt, cb) {
      return core.on(evt, cb);
    },
    off(evt, cb) {
      return core.off(evt, cb);
    },
    get state() {
      return core.state;
    }
  };
}

// src/hooks/react.ts
function useStream(opts) {
  const apiRef = (0, import_react.useRef)(null);
  const [messages, setMessages] = (0, import_react.useState)([]);
  const [status, setStatus] = (0, import_react.useState)("idle");
  const [error, setError] = (0, import_react.useState)(null);
  const [isOpen, setIsOpen] = (0, import_react.useState)(false);
  if (!apiRef.current) {
    apiRef.current = createStream(opts);
    setStatus(apiRef.current.state.status);
    setIsOpen(apiRef.current.state.isOpen);
  }
  (0, import_react.useEffect)(() => {
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
  return (0, import_react.useMemo)(
    () => ({ ...apiRef.current, messages, status, error, isOpen }),
    [messages, status, error, isOpen]
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useStream
});
//# sourceMappingURL=react.cjs.map