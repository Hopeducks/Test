import { describe, it, expect } from 'vitest';
import {
  getWeakStandards,
  getStandardsForUnit,
  accuracyToHeatColor,
} from '../lib/question-pool';
import { standards } from '../data/standards';

// ── E-1: getWeakStandards ──────────────────────────────────────────────────

describe('getWeakStandards', () => {
  it('returns codes for the given unit (5학년 only)', () => {
    const result = getWeakStandards(1, 0.9);
    expect(result.codes.length).toBeGreaterThan(0);
    result.codes.forEach(c => {
      const std = standards.find(s => s.code === c);
      expect(std).toBeDefined();
      expect(std!.unitId).toBe(1);
      expect(std!.gradeLevel).toBe(5);
    });
  });

  it('isWeak=true when correctRate < 0.6', () => {
    expect(getWeakStandards(1, 0.0).isWeak).toBe(true);
    expect(getWeakStandards(1, 0.59).isWeak).toBe(true);
  });

  it('isWeak=false when correctRate >= 0.6', () => {
    expect(getWeakStandards(1, 0.6).isWeak).toBe(false);
    expect(getWeakStandards(1, 1.0).isWeak).toBe(false);
  });

  it('returns correct unitId in result', () => {
    for (const u of [1, 2, 3, 4, 5]) {
      expect(getWeakStandards(u, 0.5).unitId).toBe(u);
    }
  });

  it('codes are empty for unitId with no 5학년 standards (edge case)', () => {
    // unitId=99 → no matching standards
    const result = getWeakStandards(99, 0.0);
    expect(result.codes).toHaveLength(0);
  });
});

// ── E-2: getStandardsForUnit ────────────────────────────────────────────────

describe('getStandardsForUnit', () => {
  it('returns only 5학년 codes for each standard unit', () => {
    for (let u = 1; u <= 8; u++) {
      const codes = getStandardsForUnit(u);
      codes.forEach(c => {
        const std = standards.find(s => s.code === c);
        expect(std).toBeDefined();
        expect(std!.unitId).toBe(u);
        expect(std!.gradeLevel).toBe(5);
      });
    }
  });

  it('returns at least one standard per unit for units 1-8', () => {
    for (let u = 1; u <= 8; u++) {
      expect(getStandardsForUnit(u).length).toBeGreaterThan(0);
    }
  });

  it('returns empty array for non-existent unit', () => {
    expect(getStandardsForUnit(99)).toHaveLength(0);
  });
});

// ── E-2: accuracyToHeatColor ────────────────────────────────────────────────

describe('accuracyToHeatColor', () => {
  it('80%+ → cool', () => {
    expect(accuracyToHeatColor(0.8)).toBe('cool');
    expect(accuracyToHeatColor(1.0)).toBe('cool');
  });

  it('60~79% → warm', () => {
    expect(accuracyToHeatColor(0.6)).toBe('warm');
    expect(accuracyToHeatColor(0.79)).toBe('warm');
  });

  it('<60% → hot', () => {
    expect(accuracyToHeatColor(0.0)).toBe('hot');
    expect(accuracyToHeatColor(0.59)).toBe('hot');
  });

  it('boundary 0.8 is cool, not warm', () => {
    expect(accuracyToHeatColor(0.8)).toBe('cool');
  });
});
