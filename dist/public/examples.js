export const javascript = `
  // Install the library
  npm install js-streaming

  // Basic WebSocket example
  import { createStream } from 'js-streaming';

  const stream = createStream({
    type: 'websocket',
    url: 'wss://api.example.com/ws',
    autoReconnect: true,
    maxRetries: 5
  });

  // Listen for events
  stream.on('open', () => {
    console.log('✅ Connected!');
  });

  stream.on('message', (data) => {
    console.log('📨 Received:', data);
  });

  stream.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  stream.on('close', () => {
    console.log('🔴 Disconnected');
  });

  // Connect and send data
  await stream.open();
  stream.send({ message: 'Hello World!' });
`;
export const jsx = `
  import { useState, useEffect } from 'react';
  import { createStream } from 'js-streaming';

  function useStream(config) {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
      const stream = createStream(config);

      stream.on('open', () => {
        setIsConnected(true);
        setError(null);
      });

      stream.on('message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      stream.on('error', (err) => {
        setError(err.message);
      });

      stream.on('close', () => {
        setIsConnected(false);
      });

      stream.open();

      return () => {
        stream.close();
      };
    }, [config.url]); // Reconnect if URL changes

    return { isConnected, messages, error };
  }

  // Usage in a Component
  function ChatComponent() {
    const { isConnected, messages, error } = useStream({
      type: 'websocket',
      url: 'wss://chat.example.com',
      autoReconnect: true
    });

    return (
      <div>
        <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
        {error && <div className="error">{error}</div>}
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i}>{msg.text}</div>
          ))}
        </div>
      </div>
    );
  }
`;
export const vue = `
  import { ref, onMounted, onUnmounted } from 'vue';
  import { createStream } from 'js-streaming';

  export function useStream(config) {
    const isConnected = ref(false);
    const messages = ref([]);
    const error = ref(null);
    let stream;

    onMounted(() => {
      stream = createStream(config);

      stream.on('open', () => {
        isConnected.value = true;
        error.value = null;
      });

      stream.on('message', (data) => {
        messages.value.push(data);
      });

      stream.on('error', (err) => {
        error.value = err.message;
      });

      stream.on('close', () => {
        isConnected.value = false;
      });

      stream.open();
    });

    onUnmounted(() => {
      if (stream) {
        stream.close();
      }
    });

    const sendMessage = (message) => {
      if (stream && isConnected.value) {
        stream.send(message);
      }
    };

    return {
      isConnected,
      messages,
      error,
      sendMessage
    };
  }

  // Usage in a Component
  <template>
    <div class="chat">
      <div class="status">
        {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="messages">
        <div v-for="(msg, i) in messages" :key="i">
          {{ msg.text }}
        </div>
      </div>
      <button @click="sendMessage({ text: 'Hello!' })">
        Send Message
      </button>
    </div>
  </template>

  <script setup>
  const { isConnected, messages, error, sendMessage } = useStream({
    type: 'websocket',
    url: 'wss://chat.example.com',
    autoReconnect: true
  });
  </script>
`;
export const hls = `
  import { createStream } from 'js-streaming';
  import Hls from 'hls.js';

  const videoStream = createStream({
    type: 'hls',
    url: 'https://example.com/live/stream.m3u8',
    autoReconnect: true
  });

  // Set up HLS video player
  const video = document.getElementById('videoPlayer');
  let hls;

  videoStream.on('open', () => {
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(videoStream.config.url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              videoStream.close();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoStream.config.url;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    }
  });

  videoStream.on('close', () => {
    if (hls) {
      hls.destroy();
    }
    video.src = '';
  });

  // Start streaming
  videoStream.open();
`;
export const webrtc = `
  import { createStream } from 'js-streaming';

  const rtcStream = createStream({
    type: 'webrtc',
    url: 'wss://signaling.example.com',
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:turn.example.com:3478',
        username: 'username',
        credential: 'password'
      }
    ],
    dataChannelConfig: {
      ordered: true,
      maxRetransmits: 3
    }
  });

  // Handle connection events
  rtcStream.on('open', () => {
    console.log('🌟 WebRTC connection established');
  });

  rtcStream.on('message', (data) => {
    console.log('📨 Received P2P data:', data);
  });

  rtcStream.on('error', (error) => {
    console.error('❌ WebRTC error:', error);
  });

  rtcStream.on('close', () => {
    console.log('🔴 WebRTC connection closed');
  });

  // Send data through data channel
  rtcStream.on('channelOpen', () => {
    rtcStream.send({
      type: 'message',
      content: 'Hello P2P World!',
      timestamp: Date.now()
    });
  });

  // Connect to peer
  await rtcStream.open();
`;
export const advanced = `
  import { createStream, StreamProtocol } from 'js-streaming';

  // Custom protocol implementation
  class CustomProtocol extends StreamProtocol {
    constructor(config) {
      super(config);
      this.reconnectAttempts = 0;
    }

    async connect() {
      // Custom connection logic
      try {
        await this.customConnect();
        this.emit('open');
      } catch (error) {
        this.handleError(error);
      }
    }

    async disconnect() {
      // Custom disconnection logic
      await this.customDisconnect();
      this.emit('close');
    }

    send(data) {
      // Custom send implementation
      if (!this.isConnected) {
        throw new Error('Not connected');
      }
      this.customSend(data);
    }

    handleMessage(data) {
      // Custom message handling
      const parsed = this.customParse(data);
      this.emit('message', parsed);
    }

    handleError(error) {
      this.emit('error', error);
      if (this.config.autoReconnect && 
          this.reconnectAttempts < this.config.maxRetries) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.getBackoffDelay());
      }
    }

    getBackoffDelay() {
      // Exponential backoff with jitter
      const baseDelay = 1000;
      const maxDelay = 30000;
      const exponential = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, this.reconnectAttempts)
      );
      return exponential + Math.random() * 1000;
    }
  }

  // Usage with custom protocol
  const stream = createStream({
    type: 'custom',
    protocolClass: CustomProtocol,
    url: 'custom://example.com',
    autoReconnect: true,
    maxRetries: 5,
    customOptions: {
      encoding: 'utf-8',
      timeout: 5000
    }
  });

  // Advanced error handling
  stream.on('error', (error) => {
    if (error.code === 'TIMEOUT') {
      console.error('Connection timeout, attempting recovery...');
      stream.reconnect();
    } else if (error.code === 'RATE_LIMIT') {
      console.error('Rate limited, backing off...');
      setTimeout(() => stream.reconnect(), 60000);
    } else {
      console.error('Fatal error:', error);
      stream.close();
    }
  });

  // Message filtering and transformation
  stream.on('message', (data) => {
    if (data.type === 'heartbeat') {
      return; // Ignore heartbeat messages
    }

    // Transform messages before processing
    const enriched = {
      ...data,
      timestamp: Date.now(),
      processed: true
    };

    // Handle different message types
    switch (enriched.type) {
      case 'event':
        handleEvent(enriched);
        break;
      case 'state':
        updateState(enriched);
        break;
      case 'command':
        executeCommand(enriched);
        break;
      default:
        console.warn('Unknown message type:', enriched.type);
    }
  });

  // Batch message sending with rate limiting
  class MessageBatcher {
    constructor(stream, options = {}) {
      this.stream = stream;
      this.queue = [];
      this.timeout = null;
      this.options = {
        maxBatchSize: options.maxBatchSize || 100,
        maxWaitTime: options.maxWaitTime || 1000,
        maxRequestsPerSecond: options.maxRequestsPerSecond || 10
      };
    }

    send(message) {
      this.queue.push(message);

      if (this.queue.length >= this.options.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(
          () => this.flush(), 
          this.options.maxWaitTime
        );
      }
    }

    async flush() {
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }

      if (this.queue.length === 0) return;

      const batch = this.queue.splice(0, this.options.maxBatchSize);
      await this.stream.send({
        type: 'batch',
        messages: batch,
        timestamp: Date.now()
      });

      // Rate limiting
      await new Promise(resolve => 
        setTimeout(resolve, 1000 / this.options.maxRequestsPerSecond)
      );
    }
  }

  // Usage with batcher
  const batcher = new MessageBatcher(stream, {
    maxBatchSize: 50,
    maxWaitTime: 500,
    maxRequestsPerSecond: 5
  });

  // Send messages through batcher
  for (let i = 0; i < 1000; i++) {
    batcher.send({
      id: i,
      type: 'event',
      data: { value: Math.random() }
    });
  }
`;
