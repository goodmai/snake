export type SessionInfo = { sessionId: string };

export class GameLogger {
  private sessionId: string | null = null;
  private startedAt = 0;
  private commands: string[] = [];

  async start(): Promise<SessionInfo> {
    const resp = await fetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: (window as any).Telegram?.WebApp?.initData || '' }),
    });
    const json = await resp.json();
    this.sessionId = json.sessionId;
    this.startedAt = performance.now();
    return json;
  }

  async event(type: string, payload: any): Promise<void> {
    if (!this.sessionId) return;
    try {
      await fetch('/api/session/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, type, ts: Date.now(), payload }),
      });
    } catch {}
  }

  pushCmd(sym: string): void {
    this.commands.push(sym);
  }

  async finish(score: number): Promise<void> {
    if (!this.sessionId) return;
    const durationMs = Math.max(0, Math.round(performance.now() - this.startedAt));
    try {
      await fetch('/api/session/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, score, durationMs, seq: this.commands.join('') }),
      });
    } catch {}
  }
}
