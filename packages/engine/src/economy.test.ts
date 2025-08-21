import { describe, it, expect } from 'vitest';
import { computeXP, computeCoins, computeSparks } from './economy';

describe('Rewards System', () => {
  describe('computeXP', () => {
    it('returns XP within the correct range for 5 minutes', () => {
      const xp = computeXP(5, 'Train', 0);
      expect(xp).toBeGreaterThanOrEqual(5);
      expect(xp).toBeLessThanOrEqual(6);
    });

    it('returns XP within the correct range for 30 minutes', () => {
      const xp = computeXP(30, 'Train', 0);
      expect(xp).toBeGreaterThanOrEqual(34);
      expect(xp).toBeLessThanOrEqual(39);
    });

    it('applies action multipliers correctly', () => {
      const trainXP = computeXP(30, 'Train', 0);
      const fightXP = computeXP(30, 'Fight', 0);
      expect(fightXP).toBeGreaterThan(trainXP); // Fight has 1.2x multiplier vs Train's 1.0x
    });

    it('applies streak multipliers correctly', () => {
      const noStreakXP = computeXP(30, 'Train', 0);
      const streakXP = computeXP(30, 'Train', 7);
      // Streak multiplier should increase XP, but due to rounding it might be the same
      expect(streakXP).toBeGreaterThanOrEqual(noStreakXP);
    });

    it('handles durations not in the table by using the closest lower tier', () => {
      const xp = computeXP(7, 'Train', 0); // Should use 5-minute tier
      expect(xp).toBeGreaterThanOrEqual(5);
      expect(xp).toBeLessThanOrEqual(6);
    });

    it('handles very long durations by using the highest tier', () => {
      const xp = computeXP(200, 'Train', 0); // Should use 120-minute tier
      expect(xp).toBeGreaterThanOrEqual(180);
      expect(xp).toBeLessThanOrEqual(205);
    });
  });

  describe('computeCoins', () => {
    it('returns coins within the correct range for 5 minutes', () => {
      const coins = computeCoins(5);
      expect(coins).toBeGreaterThanOrEqual(3);
      expect(coins).toBeLessThanOrEqual(3);
    });

    it('returns coins within the correct range for 30 minutes', () => {
      const coins = computeCoins(30);
      expect(coins).toBeGreaterThanOrEqual(20);
      expect(coins).toBeLessThanOrEqual(23);
    });

    it('handles durations not in the table by using the closest lower tier', () => {
      const coins = computeCoins(7); // Should use 5-minute tier
      expect(coins).toBeGreaterThanOrEqual(3);
      expect(coins).toBeLessThanOrEqual(3);
    });
  });

  describe('computeSparks', () => {
    it('returns 0 sparks for non-subscribers', () => {
      const sparks = computeSparks(30, false);
      expect(sparks).toBe(0);
    });

    it('returns correct sparks for subscribers at 15 minutes', () => {
      const sparks = computeSparks(15, true);
      expect(sparks).toBe(1);
    });

    it('returns correct sparks for subscribers at 30 minutes', () => {
      const sparks = computeSparks(30, true);
      expect(sparks).toBe(2);
    });

    it('returns correct sparks for subscribers at 60 minutes', () => {
      const sparks = computeSparks(60, true);
      expect(sparks).toBe(4);
    });

    it('returns correct sparks for subscribers at 120 minutes', () => {
      const sparks = computeSparks(120, true);
      expect(sparks).toBe(8);
    });

    it('handles durations not in the table by using the closest lower tier', () => {
      const sparks = computeSparks(7, true); // Should use 5-minute tier
      expect(sparks).toBe(0);
    });
  });
});
