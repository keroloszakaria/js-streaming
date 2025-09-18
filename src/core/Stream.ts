import {
  BaseOptions,
  ListenerMap,
  StreamAdapter,
  StreamAPI,
  StreamState,
  StreamStatus,
} from "./types";
import { createBackoff } from "./backoff";

export class StreamCore implements StreamAPI {
  private _state: StreamState = {
    status: "idle",
    error: null,
    messages: [],
    isOpen: false,
  };
  private listeners: ListenerMap = {
    open: [],
    close: [],
    error: [],
    message: [],
    status: [],
  };
  private adapter: StreamAdapter | null = null;
  private opts: BaseOptions;
  private retrying = false;
  private retries = 0;
  private backoff = createBackoff();

  constructor(adapter: StreamAdapter, opts: BaseOptions) {
    this.adapter = adapter;
    this.opts = {
      bufferLimit: 500,
      autoReconnect: true,
      maxRetries: 10,
      ...opts,
    };
    if (opts.backoff) this.backoff = createBackoff(opts.backoff);
  }

  get state() {
    return this._state;
  }

  private setStatus(s: StreamStatus) {
    this._state.status = s;
    this._state.isOpen = s === "open";
    this.emit("status", s);
  }

  private setError(e: Error) {
    this._state.error = e;
    this.setStatus("error");
    this.emit("error", e);
  }

  private pushMessage(m: unknown) {
    const limit = this.opts.bufferLimit!;
    const arr = this._state.messages;
    arr.push(m);
    if (arr.length > limit) arr.splice(0, arr.length - limit);
    this.emit("message", m);
  }

  // hooks adapters will call:
  public _onOpen = () => {
    this.retries = 0;
    this.backoff.reset();
    this.setStatus("open");
    this.emit("open");
  };
  public _onClose = () => {
    this.setStatus("closed");
    this.emit("close");
    if (
      this.opts.autoReconnect &&
      this.retries < (this.opts.maxRetries ?? 10)
    ) {
      this.retrying = true;
      const delay = this.backoff.next();
      setTimeout(() => this.open(), delay);
    }
  };
  public _onError = (e: Error) => this.setError(e);
  public _onMessage = (m: unknown) => this.pushMessage(m);

  async open(): Promise<void> {
    if (!this.adapter) return;
    this.setStatus("connecting");
    try {
      await this.adapter.open();
      // _onOpen will be called by adapter async event
    } catch (e: any) {
      this.retries++;
      this.setError(e);
      if (
        this.opts.autoReconnect &&
        this.retries <= (this.opts.maxRetries ?? 10)
      ) {
        const delay = this.backoff.next();
        setTimeout(() => this.open(), delay);
      }
    }
  }

  async close(): Promise<void> {
    this.setStatus("closing");
    try {
      await this.adapter?.close();
    } finally {
      this.setStatus("closed");
    }
  }

  send(data: unknown) {
    this.adapter?.send?.(data);
  }

  on<T extends keyof ListenerMap>(evt: T, cb: ListenerMap[T][number]) {
    this.listeners[evt].push(cb as any);
    return () => this.off(evt, cb as any);
  }

  off<T extends keyof ListenerMap>(evt: T, cb: ListenerMap[T][number]) {
    const arr = this.listeners[evt];
    const i = arr.indexOf(cb as any);
    if (i >= 0) arr.splice(i, 1);
  }

  private emit<T extends keyof ListenerMap>(evt: T, payload?: any) {
    for (const cb of this.listeners[evt]) (cb as any)(payload);
  }
}
