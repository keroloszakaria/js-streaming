import { BaseOptions, ListenerMap, StreamState, StreamStatus } from "./types";

export class StreamCore {
  // نخليها loose جوه الكلاس
  private listeners: Record<string, Function[]> = {};

  public state: StreamState = {
    status: "idle",
    retries: 0,
  };

  constructor(private adapter: any, private opts: BaseOptions) {}

  public emit<T extends keyof ListenerMap>(event: T, ...args: ListenerMap[T]) {
    const cbs = this.listeners[event as string];
    if (!cbs) return;
    for (const cb of cbs) {
      (cb as (...a: ListenerMap[T]) => void)(...args);
    }
  }

  public on<T extends keyof ListenerMap>(
    evt: T,
    cb: (...args: ListenerMap[T]) => void
  ): () => void {
    if (!this.listeners[evt as string]) {
      this.listeners[evt as string] = [];
    }
    this.listeners[evt as string].push(cb as Function);
    return () => this.off(evt, cb);
  }

  public off<T extends keyof ListenerMap>(
    evt: T,
    cb: (...args: ListenerMap[T]) => void
  ) {
    const arr = this.listeners[evt as string];
    if (!arr) return;
    this.listeners[evt as string] = arr.filter((fn) => fn !== cb);
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

  send(data: unknown) {
    this.adapter.send(data);
  }
}
