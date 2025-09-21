# js-streaming

<p align="center">
  <a href="https://www.npmjs.com/package/js-streaming">
    <img src="https://img.shields.io/npm/v/js-streaming.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/js-streaming">
    <img src="https://img.shields.io/npm/dm/js-streaming.svg" alt="npm downloads" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg" alt="TypeScript" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  </a>
</p>
<p align="center">
  Universal, type-safe streaming client for JavaScript.  
  Supports <b>WebSocket, SSE, HTTP streaming, long-polling, HLS video, WebRTC, and Socket.IO</b> under one unified API.  
  Includes smart reconnection, typed events, React/Vue hooks, and cross-platform support.
</p>

---

## 🚀 Features

- 🔌 Multiple protocols: WebSocket, SSE, HTTP streaming, long-polling, HLS, WebRTC, Socket.IO
- 🔄 Auto-reconnect with exponential backoff + jitter
- 📦 Framework-ready: React & Vue hooks included
- 🛡 Full TypeScript types & unified API
- ⚡ Works in browsers, Node.js, React Native, Electron, workers
- 🎯 Zero dependencies (optional peer deps only)

---

## 📦 Installation

```bash
npm install js-streaming

# Optional peer dependencies:
npm install hls.js socket.io-client react vue
```

---

## ⚡ Quick Start

```ts
import { createStream } from "js-streaming";

const stream = createStream({
  type: "websocket",
  url: "wss://api.example.com/ws",
});

// Events
stream.on("open", () => console.log("Connected"));
stream.on("message", (data) => console.log("Data:", data));
stream.on("error", (err) => console.error("Error:", err));
stream.on("close", () => console.log("Closed"));

// Use
await stream.open();
stream.send({ hello: "server" });
```

---

## 📂 Supported Protocols

```ts
// WebSocket
createStream({ type: "websocket", url: "wss://example.com" });

// Server-Sent Events
createStream({ type: "sse", url: "https://example.com/events" });

// HTTP Streaming
createStream({ type: "http", url: "https://example.com/stream" });

// Long Polling
createStream({
  type: "long-polling",
  url: "https://example.com/poll",
  interval: 1000,
});

// HLS Video
createStream({
  type: "hls",
  url: "https://example.com/video.m3u8",
  video: document.querySelector("video"),
});

// WebRTC
createStream({ type: "webrtc", createPeer: () => new RTCPeerConnection() });

// Socket.IO
createStream({ type: "socketio", url: "https://example.com" });
```

---

## 🔗 React & Vue Hooks

**React**

```tsx
import { useStream } from "js-streaming/react";

const { messages, isOpen, send } = useStream({
  type: "websocket",
  url: "wss://chat.example.com",
});
```

**Vue**

```vue
<script setup>
import { useStream } from "js-streaming/vue";
const { messages, isOpen, send } = useStream({
  type: "sse",
  url: "https://events.example.com",
});
</script>
```

---

## 🛡 Error Handling & Reconnect

```ts
const stream = createStream({
  type: "websocket",
  url: "wss://unstable-server.com",
  autoReconnect: true,
  maxRetries: 5,
  backoff: { baseMs: 500, maxMs: 15000, factor: 2, jitter: true },
});

stream.on("status", (s) => console.log("Status:", s));
```

---

## 📊 API

- `open() / close()` → manage connection
- `send(data)` → send payloads (WebSocket / WebRTC / Socket.IO)
- `on(event, cb)` / `off(event, cb)` → listen to `open | close | error | message | status`
- `state` → current status, retries, buffer, errors

---

## ✅ Version Support

- **Node.js**: 16+
- **React**: 16.8+
- **Vue**: 3+
- **Browsers**: All modern browsers
- **Extras**: HLS (via `hls.js`), Socket.IO (via `socket.io-client`)

---

## 📜 License

MIT © [Kerolos Zakaria](https://github.com/keroloszakaria)
