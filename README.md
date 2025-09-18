# js-streaming

A unified, type-safe streaming client library for JavaScript that supports multiple protocols including WebSocket, Server-Sent Events (SSE), HTTP streaming, long-polling, HLS video streaming, and WebRTC data channels.

## ✨ Features

- **🔌 Multiple Protocol Support**: WebSocket, SSE, HTTP streaming, long-polling, HLS, WebRTC
- **🔄 Automatic Reconnection**: Built-in exponential backoff with jitter
- **📦 Framework Integration**: React and Vue hooks included
- **🛡️ Type Safety**: Full TypeScript support with comprehensive types
- **🎯 Unified API**: Same interface across all streaming protocols
- **📱 Cross-Platform**: Works in browsers, React Native, and Node.js environments
- **⚡ Zero Dependencies**: No external dependencies (peer dependencies for specific features)
- **🔧 Highly Configurable**: Customizable retry logic, buffering, and more

## 🚀 Installation

```bash
npm install js-streaming

# Optional peer dependencies for specific features:
npm install hls.js        # For HLS video streaming
npm install react         # For React hooks
npm install vue           # For Vue composables
```

## 📖 Quick Start

### Basic WebSocket Example

```javascript
import { createStream } from "js-streaming";

const stream = createStream({
  type: "websocket",
  url: "wss://api.example.com/ws",
});

// Listen for messages
stream.on("message", (data) => {
  console.log("Received:", data);
});

// Listen for connection events
stream.on("open", () => console.log("Connected!"));
stream.on("error", (error) => console.error("Error:", error));
stream.on("close", () => console.log("Disconnected"));

// Connect and send data
await stream.open();
stream.send({ message: "Hello Server!" });
```

### React Hook Example

```jsx
import { useStream } from "js-streaming/react";

function ChatComponent() {
  const { messages, isOpen, send, error } = useStream({
    type: "websocket",
    url: "wss://chat.example.com/ws",
  });

  const sendMessage = () => {
    if (isOpen) {
      send({ text: "Hello from React!", timestamp: Date.now() });
    }
  };

  return (
    <div>
      <div>Status: {isOpen ? "🟢 Connected" : "🔴 Disconnected"}</div>
      {error && <div>Error: {error.message}</div>}

      <div>
        {messages.map((msg, i) => (
          <div key={i}>{JSON.stringify(msg)}</div>
        ))}
      </div>

      <button onClick={sendMessage} disabled={!isOpen}>
        Send Message
      </button>
    </div>
  );
}
```

### Vue Composable Example

```vue
<template>
  <div>
    <div>Status: {{ isOpen ? "🟢 Connected" : "🔴 Disconnected" }}</div>
    <div v-if="error">Error: {{ error.message }}</div>

    <div v-for="(msg, i) in messages" :key="i">
      {{ JSON.stringify(msg) }}
    </div>

    <button @click="sendMessage" :disabled="!isOpen">Send Message</button>
  </div>
</template>

<script setup>
import { useStream } from "js-streaming/vue";

const { messages, isOpen, send, error } = useStream({
  type: "websocket",
  url: "wss://chat.example.com/ws",
});

const sendMessage = () => {
  if (isOpen.value) {
    send({ text: "Hello from Vue!", timestamp: Date.now() });
  }
};
</script>
```

## 🔧 Supported Protocols

### WebSocket

Full-duplex communication with automatic reconnection.

```javascript
const stream = createStream({
  type: "websocket",
  url: "wss://api.example.com/ws",
  protocols: ["v1", "v2"], // Optional subprotocols
  autoReconnect: true,
  maxRetries: 5,
});
```

### Server-Sent Events (SSE)

Efficient server-to-client streaming.

```javascript
const stream = createStream({
  type: "sse",
  url: "https://api.example.com/events",
  withCredentials: true, // Include cookies
});
```

### HTTP Streaming

Stream data over regular HTTP connections.

```javascript
const stream = createStream({
  type: "http",
  url: "https://api.example.com/stream",
  requestInit: {
    method: "POST",
    headers: { Authorization: "Bearer token" },
    body: JSON.stringify({ query: "data" }),
  },
});
```

### Long Polling

Simulates real-time with HTTP polling.

```javascript
const stream = createStream({
  type: "long-polling",
  url: "https://api.example.com/poll",
  intervalMs: 1000, // Poll interval when server responds immediately
  requestInit: {
    method: "GET",
    headers: { Authorization: "Bearer token" },
  },
});
```

### HLS Video Streaming

Stream HLS video with native fallback support.

```javascript
const videoElement = document.querySelector("video");

const stream = createStream({
  type: "hls",
  url: "https://example.com/stream.m3u8",
  video: videoElement,
});

// Listen for HLS-specific events
stream.on("message", (event) => {
  if (event.event === "hls:loaded") {
    console.log("HLS stream loaded");
  }
});
```

### WebRTC Data Channels

Real-time peer-to-peer data streaming.

```javascript
const stream = createStream({
  type: "webrtc",
  createPeer: () =>
    new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    }),
  onTrack: (mediaStream) => {
    // Handle incoming media streams
    videoElement.srcObject = mediaStream;
  },
  dataChannelLabel: "chat",
});
```

## ⚙️ Configuration Options

### Base Options (All Protocols)

```javascript
const stream = createStream({
  type: "websocket", // or 'sse', 'http', 'long-polling', 'hls', 'webrtc'
  url: "wss://example.com",

  // Buffer management
  bufferLimit: 500, // Max messages to keep in memory

  // Reconnection settings
  autoReconnect: true, // Auto-reconnect on disconnect
  maxRetries: 10, // Max reconnection attempts

  // Heartbeat (if supported by protocol)
  heartbeatMs: 30000, // Send ping every 30 seconds

  // Exponential backoff configuration
  backoff: {
    baseMs: 500, // Initial delay
    maxMs: 15000, // Maximum delay
    factor: 2, // Exponential factor
    jitter: true, // Add randomization
  },
});
```

### Advanced WebSocket Options

```javascript
const stream = createStream({
  type: "websocket",
  url: "wss://example.com/ws",
  protocols: ["v1", "v2"], // WebSocket subprotocols
  binaryType: "arraybuffer", // 'blob' | 'arraybuffer'
});
```

### Advanced HTTP Options

```javascript
const stream = createStream({
  type: "http",
  url: "https://api.example.com/stream",
  requestInit: {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer your-token",
    },
    body: JSON.stringify({ query: "streaming-data" }),
    credentials: "include", // Include cookies
  },
});
```

## 📡 Event Handling

All streams emit the same standard events:

```javascript
const stream = createStream({
  /* config */
});

// Connection lifecycle
stream.on("open", () => {
  console.log("Stream connected");
});

stream.on("close", () => {
  console.log("Stream closed");
});

stream.on("error", (error) => {
  console.error("Stream error:", error);
});

// Data events
stream.on("message", (data) => {
  console.log("Received data:", data);
});

// Status changes
stream.on("status", (status) => {
  // status: 'idle' | 'connecting' | 'open' | 'closing' | 'closed' | 'error'
  console.log("Status changed to:", status);
});

// Cleanup
const unsubscribe = stream.on("message", handler);
unsubscribe(); // Remove listener
```

## 🎮 Stream Control

```javascript
// Open connection
await stream.open();

// Send data (WebSocket/WebRTC only)
stream.send("Hello Server!");
stream.send({ type: "chat", message: "Hello!" });

// Check current state
console.log(stream.state.status); // Current status
console.log(stream.state.isOpen); // Boolean connection state
console.log(stream.state.messages); // Message buffer
console.log(stream.state.error); // Last error

// Close connection
await stream.close();
```

## 🌐 Browser Support

### Core Features

| Browser       | WebSocket | SSE | HTTP Stream | Long Poll |
| ------------- | --------- | --- | ----------- | --------- |
| Chrome 16+    | ✅        | ✅  | ✅          | ✅        |
| Firefox 11+   | ✅        | ✅  | ✅          | ✅        |
| Safari 7+     | ✅        | ✅  | ✅          | ✅        |
| Edge 12+      | ✅        | ✅  | ✅          | ✅        |
| iOS Safari 7+ | ✅        | ✅  | ✅          | ✅        |
| Android 4.4+  | ✅        | ✅  | ✅          | ✅        |

### Advanced Features

| Feature             | Support                             | Notes                             |
| ------------------- | ----------------------------------- | --------------------------------- |
| **HLS Streaming**   | Safari (native), Others (hls.js)    | Requires `hls.js` peer dependency |
| **WebRTC**          | Chrome 23+, Firefox 22+, Safari 11+ | Full RTCPeerConnection support    |
| **React Hooks**     | React 16.8+                         | Requires `react` peer dependency  |
| **Vue Composables** | Vue 3.0+                            | Requires `vue` peer dependency    |

### Environment Support

- ✅ **Browsers**: All modern browsers
- ✅ **React Native**: WebSocket, HTTP, Long polling
- ✅ **Node.js**: HTTP, Long polling (with polyfills)
- ✅ **Electron**: Full support
- ✅ **Web Workers**: Core functionality

## 🏗️ Framework Integration

### React Integration

```jsx
import { useStream } from "js-streaming/react";

// Basic usage
const { messages, status, error, isOpen, send } = useStream({
  type: "websocket",
  url: "wss://api.example.com",
});

// With TypeScript
interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
}

const { messages } =
  useStream <
  ChatMessage >
  {
    type: "websocket",
    url: "wss://chat.example.com",
  };
```

### Vue Integration

```vue
<script setup>
import { useStream } from "js-streaming/vue";

// Basic usage
const { messages, status, error, isOpen, send } = useStream({
  type: "sse",
  url: "https://api.example.com/events",
});

// With TypeScript
interface ServerEvent {
  type: string;
  payload: any;
}

const { messages } =
  useStream <
  ServerEvent >
  {
    type: "sse",
    url: "https://events.example.com",
  };
</script>
```

## 🔄 Error Handling & Reconnection

The library includes sophisticated error handling and reconnection logic:

```javascript
const stream = createStream({
  type: "websocket",
  url: "wss://unreliable-server.com",

  // Reconnection configuration
  autoReconnect: true,
  maxRetries: 5,

  // Exponential backoff with jitter
  backoff: {
    baseMs: 1000, // Start with 1 second
    maxMs: 30000, // Cap at 30 seconds
    factor: 1.5, // Multiply delay by 1.5x each attempt
    jitter: true, // Add randomization to prevent thundering herd
  },
});

// Handle different error scenarios
stream.on("error", (error) => {
  if (error.message.includes("timeout")) {
    console.log("Connection timed out, will retry...");
  } else if (error.message.includes("refused")) {
    console.log("Connection refused, server may be down");
  }
});

// Monitor retry attempts
let retryCount = 0;
stream.on("status", (status) => {
  if (status === "connecting" && retryCount > 0) {
    console.log(`Retry attempt ${retryCount}...`);
  } else if (status === "open") {
    retryCount = 0; // Reset on successful connection
  }
});
```

## 📊 Performance & Memory Management

### Message Buffering

```javascript
const stream = createStream({
  type: "websocket",
  url: "wss://high-volume-stream.com",
  bufferLimit: 100, // Keep only last 100 messages in memory
});

// Access message buffer
console.log(stream.state.messages.length); // Current buffer size
```

### Memory Cleanup

```javascript
// React - automatic cleanup on unmount
function Component() {
  const stream = useStream({
    /* config */
  });
  // Automatically cleaned up when component unmounts
  return <div>...</div>;
}

// Manual cleanup
const stream = createStream({
  /* config */
});
await stream.open();

// Later...
await stream.close(); // Closes connection and cleans up listeners
```

## 🛠️ Development & Testing

### Local Development

```bash
# Clone repository
git clone https://github.com/your-repo/js-streaming.git
cd js-streaming

# Install dependencies
npm install

# Build library
npm run build

# Start development server
npm run dev

# Run demo server
npm run demo
```

### Testing Streams

```javascript
// Mock stream for testing
const mockStream = createStream({
  type: "websocket",
  url: "ws://localhost:8080/test",
});

// Test connection
await mockStream.open();
console.assert(mockStream.state.isOpen === true);

// Test message handling
mockStream.on("message", (data) => {
  console.log("Test received:", data);
});

mockStream.send({ test: "message" });
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/your-repo/js-streaming.git
cd js-streaming
npm install
npm run build
```

### Adding New Adapters

```javascript
// src/adapters/myprotocol.ts
export function myProtocolAdapter(core: StreamCore, opts: MyProtocolOptions) {
  return {
    async open() {
      // Implementation
      core._onOpen();
    },
    async close() {
      // Implementation
      core._onClose();
    },
    send(data: unknown) {
      // Implementation (optional)
    },
  };
}
```

## 📄 License

MIT License. See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript for type safety
- Inspired by modern streaming needs
- Optimized for performance and developer experience

---

<div align="center">
  <strong>js-streaming</strong> - Universal streaming for modern JavaScript applications
</div>
