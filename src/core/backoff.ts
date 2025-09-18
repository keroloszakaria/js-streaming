export function createBackoff(opts?: {
  baseMs?: number;
  maxMs?: number;
  factor?: number;
  jitter?: boolean;
}) {
  const base = opts?.baseMs ?? 500;
  const max = opts?.maxMs ?? 15000;
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
    },
  };
}
