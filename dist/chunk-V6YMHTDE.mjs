// src/core/Stream.ts
var StreamCore = class {
  constructor(adapter, opts) {
    this.adapter = adapter;
    this.opts = opts;
    // نخليها loose جوه الكلاس
    this.listeners = {};
    this.state = {
      status: "idle",
      retries: 0
    };
  }
  emit(event, ...args) {
    const cbs = this.listeners[event];
    if (!cbs) return;
    for (const cb of cbs) {
      cb(...args);
    }
  }
  on(evt, cb) {
    if (!this.listeners[evt]) {
      this.listeners[evt] = [];
    }
    this.listeners[evt].push(cb);
    return () => this.off(evt, cb);
  }
  off(evt, cb) {
    const arr = this.listeners[evt];
    if (!arr) return;
    this.listeners[evt] = arr.filter((fn) => fn !== cb);
  }
  async open() {
    this.state.status = "connecting";
    this.emit("status", "connecting");
    await this.adapter.open();
    this.state.status = "open";
    this.emit("status", "open");
  }
  async close() {
    this.state.status = "closed";
    this.emit("status", "closed");
    await this.adapter.close();
  }
  send(data) {
    this.adapter.send(data);
  }
};

// src/adapters/websocket.ts
function websocketAdapter(core, opts) {
  let socket = null;
  return {
    open: async () => {
      socket = new WebSocket(opts.url);
      socket.onopen = () => core.emit("open");
      socket.onclose = () => core.emit("close");
      socket.onerror = (err) => core.emit("error", err);
      socket.onmessage = (msg) => core.emit("message", msg.data);
    },
    close: async () => {
      socket?.close();
    },
    send: (d) => {
      socket?.send(typeof d === "string" ? d : JSON.stringify(d));
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    }
  };
}

// src/adapters/sse.ts
function sseAdapter(core, opts) {
  let es = null;
  return {
    open: async () => {
      es = new EventSource(opts.url);
      es.onopen = () => core.emit("open");
      es.onerror = (err) => core.emit("error", err);
      es.onmessage = (msg) => core.emit("message", msg.data);
    },
    close: async () => {
      es?.close();
      core.emit("close");
    },
    send: () => {
      throw new Error("SSE does not support send()");
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    }
  };
}

// src/adapters/http.ts
function httpStreamAdapter(core, opts) {
  let controller = null;
  return {
    open: async () => {
      controller = new AbortController();
      const res = await fetch(opts.url, { signal: controller.signal });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      core.emit("open");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        core.emit("message", new TextDecoder().decode(value));
      }
      core.emit("close");
    },
    close: async () => {
      controller?.abort();
      core.emit("close");
    },
    send: () => {
      throw new Error("HTTP streaming does not support send()");
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    }
  };
}

// src/adapters/longPolling.ts
function longPollingAdapter(core, opts) {
  let active = false;
  const poll = async () => {
    while (active) {
      try {
        const res = await fetch(opts.url);
        const data = await res.json();
        core.emit("message", data);
      } catch (err) {
        core.emit("error", err);
      }
      await new Promise((r) => setTimeout(r, opts.interval ?? 2e3));
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
    }
  };
}

// src/adapters/hls.ts
function hlsAdapter(core, opts) {
  return {
    open: async () => {
      core.emit("open");
      core.emit("message", { url: opts.url });
    },
    close: async () => {
      core.emit("close");
    },
    send: () => {
      throw new Error("HLS does not support send()");
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    }
  };
}

// src/adapters/webrtc.ts
function webrtcAdapter(core, opts) {
  let pc = null;
  let channel = null;
  return {
    open: async () => {
      pc = new RTCPeerConnection();
      channel = pc.createDataChannel("data");
      channel.onopen = () => core.emit("open");
      channel.onclose = () => core.emit("close");
      channel.onerror = (e) => core.emit("error", e);
      channel.onmessage = (e) => core.emit("message", e.data);
    },
    close: async () => {
      pc?.close();
      core.emit("close");
    },
    send: (d) => {
      if (channel && channel.readyState === "open") {
        channel.send(typeof d === "string" ? d : JSON.stringify(d));
      }
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
    }
  };
}

// src/adapters/socketio.ts
import { io } from "socket.io-client";
function socketioAdapter(core, opts) {
  const socket = io(opts.url, {
    reconnection: opts.autoReconnect ?? true,
    reconnectionAttempts: opts.maxRetries ?? 5
  });
  socket.on("connect", () => core.emit("open"));
  socket.on("disconnect", (reason) => core.emit("close", reason));
  socket.on("connect_error", (err) => core.emit("error", err));
  socket.onAny((event, data) => {
    core.emit("message", { event, data });
  });
  return {
    open: async () => {
      socket.connect();
    },
    close: async () => {
      socket.disconnect();
    },
    send: (d) => {
      socket.emit("message", d);
    },
    on: core.on.bind(core),
    off: core.off.bind(core),
    get state() {
      return core.state;
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
    case "socketio":
      adapter = socketioAdapter(core, opts);
      break;
    default:
      throw new Error(`Unknown stream type: ${opts.type}`);
  }
  core.adapter = adapter;
  return adapter;
}

export {
  createStream
};
//# sourceMappingURL=chunk-V6YMHTDE.mjs.map