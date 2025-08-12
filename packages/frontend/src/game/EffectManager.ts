import { GameConfig, PowerUp } from '../config';
import type { GameState } from './GameState';

export class EffectManager {
  private until: Record<string, number> = {};
  private shieldHits: number = 0;
  private laserCharged: boolean = false;
  private portals: { a?: {x:number;y:number}, b?: {x:number;y:number} } = {};
  private turretCooldown: number = 0;

  activate(effect: PowerUp, now: number, gs: GameState): void {
    const E = GameConfig.EFFECTS;
    switch (effect) {
      case 'INFERNO': this.until['INFERNO'] = now + E.INFERNO_MS; break;
      case 'ICE': this.until['ICE'] = now + E.ICE_MS; break;
      case 'PHASE': this.until['PHASE'] = now + E.PHASE_MS; break;
      case 'BLACKHOLE': this.until['BLACKHOLE'] = now + E.BLACK_HOLE_MS; break;
      case 'SUPERSONIC': this.until['SUPERSONIC'] = now + E.SUPERSONIC_MS; break;
      case 'SHIELD': this.until['SHIELD'] = now + E.SHIELD_MS; this.shieldHits = 1; break;
      case 'MULTIPLIER': this.until['MULTIPLIER'] = now + E.MULTIPLIER_MS; break;
      case 'REPULSOR': this.until['REPULSOR'] = now + E.REPULSOR_MS; break;
      case 'MAGNET': this.until['MAGNET'] = now + (E.REPULSOR_MS || 5000); break;
      case 'LASERBEAM': this.laserCharged = true; break;
      case 'EMP': this.clearAllExcept('EMP'); this.until['EMP'] = now + 1000; break;
      case 'TURRET': this.until['TURRET'] = now + 5000; this.turretCooldown = 0; break;
      case 'WORMHOLE': this.until['WORMHOLE'] = now + 10000; this.createPortals(gs); break;
      case 'GOLD_RUSH': gs.score += 250; break;
      default: break;
    }
  }

  getSpeedMultiplier(now: number, base: number): number {
    let mult = base;
    if (now < (this.until['INFERNO'] || 0)) mult *= 1/1.5;
    if (now < (this.until['SUPERSONIC'] || 0)) mult *= 1/2.0;
    if (now < (this.until['ICE'] || 0)) mult *= 2.0;
    return mult;
  }

  isGhost(now: number): boolean { return now < (this.until['PHASE'] || 0); }
  isInvertControls(now: number): boolean { return now < (this.until['BLACKHOLE'] || 0); }
  isInvulnerable(now: number): boolean { return now < (this.until['SUPERSONIC'] || 0) || (this.shieldHits > 0 && now < (this.until['SHIELD']||0)); }
  consumeShield(now: number): void { if (now < (this.until['SHIELD']||0) && this.shieldHits > 0) this.shieldHits = 0; }
  getScoreMultiplier(now: number): number { return now < (this.until['MULTIPLIER'] || 0) ? 2 : 1; }
  isLaserCharged(): boolean { return this.laserCharged; }
  consumeLaser(): void { this.laserCharged = false; }

  onTick(gs: GameState, now: number): void {
    // Repulsor: push food away from head
    if (now < (this.until['REPULSOR'] || 0)) {
      const head = gs.snake.getHead();
      const dx = gs.food.position.x - head.x;
      const dy = gs.food.position.y - head.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 0 && dist <= 3) {
        const stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        const stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
        if (Math.abs(dx) >= Math.abs(dy)) gs.food.position.x += stepX; else gs.food.position.y += stepY;
      }
    }
    // Magnet: pull food toward head within radius 4
    if (now < (this.until['MAGNET'] || 0)) {
      const head = gs.snake.getHead();
      const dx = head.x - gs.food.position.x;
      const dy = head.y - gs.food.position.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 1 && dist <= 4) {
        gs.food.position.x += Math.sign(dx);
        gs.food.position.y += Math.sign(dy);
      }
    }
    // Turret: auto eat if aligned and no obstacle (we don't have obstacles), limited by cooldown
    if (now < (this.until['TURRET'] || 0)) {
      if (this.turretCooldown <= 0) {
        const h = gs.snake.getHead();
        const f = gs.food.position;
        if (h.x === f.x || h.y === f.y) {
          // consume food
          (gs as any).onEatFood();
          this.turretCooldown = 6; // ~6 ticks cooldown
        }
      } else {
        this.turretCooldown--;
      }
    }
    // Wormhole teleport
    if (now < (this.until['WORMHOLE'] || 0) && this.portals.a && this.portals.b) {
      const h = gs.snake.getHead();
      if (h.x === this.portals.a.x && h.y === this.portals.a.y) {
        h.x = this.portals.b.x; h.y = this.portals.b.y;
      } else if (h.x === this.portals.b.x && h.y === this.portals.b.y) {
        h.x = this.portals.a.x; h.y = this.portals.a.y;
      }
    }
  }

  private createPortals(gs: GameState) {
    const { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } = GameConfig;
    const maxX = Math.floor(CANVAS_WIDTH / GRID_SIZE);
    const maxY = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
    const randCell = () => ({ x: Math.floor(Math.random()*maxX), y: Math.floor(Math.random()*maxY) });
    this.portals.a = randCell(); this.portals.b = randCell();
  }

  private clearAllExcept(name: string) {
    Object.keys(this.until).forEach(k => { if (k !== name) delete this.until[k]; });
    this.shieldHits = 0; this.laserCharged = false; this.turretCooldown = 0; this.portals = {};
  }
}
