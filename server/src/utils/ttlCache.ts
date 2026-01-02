type Entry<V> = {
  value: V;
  expiresAt: number;
};

export class TTLCache<V> {
  private store = new Map<string, Entry<V>>();
  private inFlight = new Map<string, Promise<V>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): V | null {
    const e = this.store.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return e.value;
  }

  set(key: string, value: V) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  del(key: string) {
    this.store.delete(key);
    this.inFlight.delete(key);
  }

  clear() {
    this.store.clear();
    this.inFlight.clear();
  }

  /**
   * getOrCompute:
   * - If there is a valid value in the cache -> returns immediately
   * - If there is not, but there is already a running machine for the same key -> returns the same promise
   * - Else -> runs the machine once, saves in the cache and returns
   */
  async getOrCompute(key: string, compute: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const p = (async () => {
      try {
        const v = await compute();
        this.set(key, v);
        return v;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, p);
    return p;
  }
}
