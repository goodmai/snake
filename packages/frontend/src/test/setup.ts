// Vitest JSDOM setup
// - Stub fetch to avoid real network
// - Set NODE_ENV
globalThis.process = { ...(globalThis.process || {}), env: { NODE_ENV: 'test' } } as any;

if (!(globalThis as any).fetch) {
  (globalThis as any).fetch = async () => ({ ok: true, status: 204, json: async () => ({}) });
}

// Provide minimal performance.now for animations
if (!(globalThis as any).performance) {
  (globalThis as any).performance = { now: () => Date.now() } as any;
}

