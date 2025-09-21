import { javascript, jsx, vue, hls, webrtc, advanced } from "./examples.js";
import { createStream } from "../dist/index.mjs";

// Global variables
let currentStream = null;
let startTime = null;
let updateInterval = null;

// Protocol configurations
const protocols = {
  websocket: {
    name: "WebSocket",
    url: "wss://echo.websocket.org",
    canSend: true,
    hasVideo: false,
  },
  sse: {
    name: "Server-Sent Events",
    url: "https://demo.mercure.rocks/.well-known/mercure",
    canSend: false,
    hasVideo: false,
  },
  http: {
    name: "HTTP Streaming",
    url: "https://httpbin.org/stream/10",
    canSend: false,
    hasVideo: false,
  },
  longpolling: {
    name: "Long Polling",
    url: "https://httpbin.org/delay/2",
    canSend: false,
    hasVideo: false,
  },
  hls: {
    name: "HLS Video Streaming",
    url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    canSend: false,
    hasVideo: true,
  },
  webrtc: {
    name: "WebRTC Data Channels",
    url: "stun:stun.l.google.com:19302",
    canSend: true,
    hasVideo: false,
  },
  socketio: {
    name: "Socket.IO",
    url: "http://localhost:3000",
    canSend: true,
    hasVideo: false,
  },
};

// Example Here

// Code examples
const examples = {
  basic: {
    title: "Basic Usage",
    language: "javascript",
    code: javascript,
  },
  react: {
    title: "React Hook Integration",
    language: "jsx",
    code: jsx,
  },
  vue: {
    title: "Vue Composable Integration",
    language: "javascript",
    code: vue,
  },
  hls: {
    title: "HLS Streaming",
    language: "javascript",
    code: hls,
  },
  webrtc: {
    title: "WebRTC Data Channels",
    language: "javascript",
    code: webrtc,
  },
  advanced: {
    title: "Advanced Usage",
    language: "javascript",
    code: advanced,
  },
};

// Mock Stream class for demo - Fixed version
class MockStream {
  constructor(config) {
    this.config = config;
    this.isOpen = false;
    this.listeners = {};
    this.messageCount = 0;
    this.mockInterval = null;
    this.retryCount = 0;
    this.reconnectTimeout = null;
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    const index = this.listeners[event].indexOf(callback);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }

  async open() {
    if (this.isOpen) return;

    log("info", `Connecting to ${this.config.type.toUpperCase()}...`);
    updateStatus("connecting");

    try {
      // Simulate connection delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1500)
      );

      // Simulate occasional failures (20% chance)
      if (Math.random() < 0.2 && this.retryCount === 0) {
        throw new Error("Connection timeout (demo simulation)");
      }

      this.isOpen = true;
      this.retryCount = 0;
      updateStatus("connected");
      this.emit("open");
      log("success", `Connected to ${this.config.type.toUpperCase()}`);

      // Start mock data
      this.startMockData();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  handleConnectionError(error) {
    updateStatus("error");
    this.emit("error", error);
    log("error", error.message);

    // Auto-reconnect logic
    if (this.config.autoReconnect && this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000);

      log(
        "warning",
        `Retrying in ${delay}ms... (attempt ${this.retryCount}/${this.config.maxRetries})`
      );

      this.reconnectTimeout = setTimeout(() => {
        this.open();
      }, delay);
    }
  }

  close() {
    this.isOpen = false;

    // Clear intervals and timeouts
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    updateStatus("disconnected");
    this.emit("close");
    log("info", "Connection closed");
  }

  send(data) {
    if (!this.isOpen) {
      log("warning", "Cannot send: not connected");
      return;
    }

    const message = typeof data === "string" ? data : JSON.stringify(data);
    log("info", `Sent: ${message}`);

    // Echo for WebSocket
    if (this.config.type === "websocket") {
      setTimeout(() => {
        if (!this.isOpen) return;

        const echo = {
          type: "echo",
          original: data,
          timestamp: new Date().toISOString(),
          id: generateId(),
        };
        this.emit("message", echo);
        log("success", `Echo: ${JSON.stringify(echo)}`);
        updateMessageCount();
      }, 100 + Math.random() * 300);
    }
  }

  startMockData() {
    if (this.config.type === "hls") return; // HLS handles differently

    const generators = {
      websocket: () => ({
        type: "chat",
        user: randomChoice(["Alice", "Bob", "Charlie", "Diana"]),
        message: randomChoice([
          "Hello everyone!",
          "How is everyone doing?",
          "Great to be here!",
          "Nice weather today",
          "Anyone up for a chat?",
        ]),
        timestamp: new Date().toISOString(),
        id: generateId(),
      }),
      sse: () => ({
        event: "stock_update",
        data: {
          symbol: randomChoice(["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]),
          price: (150 + Math.random() * 100).toFixed(2),
          change: (Math.random() * 20 - 10).toFixed(2),
          volume: Math.floor(Math.random() * 1000000),
        },
        timestamp: new Date().toISOString(),
      }),
      http: () => ({
        chunk: Math.floor(Math.random() * 1000),
        progress: Math.floor(Math.random() * 100),
        size: Math.floor(Math.random() * 1024) + "KB",
        timestamp: new Date().toISOString(),
      }),
      longpolling: () => ({
        poll: "response",
        data: Math.floor(Math.random() * 100),
        status: randomChoice(["processing", "completed", "pending"]),
        items: Math.floor(Math.random() * 50),
        timestamp: new Date().toISOString(),
      }),
      webrtc: () => ({
        peer: "message",
        type: randomChoice(["data", "media", "control"]),
        payload: "P2P communication data",
        latency: Math.floor(Math.random() * 50) + "ms",
        timestamp: new Date().toISOString(),
      }),
      socketio: () => ({
        event: randomChoice(["chat", "notification", "update"]),
        data: {
          user: randomChoice(["Alice", "Bob", "Charlie"]),
          message: randomChoice([
            "Hello from Socket.IO!",
            "This is a test event",
            "Real-time update received",
          ]),
        },
        timestamp: new Date().toISOString(),
      }),
    };

    const generator = generators[this.config.type] || generators.websocket;

    this.mockInterval = setInterval(() => {
      if (!this.isOpen) return;

      const message = generator();
      this.emit("message", message);

      const preview = JSON.stringify(message).substring(0, 100);
      log(
        "success",
        `Received: ${preview}${preview.length === 100 ? "..." : ""}`
      );
      updateMessageCount();
    }, 2000 + Math.random() * 4000);
  }
}

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// UI Helper functions - Fixed versions
function log(type, message) {
  const container = document.getElementById("logContainer");
  if (!container) return;

  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;

  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<span class="log-time">[${time}]</span><span>${escapeHtml(
    message
  )}</span>`;

  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;

  // Keep only last 50 entries
  while (container.children.length > 50) {
    container.removeChild(container.firstChild);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateStatus(status) {
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");

  if (dot && text) {
    dot.className = `status-dot ${status}`;
    text.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function updateMessageCount() {
  const count = document.getElementById("messageCount");
  if (count) {
    count.textContent = parseInt(count.textContent || "0") + 1;
  }
}

function updateConnectionTime() {
  if (startTime && currentStream && currentStream.isOpen) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeElement = document.getElementById("connectionTime");
    if (timeElement) {
      timeElement.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }
}

function clearLogs() {
  const container = document.getElementById("logContainer");
  if (container) {
    container.innerHTML = `
            <div class="log-entry info">
                <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
                <span>Logs cleared</span>
            </div>
        `;
  }

  const messageCount = document.getElementById("messageCount");
  if (messageCount) {
    messageCount.textContent = "0";
  }
}

// Protocol switching - Fixed version
function switchProtocol(protocolName) {
  const protocol = protocols[protocolName];
  if (!protocol) {
    console.error("Unknown protocol:", protocolName);
    return;
  }

  // Update tabs
  document.querySelectorAll(".demo-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.protocol === protocolName);
  });

  // Update URL
  const urlInput = document.getElementById("streamUrl");
  if (urlInput) {
    urlInput.value = protocol.url;
  }

  // Show/hide send message
  const sendGroup = document.getElementById("sendMessageGroup");
  if (sendGroup) {
    sendGroup.style.display = protocol.canSend ? "block" : "none";
  }

  // Show/hide video
  const videoContainer = document.getElementById("videoContainer");
  if (videoContainer) {
    videoContainer.classList.toggle("show", protocol.hasVideo);
  }

  // Disconnect current stream
  if (currentStream) {
    disconnect();
  }

  log("info", `Switched to ${protocol.name}`);
}

// Connection functions - Fixed versions
async function connect() {
  const activeTab = document.querySelector(".demo-tab.active");
  if (!activeTab) {
    log("error", "No protocol selected");
    return;
  }

  const protocol = activeTab.dataset.protocol;
  const urlInput = document.getElementById("streamUrl");
  const autoReconnectSelect = document.getElementById("autoReconnect");
  const maxRetriesInput = document.getElementById("maxRetries");

  const url = urlInput.value.trim();
  const autoReconnect = autoReconnectSelect.value === "true";
  const maxRetries = parseInt(maxRetriesInput.value) || 5;

  if (currentStream) {
    await disconnect();
  }

  try {
    if (protocol === "hls") {
      await connectHLS({ url });
      return;
    }

    currentStream = createStream({
      type: protocol, // "websocket" | "sse" | "http" | "long-polling" | "hls" | "webrtc" | "socketio"
      url,
      autoReconnect,
      maxRetries,
    });

    currentStream.on("open", () => {
      log("success", `${protocol.toUpperCase()} connected`);
      updateStatus("connected");
      startTime = Date.now();
      toggleConnectButtons(true);
    });

    currentStream.on("close", () => {
      log("warning", "Disconnected");
      updateStatus("disconnected");
      toggleConnectButtons(false);
    });

    currentStream.on("error", (err) => {
      log("error", `Error: ${err.message}`);
      updateStatus("error");
    });

    // 🟢 Events
    currentStream.on("message", (msg) => {
      log("success", `Message: ${JSON.stringify(msg)}`);
      updateMessageCount();
    });

    await currentStream.open();
  } catch (error) {
    log("error", `Connection failed: ${error.message}`);
  }
}

async function connectHLS(config) {
  const video = document.getElementById("videoPlayer");
  if (!video) {
    log("error", "Video element not found");
    return;
  }

  try {
    if (video.canPlayType("application/vnd.apple.mpegURL")) {
      // Native HLS support (Safari)
      video.src = config.url;

      const onLoadedData = () => {
        log("success", "HLS stream loaded (native support)");
        updateStatus("connected");
        startTime = Date.now();
        toggleConnectButtons(true);
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("error", onError);
      };

      const onError = (e) => {
        log("error", `HLS error: ${e.message || "Unknown error"}`);
        updateStatus("error");
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("error", onError);
      };

      video.addEventListener("loadeddata", onLoadedData);
      video.addEventListener("error", onError);
    } else if (typeof Hls !== "undefined" && Hls.isSupported()) {
      // hls.js support
      const hls = new Hls();
      hls.loadSource(config.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        log("success", "HLS stream loaded (hls.js)");
        updateStatus("connected");
        startTime = Date.now();
        toggleConnectButtons(true);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("Network error, retrying manifest...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("Media error, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      log("info", "HLS.js would be loaded here for full browser support");
      updateStatus("connected");
      startTime = Date.now();
      toggleConnectButtons(true);
    }
  } catch (error) {
    log("error", `HLS setup failed: ${error.message}`);
    updateStatus("error");
  }
}

async function disconnect() {
  if (currentStream) {
    if (currentStream.disconnect) {
      // Socket.IO
      currentStream.disconnect();
    } else if (currentStream.close) {
      // MockStream
      await currentStream.close();
    }
    currentStream = null;
  }

  const video = document.getElementById("videoPlayer");
  if (video && video.src) {
    video.src = "";
    video.load();
  }

  startTime = null;
  toggleConnectButtons(false);
  updateStatus("disconnected");
}

function toggleConnectButtons(connected) {
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (connectBtn && disconnectBtn) {
    connectBtn.disabled = connected;
    disconnectBtn.disabled = !connected;
  }
}

function sendMessage() {
  if (!currentStream) {
    log("warning", "Not connected");
    return;
  }

  const input = document.getElementById("messageInput");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  currentStream.send({
    text: message,
    timestamp: new Date().toISOString(),
  });

  log("info", `Sent: ${message}`);
  input.value = "";
}

// Example switching - Fixed version
function switchExample(exampleName) {
  const example = examples[exampleName];
  if (!example) {
    console.error("Unknown example:", exampleName);
    return;
  }

  // Update tabs
  document.querySelectorAll(".example-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.example === exampleName);
  });

  // Update content
  const titleElement = document.getElementById("exampleTitle");
  const codeElement = document.getElementById("codeBlock");

  if (titleElement) {
    titleElement.textContent = example.title;
  }

  if (codeElement) {
    codeElement.innerHTML = `<code class="language-${
      example.language
    }">${escapeHtml(example.code)}</code>`;

    // Highlight syntax
    if (window.Prism) {
      const codeBlock = codeElement.querySelector("code");
      if (codeBlock) {
        window.Prism.highlightElement(codeBlock);
      }
    }
  }
}
function copyCode() {
  const code = document.querySelector("#codeBlock code");
  if (!code) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(code.textContent)
      .then(() => {
        const btn = document.querySelector(".copy-btn");
        if (btn) {
          const original = btn.textContent;
          btn.textContent = "✅ Copied!";
          setTimeout(() => (btn.textContent = original), 2000);
        }
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        fallbackCopyTextToClipboard(code.textContent);
      });
  } else {
    fallbackCopyTextToClipboard(code.textContent);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
    const btn = document.querySelector(".copy-btn");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "✅ Copied!";
      setTimeout(() => (btn.textContent = original), 2000);
    }
  } catch (err) {
    console.error("Fallback copy failed:", err);
  }

  document.body.removeChild(textArea);
}

// Particles animation - Fixed version
function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    const size = Math.random() * 4 + 2;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const duration = Math.random() * 3 + 3;
    const delay = Math.random() * 2;

    particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
            opacity: ${Math.random() * 0.5 + 0.1};
        `;

    container.appendChild(particle);
  }
}

// Navbar scroll effect - Fixed version
function setupNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  let ticking = false;

  function updateNavbar() {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  });
}

// Event listeners - Fixed version
function setupEventListeners() {
  // Demo tabs
  document.querySelectorAll(".demo-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const protocol = tab.dataset.protocol;
      if (protocol) {
        switchProtocol(protocol);
      }
    });
  });

  // Demo controls
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");
  const clearBtn = document.getElementById("clearBtn");
  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("messageInput");

  if (connectBtn) connectBtn.addEventListener("click", connect);
  if (disconnectBtn) disconnectBtn.addEventListener("click", disconnect);
  if (clearBtn) clearBtn.addEventListener("click", clearLogs);
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);

  // Send on Enter
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Protocol cards
  document.querySelectorAll(".protocol-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const protocol = card.dataset.protocol;
      if (protocol) {
        const demoSection = document.getElementById("demo");
        if (demoSection) {
          demoSection.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => switchProtocol(protocol), 500);
        }
      }
    });
  });

  // Example tabs
  document.querySelectorAll(".example-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault(); // مهم علشان يمنع الـ refresh
      const example = tab.dataset.example;
      if (example) {
        switchExample(example);
      }
    });
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Recreate particles on resize
      const particlesContainer = document.getElementById("particles");
      if (particlesContainer) {
        particlesContainer.innerHTML = "";
        createParticles();
      }
    }, 250);
  });
}

// Initialize - Fixed version
function init() {
  try {
    setupNavbar();
    setupEventListeners();
    createParticles();

    // Initialize with WebSocket protocol
    switchProtocol("websocket");
    switchExample("basic");

    // Start connection time update interval
    updateInterval = setInterval(updateConnectionTime, 1000);

    log("info", "Application initialized successfully");
  } catch (error) {
    console.error("Initialization error:", error);
    log("error", `Failed to initialize: ${error.message}`);
  }
}

// Cleanup function
function cleanup() {
  if (currentStream) {
    currentStream.close();
    currentStream = null;
  }

  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }

  startTime = null;
}

// Handle page visibility changes
function handleVisibilityChange() {
  if (document.hidden) {
    // Page is hidden, reduce activity
    if (currentStream && currentStream.mockInterval) {
      clearInterval(currentStream.mockInterval);
      currentStream.mockInterval = null;
    }
  } else {
    // Page is visible, resume activity
    if (currentStream && currentStream.isOpen && !currentStream.mockInterval) {
      currentStream.startMockData();
    }
  }
}

// Error boundary for uncaught errors
function setupErrorHandling() {
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
    log(
      "error",
      `Application error: ${event.error?.message || "Unknown error"}`
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    log(
      "error",
      `Promise rejection: ${event.reason?.message || "Unknown error"}`
    );
    event.preventDefault(); // Prevent default browser behavior
  });
}

// Performance monitoring
function logPerformance() {
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log(`Page load time: ${loadTime}ms`);
  }
}

// Start when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  init();
  setupErrorHandling();

  // Handle page visibility changes
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Cleanup on page unload
  window.addEventListener("beforeunload", cleanup);

  // Log performance after load
  window.addEventListener("load", () => {
    setTimeout(logPerformance, 100);
  });
});

// Global functions for HTML onclick handlers
window.copyCode = copyCode;
window.switchProtocol = switchProtocol;
window.switchExample = switchExample;

// Export for potential module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MockStream,
    protocols,
    examples,
    switchProtocol,
    switchExample,
    connect,
    disconnect,
    sendMessage,
    copyCode,
    init,
    cleanup,
  };
}
