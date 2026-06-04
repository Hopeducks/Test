import { describe, it, expect } from 'vitest';
import {
  getCardAttribute,
  getAttackMultiplier,
  getEffectivenessLabel,
} from '../lib/game-state';

describe('getCardAttribute', () => {
  it('단원 1 → 땅 속성', () => {
    expect(getCardAttribute(1)).toBe('땅');
  });

  it('단원 8 → 불꽃 속성', () => {
    expect(getCardAttribute(8)).toBe('불꽃');
  });

  it('범위 외 단원 → 노말 속성 폴백', () => {
    expect(getCardAttribute(99)).toBe('노말');
    expect(getCardAttribute(0)).toBe('노말');
  });

  it('8개 단원 모두 유효한 속성 반환', () => {
    const validAttrs = ['땅', '전기', '물', '에스퍼', '풀', '비행', '노말', '불꽃'];
    for (let unitId = 1; unitId <= 8; unitId++) {
      expect(validAttrs).toContain(getCardAttribute(unitId));
    }
  });
});

describe('getAttackMultiplier', () => {
  it('불꽃(8) vs 풀(5) → 2배 효과', () => {
    expect(getAttackMultiplier(8, 5)).toBe(2);
  });

  it('불꽃(8) vs 물(3) → 0.5배 효과', () => {
    expect(getAttackMultiplier(8, 3)).toBe(0.5);
  });

  it('전기(2) vs 땅(1) → 0배 (무효)', () => {
    expect(getAttackMultiplier(2, 1)).toBe(0);
  });

  it('노말(7) vs 어느 속성이든 → 1.0배 (기본값)', () => {
    expect(getAttackMultiplier(7, 1)).toBe(1.0);
    expect(getAttackMultiplier(7, 8)).toBe(1.0);
  });

  it('같은 단원끼리 → 0.5배 (동속성 저항)', () => {
    // 불꽃 vs 불꽃
    expect(getAttackMultiplier(8, 8)).toBe(0.5);
    // 물 vs 물
    expect(getAttackMultiplier(3, 3)).toBe(0.5);
  });

  it('정의되지 않은 상성 → 1.0배 기본값', () => {
    // 에스퍼 vs 불꽃 — 상성 테이블에 없음
    expect(getAttackMultiplier(4, 8)).toBe(1.0);
  });
});

describe('getEffectivenessLabel', () => {
  it('2배 이상 → 굉장한 효과 메시지', () => {
    const label = getEffectivenessLabel(2.0);
    expect(label).toContain('굉장했다');
    expect(label).toContain('2.0배');
  });

  it('0배 → 무효 메시지', () => {
    const label = getEffectivenessLabel(0);
    expect(label).toContain('전혀 없는');
    expect(label).toContain('0.0배');
  });

  it('0.5배 → 미약한 효과 메시지', () => {
    const label = getEffectivenessLabel(0.5);
    expect(label).toContain('별로인');
    expect(label).toContain('0.5배');
  });

  it('1.0배 → 빈 문자열 (기본 메시지 없음)', () => {
    expect(getEffectivenessLabel(1.0)).toBe('');
  });
});
