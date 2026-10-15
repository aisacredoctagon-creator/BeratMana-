import { describe, expect, it } from 'vitest';
import { countsText, shareMessage } from './over-screen';

describe('panel akhir: teks hitungan dan Bagikan', () => {
  it('countsText = benar / dijawab; 0 / 0 aman; kiri selalu ≤ kanan', () => {
    expect(countsText({ correct: 12, answered: 15 })).toBe('12 / 15');
    expect(countsText({ correct: 0, answered: 0 })).toBe('0 / 0');
    expect(countsText({ correct: 7, answered: 7 })).toBe('7 / 7');
    for (let answered = 0; answered <= 40; answered++) {
      for (let correct = 0; correct <= answered; correct++) {
        const [l, r] = countsText({ correct, answered }).split(' / ').map(Number) as [number, number];
        expect(l).toBeLessThanOrEqual(r);
      }
    }
  });

  it('teks Bagikan memakai "combo terpanjang", bukan "streak"', () => {
    const msg = shareMessage({
      summary: { score: 1200, correct: 12, wrong: 3, answered: 15, accuracy: 80, maxStreak: 9, reason: 'time' },
      settings: { mode: 'time', difficulty: 'medium', types: ['add'] },
      best: 1200,
      isRecord: false,
    });
    expect(msg).toContain('combo terpanjang 9');
    expect(msg.toLowerCase()).not.toContain('streak');
  });
});
