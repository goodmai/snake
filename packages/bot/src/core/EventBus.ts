import { EventEmitter } from 'events';

export type BusEvent =
  | { type: 'log'; payload: any }
  | { type: 'food-spawn'; payload: { x: number; y: number; color: string } }
  | { type: 'score'; payload: { userId: number; score: number } };

class Bus extends EventEmitter {
  emitEvent(evt: BusEvent) {
    this.emit('event', evt);
  }
  onEvent(listener: (evt: BusEvent) => void) {
    this.on('event', listener);
    return () => this.off('event', listener);
  }
}

export const eventBus = new Bus();
