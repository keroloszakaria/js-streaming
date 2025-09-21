import { javascript, jsx, vue, hls, webrtc, advanced } from "./examples.js";
import { createStream } from "https://cdn.jsdelivr.net/npm/js-streaming@0.1.5/dist/index.mjs";

// Global variables
let currentStream = null;
let startTime = null;
let updateInterval = null;

// Protocol configurations
const protocols = {
  websocket: {
    name: "WebSocket",
    url: "wss://ws.ifelse.io",
    canSend: true,
    hasVideo: false,
  },
  sse: {
    name: "Server-Sent Events",
    url: "https://stream.wikimedia.org/v2/stream/recentchange",
    canSend: false,
    hasVideo: false,
  },
  http: {
    name: "HTTP Streaming",
    url: "https://httpbin.org/stream/10",
    canSend: false,
    hasVideo: false,
  },
  "long-polling": {
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
  if (currentStream) disconnect();

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
    currentStream = createStream({
      type: protocol, // "websocket" | "sse" | "http" | "long-polling" | "hls" | "webrtc" | "socketio"
      url,
      autoReconnect,
      maxRetries,
      video: document.getElementById("videoPlayer"), // 🟢 مهم عشان HLS
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

    currentStream.on("message", (msg) => {
      log("success", `Message: ${JSON.stringify(msg)}`);
      updateMessageCount();
    });

    await currentStream.open();
  } catch (error) {
    log("error", `Connection failed: ${error.message}`);
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
