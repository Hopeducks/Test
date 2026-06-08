import { describe, it, expect } from 'vitest';
import {
  QUEST_CATEGORIES,
  TOTAL_QUEST_COUNT,
  buildActiveQuests,
  type QuestMetricContext,
} from '../data/quests';
import { cards } from '../data/cards';
import type { GameProgress } from '../types';

function makeProgress(overrides: Partial<GameProgress> = {}): GameProgress {
  return {
    unlockedCardIds: [],
    completedUnits: [],
    unitHighScores: {},
    ...overrides,
  };
}

function ctx(progress: GameProgress, trainerLevel = 1, trainerXp = 0): QuestMetricContext {
  return { progress, trainerLevel, trainerXp };
}

describe('퀘스트 카탈로그 규모', () => {
  it('총 도전과제 80개 이상 (B-4)', () => {
    expect(TOTAL_QUEST_COUNT).toBeGreaterThanOrEqual(80);
  });

  it('카테고리 ID는 고유', () => {
    const ids = QUEST_CATEGORIES.map(c => c.category);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 티어는 오름차순 max·양수 보상', () => {
    for (const cat of QUEST_CATEGORIES) {
      for (let i = 1; i < cat.tiers.length; i++) {
        expect(cat.tiers[i].max).toBeGreaterThan(cat.tiers[i - 1].max);
      }
      cat.tiers.forEach(t => expect(t.reward).toBeGreaterThan(0));
    }
  });
});

describe('도달 가능성 (죽은 퀘스트 방지)', () => {
  it('collector 최종 max는 전체 카드 수를 넘지 않음', () => {
    const collector = QUEST_CATEGORIES.find(c => c.category === 'collector')!;
    const finalMax = collector.tiers[collector.tiers.length - 1].max;
    expect(finalMax).toBeLessThanOrEqual(cards.length);
  });

  it('legendary/epic 헌터 최종 max는 실제 보유 가능 수와 일치', () => {
    const legendaryCount = cards.filter(c => c.rarity === 'legendary').length;
    const epicCount = cards.filter(c => c.rarity === 'epic').length;
    const legendary = QUEST_CATEGORIES.find(c => c.category === 'legendary_hunter')!;
    const epic = QUEST_CATEGORIES.find(c => c.category === 'epic_hunter')!;
    expect(legendary.tiers[legendary.tiers.length - 1].max).toBe(legendaryCount);
    expect(epic.tiers[epic.tiers.length - 1].max).toBe(epicCount);
  });
});

describe('buildActiveQuests 활성 티어 로직', () => {
  it('아무 것도 수령 안 하면 카테고리당 1티어가 활성', () => {
    const quests = buildActiveQuests(ctx(makeProgress()), []);
    expect(quests).toHaveLength(QUEST_CATEGORIES.length);
    quests.forEach(q => {
      expect(q.isAllCleared).toBe(false);
      expect(q.id).toMatch(/_t1$/);
    });
  });

  it('낮은 티어 수령 시 다음 티어로 진행', () => {
    const quests = buildActiveQuests(ctx(makeProgress()), ['quest_solver_t1']);
    const solver = quests.find(q => q.id.startsWith('quest_solver'))!;
    expect(solver.id).toBe('quest_solver_t2');
  });

  it('전 티어 수령 시 isAllCleared', () => {
    const solver = QUEST_CATEGORIES.find(c => c.category === 'solver')!;
    const claimed = solver.tiers.map((_, i) => `quest_solver_t${i + 1}`);
    const quests = buildActiveQuests(ctx(makeProgress()), claimed);
    const solverQuest = quests.find(q => q.id.startsWith('quest_solver'))!;
    expect(solverQuest.isAllCleared).toBe(true);
  });
});

describe('메트릭 정확성 (실제 progress 파생)', () => {
  it('solver: completedUnits 수', () => {
    const p = makeProgress({ completedUnits: [1, 2, 3] });
    const q = buildActiveQuests(ctx(p), []).find(x => x.id.startsWith('quest_solver'))!;
    expect(q.prog).toBe(3);
  });

  it('perfectionist: 만점(10) 단원 수만 카운트', () => {
    const p = makeProgress({ unitHighScores: { 1: 10, 2: 9, 3: 10 } });
    const q = buildActiveQuests(ctx(p), []).find(x => x.id.startsWith('quest_perfectionist'))!;
    expect(q.prog).toBe(2);
  });

  it('legendary_hunter: 해금된 레전더리만 카운트', () => {
    const legendaryIds = cards.filter(c => c.rarity === 'legendary').slice(0, 2).map(c => c.id);
    const p = makeProgress({ unlockedCardIds: legendaryIds });
    const q = buildActiveQuests(ctx(p), []).find(x => x.id.startsWith('quest_legendary'))!;
    expect(q.prog).toBe(2);
  });

  it('evolver: 레벨 4 이상 카드 수', () => {
    const p = makeProgress({
      unlockedCardIds: ['u1_c1', 'u1_c2', 'u1_c3'],
      cardLevels: { u1_c1: 4, u1_c2: 8, u1_c3: 3 },
    });
    const q = buildActiveQuests(ctx(p), []).find(x => x.id.startsWith('quest_evolver'))!;
    expect(q.prog).toBe(2);
  });

  it('trainer/xp_hunter: 주입된 트레이너 지표 사용', () => {
    const p = makeProgress();
    const quests = buildActiveQuests(ctx(p, 4, 3200), []);
    expect(quests.find(x => x.id.startsWith('quest_trainer'))!.prog).toBe(4);
    expect(quests.find(x => x.id.startsWith('quest_xp_hunter'))!.prog).toBe(3200);
  });
});
