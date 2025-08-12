import { describe, it, expect } from 'vitest';
import { pickRandomDistinct } from '../utils/random';
describe('pickRandomDistinct', () => {
    it('returns element from array', () => {
        const arr = [1, 2, 3];
        const v = pickRandomDistinct(arr, 1);
        expect(arr.includes(v)).toBe(true);
    });
    it('avoids previous when possible', () => {
        const arr = ['A', 'B'];
        let retries = 50;
        while (retries--) {
            const v = pickRandomDistinct(arr, 'A');
            if (v !== 'A')
                return;
        }
        throw new Error('did not avoid previous');
    });
});
