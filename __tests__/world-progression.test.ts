import { describe, it, expect } from 'vitest';
import {
  getWorldProgress,
  isZoneUnlocked,
  LOOP_STEPS,
  ZONES,
} from '../lib/world-progression';
import { GameProgress } from '../types';

function makeProgress(overrides: Partial<GameProgress> = {}): GameProgress {
  return {
    unlockedCardIds: [],
    completedUnits: [],
    unitHighScores: {},
    ...overrides,
  };
}

describe('getWorldProgress', () => {
  it('빈 진행 상태에서 0% 반환', () => {
    const result = getWorldProgress(makeProgress());
    expect(result.progressPercent).toBe(0);
    expect(result.completedUnitCount).toBe(0);
    expect(result.totalUnits).toBe(8);
  });

  it('4단원 완료 시 50% 반환', () => {
    const result = getWorldProgress(makeProgress({ completedUnits: [1, 2, 3, 4] }));
    expect(result.progressPercent).toBe(50);
    expect(result.completedUnitCount).toBe(4);
  });

  it('전 단원 완료 시 100% 반환', () => {
    const result = getWorldProgress(makeProgress({ completedUnits: [1,2,3,4,5,6,7,8] }));
    expect(result.progressPercent).toBe(100);
  });

  it('unlockedCardCount은 보유 카드 수를 반영', () => {
    const result = getWorldProgress(makeProgress({ unlockedCardIds: ['u1_c1', 'u1_c2', 'u2_c1'] }));
    expect(result.unlockedCardCount).toBe(3);
  });

  it('trainerLevel이 양의 정수', () => {
    const result = getWorldProgress(makeProgress());
    expect(result.trainerLevel).toBeGreaterThanOrEqual(1);
  });

  it('nextMilestone이 빈 문자열이 아님', () => {
    const result = getWorldProgress(makeProgress());
    expect(result.nextMilestone.length).toBeGreaterThan(0);
  });

  it('전 단원 완료 시 nextMilestone에 "마스터" 포함', () => {
    const result = getWorldProgress(makeProgress({ completedUnits: [1,2,3,4,5,6,7,8] }));
    expect(result.nextMilestone).toContain('마스터');
  });

  it('부분 완료 시 nextMilestone에 다음 단원 번호 포함', () => {
    const result = getWorldProgress(makeProgress({ completedUnits: [1, 2] }));
    expect(result.nextMilestone).toContain('3');
  });
});

describe('isZoneUnlocked', () => {
  it('모든 존은 항상 개방', () => {
    const progress = makeProgress();
    const zoneIds = ['quiz', 'battle', 'raid', 'museum', 'center', 'gym', 'lab'] as const;
    zoneIds.forEach(id => {
      expect(isZoneUnlocked(id, progress)).toBe(true);
    });
  });
});

describe('ZONES 상수', () => {
  it('7개 존 정의', () => {
    expect(ZONES).toHaveLength(7);
  });

  it('모든 존에 id/label/emoji/color가 있음', () => {
    ZONES.forEach(z => {
      expect(z.id).toBeTruthy();
      expect(z.label).toBeTruthy();
      expect(z.emoji).toBeTruthy();
      expect(z.color).toMatch(/^#/);
    });
  });

  it('lab 존이 포함됨', () => {
    expect(ZONES.some(z => z.id === 'lab')).toBe(true);
  });
});

describe('LOOP_STEPS 상수', () => {
  it('4단계 루프 정의', () => {
    expect(LOOP_STEPS).toHaveLength(4);
  });

  it('step이 1부터 순서대로', () => {
    LOOP_STEPS.forEach((s, i) => {
      expect(s.step).toBe(i + 1);
    });
  });
});
