import { describe, it, expect } from 'vitest';
import {
  clampCoins,
  applyAward,
  applySpend,
  canAfford,
  normalizeLoadedCoins,
  firstClearBonus,
  highScoreBonus,
  gymFirstClearBonus,
  COIN_POLICY,
} from '../lib/economy';

describe('clampCoins', () => {
  it('음수를 0으로 보정', () => {
    expect(clampCoins(-50)).toBe(0);
  });

  it('NaN을 0으로 보정', () => {
    expect(clampCoins(NaN)).toBe(0);
  });

  it('undefined를 0으로 보정', () => {
    expect(clampCoins(undefined)).toBe(0);
  });

  it('소수를 내림 정수로 보정', () => {
    expect(clampCoins(12.9)).toBe(12);
  });

  it('정상 정수는 그대로', () => {
    expect(clampCoins(300)).toBe(300);
  });
});

describe('applyAward', () => {
  it('현재 코인에 지급액을 더함', () => {
    expect(applyAward(100, 50)).toBe(150);
  });

  it('음수 지급은 무시(0 취급)되어 코인 불변', () => {
    expect(applyAward(100, -50)).toBe(100);
  });

  it('결과는 항상 정수로 클램프', () => {
    expect(applyAward(100, 0.5)).toBe(100);
  });
});

describe('applySpend / canAfford', () => {
  it('충분하면 차감', () => {
    expect(applySpend(100, 30)).toBe(70);
  });

  it('부족하면 -1 반환(차감 불가 신호)', () => {
    expect(applySpend(20, 30)).toBe(-1);
  });

  it('정확히 같으면 0', () => {
    expect(applySpend(30, 30)).toBe(0);
  });

  it('canAfford 경계', () => {
    expect(canAfford(30, 30)).toBe(true);
    expect(canAfford(29, 30)).toBe(false);
  });
});

describe('normalizeLoadedCoins (1회 마이그레이션)', () => {
  it('coins가 정의되어 있으면 그대로(클램프만)', () => {
    expect(normalizeLoadedCoins({ coins: 250, unlockedCardIds: ['a', 'b'] })).toBe(250);
  });

  it('coins가 없으면 레거시 산식(카드수*10)으로 1회 보정', () => {
    expect(normalizeLoadedCoins({ unlockedCardIds: ['a', 'b', 'c'] })).toBe(30);
  });

  it('coins가 음수/NaN이면 0', () => {
    expect(normalizeLoadedCoins({ coins: -5, unlockedCardIds: [] })).toBe(0);
    expect(normalizeLoadedCoins({ coins: NaN, unlockedCardIds: [] })).toBe(0);
  });

  it('unlockedCardIds 없고 coins도 없으면 0', () => {
    expect(normalizeLoadedCoins({})).toBe(0);
  });
});

describe('마일스톤 보너스 산식', () => {
  it('첫 클리어 보너스는 정책 상수와 일치', () => {
    expect(firstClearBonus()).toBe(COIN_POLICY.firstUnitClear);
  });

  it('신기록 보너스: 향상된 점수 증가분에 비례', () => {
    // prev 6 → new 9 (10점 만점 척도), 증가분 3 * perPoint
    expect(highScoreBonus(6, 9)).toBe(3 * COIN_POLICY.highScorePerPoint);
  });

  it('신기록 보너스: 경신 못하면 0 (farming 차단)', () => {
    expect(highScoreBonus(9, 9)).toBe(0);
    expect(highScoreBonus(9, 5)).toBe(0);
  });

  it('신기록 보너스: 최초 기록(이전 0)도 점수 비례', () => {
    expect(highScoreBonus(0, 8)).toBe(8 * COIN_POLICY.highScorePerPoint);
  });

  it('체육관 첫 격파 보너스는 정책 상수와 일치', () => {
    expect(gymFirstClearBonus()).toBe(COIN_POLICY.gymFirstClear);
  });
});
