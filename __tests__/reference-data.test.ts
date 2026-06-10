import { describe, it, expect } from 'vitest';
import { rubrics, getRubric } from '../data/rubrics';
import { standards, getStandardsByUnit, getStandardByCode, getStandardsByDomain } from '../data/standards';
import { computeCP } from '../lib/cp-calculator';

// ── rubrics ────────────────────────────────────────────────────────────────
describe('rubrics 데이터', () => {
  it('8개 단원 루브릭이 존재한다', () => {
    expect(rubrics).toHaveLength(8);
    expect(rubrics.map(r => r.unitId).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('각 단원은 정확히 3개 수준(이해/적용/심화)을 가진다', () => {
    for (const r of rubrics) {
      expect(r.levels).toHaveLength(3);
      expect(r.levels.map(l => l.label)).toEqual(['이해', '적용', '심화']);
      expect(r.levels.map(l => l.level)).toEqual([1, 2, 3]);
    }
  });

  it('getRubric: 존재하는 단원 → 해당 루브릭', () => {
    expect(getRubric(1)?.unitName).toBe('지층과 화석');
    expect(getRubric(8)?.unitName).toBe('산과 염기');
  });

  it('getRubric: 없는 단원 → undefined', () => {
    expect(getRubric(99)).toBeUndefined();
  });
});

// ── standards ──────────────────────────────────────────────────────────────
describe('standards 데이터', () => {
  it('성취기준 코드는 [6과NN-NN] 형식', () => {
    for (const s of standards) {
      expect(s.code).toMatch(/^\[6과\d{2}-\d{2}\]$/);
    }
  });

  it('getStandardsByUnit: 단원별 성취기준을 반환한다', () => {
    const unit8 = getStandardsByUnit(8);
    expect(unit8.length).toBeGreaterThan(0);
    expect(unit8.every(s => s.unitId === 8)).toBe(true);
  });

  it('getStandardByCode: 존재하는 코드 → 해당 성취기준', () => {
    const known = standards[0].code;
    expect(getStandardByCode(known)?.code).toBe(known);
  });

  it('getStandardByCode: 없는 코드 → undefined', () => {
    expect(getStandardByCode('[6과99-99]')).toBeUndefined();
  });

  it('getStandardsByDomain: 도메인별로 필터링한다', () => {
    const matter = getStandardsByDomain('물질');
    expect(matter.length).toBeGreaterThan(0);
    expect(matter.every(s => s.domain === '물질')).toBe(true);
  });
});

// ── cp-calculator 장착 스탯 분기 ────────────────────────────────────────────
describe('computeCP 장착 코스튬 스탯 반영', () => {
  it('스탯이 있는 코스튬을 장착하면 CP가 증가한다', () => {
    const base = { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none', hat: 'none', badge: 'none', title: 'none', petId: 'none' };
    const withOutfit = { ...base, outfit: 'outfit_scientist' }; // stats: { hp:10, defense:2 }
    const cpBase = computeCP([], base, undefined);
    const cpEquipped = computeCP([], withOutfit, undefined);
    expect(cpEquipped).toBeGreaterThan(cpBase);
  });
});
