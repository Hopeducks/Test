import { describe, it, expect } from 'vitest';
import {
  TRAINER_TIERS,
  TRAINER_XP_WEIGHTS,
  CP_WEIGHTS,
  MAX_NEXT_THRESHOLD,
  sumCardLevelSteps,
  deriveTrainerXp,
  deriveProgression,
  topTwoPowerSum,
  deriveCp,
  type ProgressionInput,
} from '../lib/progression';

const emptyProgress: ProgressionInput = {
  unlockedCardIds: [],
  completedUnits: [],
};

describe('TRAINER_TIERS', () => {
  it('threshold가 오름차순이고 레벨이 1부터 연속', () => {
    for (let i = 1; i < TRAINER_TIERS.length; i++) {
      expect(TRAINER_TIERS[i].threshold).toBeGreaterThan(TRAINER_TIERS[i - 1].threshold);
      expect(TRAINER_TIERS[i].level).toBe(TRAINER_TIERS[i - 1].level + 1);
    }
    expect(TRAINER_TIERS[0].level).toBe(1);
    expect(TRAINER_TIERS[0].threshold).toBe(0);
  });
});

describe('sumCardLevelSteps', () => {
  it('undefined이면 0', () => {
    expect(sumCardLevelSteps(undefined)).toBe(0);
  });

  it('(레벨-1)의 합 — 레벨 1은 0 기여', () => {
    expect(sumCardLevelSteps({ a: 1, b: 3, c: 5 })).toBe(0 + 2 + 4);
  });

  it('잘못된 레벨(0/음수)은 음수 기여하지 않음', () => {
    expect(sumCardLevelSteps({ a: 0, b: -3 })).toBe(0);
  });
});

describe('deriveTrainerXp', () => {
  it('빈 진행은 0 XP', () => {
    expect(deriveTrainerXp(emptyProgress)).toBe(0);
  });

  it('가중합 산식대로 계산', () => {
    const progress: ProgressionInput = {
      unlockedCardIds: ['a', 'b', 'c'], // 3장
      completedUnits: [1, 2], // 2단원
      cardLevels: { a: 4 }, // step 3
    };
    const expected =
      3 * TRAINER_XP_WEIGHTS.perUnlockedCard +
      3 * TRAINER_XP_WEIGHTS.perCardLevelStep +
      2 * TRAINER_XP_WEIGHTS.perCompletedUnit;
    expect(deriveTrainerXp(progress)).toBe(expected);
  });
});

describe('deriveProgression', () => {
  it('0 XP면 레벨 1, prev=0, next=300', () => {
    const info = deriveProgression(emptyProgress);
    expect(info.level).toBe(1);
    expect(info.xp).toBe(0);
    expect(info.prevThreshold).toBe(0);
    expect(info.nextThreshold).toBe(300);
  });

  it('임계 경계값에서 정확히 다음 레벨로 진입', () => {
    // 카드 3장 = 300 XP → 정확히 레벨 2 진입
    const info = deriveProgression({ unlockedCardIds: ['a', 'b', 'c'], completedUnits: [] });
    expect(info.xp).toBe(300);
    expect(info.level).toBe(2);
    expect(info.prevThreshold).toBe(300);
    expect(info.nextThreshold).toBe(800);
  });

  it('최고 레벨(6)에서 nextThreshold는 MAX 표시값', () => {
    // 40장 = 4000 XP → 레벨 6
    const manyCards = Array.from({ length: 40 }, (_, i) => `c${i}`);
    const info = deriveProgression({ unlockedCardIds: manyCards, completedUnits: [] });
    expect(info.level).toBe(6);
    expect(info.nextThreshold).toBe(MAX_NEXT_THRESHOLD);
  });
});

describe('topTwoPowerSum', () => {
  it('상위 2개의 합', () => {
    expect(topTwoPowerSum([10, 50, 30, 20])).toBe(80);
  });

  it('1개면 그 값, 0개면 0', () => {
    expect(topTwoPowerSum([42])).toBe(42);
    expect(topTwoPowerSum([])).toBe(0);
  });

  it('원본 배열을 변형하지 않음(immutable)', () => {
    const arr = [1, 2, 3];
    topTwoPowerSum(arr);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe('deriveCp', () => {
  it('가중합 산식대로 계산', () => {
    const cp = deriveCp({
      unlockedCardCount: 4,
      topTwoPowerSum: 90,
      equippedStatsSum: 12,
      cardLevelSteps: 5,
    });
    const expected =
      4 * CP_WEIGHTS.perUnlockedCard +
      90 +
      12 * CP_WEIGHTS.equippedStatMultiplier +
      5 * CP_WEIGHTS.perCardLevelStep;
    expect(cp).toBe(expected);
  });

  it('빈 입력이면 0', () => {
    expect(
      deriveCp({ unlockedCardCount: 0, topTwoPowerSum: 0, equippedStatsSum: 0, cardLevelSteps: 0 })
    ).toBe(0);
  });
});
