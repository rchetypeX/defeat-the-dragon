import { describe, it, expect } from 'vitest';
import { actionForMinutes } from './actions';

describe('actionForMinutes', () => {
  const cases: [number, string][] = [
    [5, "Train"], [15, "Train"], [16, "Eat"], [30, "Eat"],
    [31, "Learn"], [45, "Learn"], [46, "Bathe"], [60, "Bathe"],
    [61, "Sleep"], [75, "Sleep"], [76, "Maintain"], [90, "Maintain"],
    [91, "Fight"], [105, "Fight"], [106, "Adventure"], [120, "Adventure"],
    [3, "Train"], [999, "Adventure"], // clamps
  ];

  cases.forEach(([minutes, expectedAction]) => {
    it(`maps ${minutes} minutes → ${expectedAction}`, () => {
      expect(actionForMinutes(minutes)).toBe(expectedAction);
    });
  });

  it('handles decimal values by rounding', () => {
    expect(actionForMinutes(15.7)).toBe('Eat'); // rounds to 16
    expect(actionForMinutes(30.3)).toBe('Eat'); // rounds to 30
    expect(actionForMinutes(45.9)).toBe('Bathe'); // rounds to 46
  });

  it('clamps values to valid range', () => {
    expect(actionForMinutes(0)).toBe('Train'); // clamps to 5
    expect(actionForMinutes(-10)).toBe('Train'); // clamps to 5
    expect(actionForMinutes(200)).toBe('Adventure'); // clamps to 120
    expect(actionForMinutes(1000)).toBe('Adventure'); // clamps to 120
  });
});
