import { describe, it, expect } from 'vitest';
import { dateSeed, getDailyQuests, buildDailyQuestStatus, DAILY_QUEST_POOL } from '../data/quests';
import { DailyStats } from '../types';

describe('dateSeed', () => {
  it('같은 날짜는 항상 같은 시드를 반환한다', () => {
    expect(dateSeed('2026-06-08')).toBe(dateSeed('2026-06-08'));
  });
  it('다른 날짜는 다른 시드를 반환한다', () => {
    expect(dateSeed('2026-06-08')).not.toBe(dateSeed('2026-06-09'));
  });
  it('음수를 반환하지 않는다', () => {
    for (const d of ['2026-01-01', '2026-12-31', '2026-06-15']) {
      expect(dateSeed(d)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('getDailyQuests', () => {
  it('항상 3개를 반환한다', () => {
    expect(getDailyQuests('2026-06-08')).toHaveLength(3);
  });
  it('같은 날짜는 같은 3개를 반환한다 (결정론적)', () => {
    const a = getDailyQuests('2026-06-08').map(q => q.id);
    const b = getDailyQuests('2026-06-08').map(q => q.id);
    expect(a).toEqual(b);
  });
  it('반환된 퀘스트는 DAILY_QUEST_POOL에 속한다', () => {
    const poolIds = new Set(DAILY_QUEST_POOL.map(q => q.id));
    for (const q of getDailyQuests('2026-06-08')) {
      expect(poolIds.has(q.id)).toBe(true);
    }
  });
  it('중복 없이 3개를 반환한다', () => {
    for (let day = 1; day <= 28; day++) {
      const ids = getDailyQuests(`2026-06-${String(day).padStart(2, '0')}`).map(q => q.id);
      expect(new Set(ids).size).toBe(3);
    }
  });
});

describe('buildDailyQuestStatus', () => {
  const date = '2026-06-08';

  it('통계가 없으면 prog=0이다', () => {
    const statuses = buildDailyQuestStatus(date, undefined, []);
    for (const s of statuses) {
      expect(s.prog).toBe(0);
      expect(s.isClaimed).toBe(false);
    }
  });

  it('날짜가 다른 통계는 무시(0으로 처리)한다', () => {
    const stale: DailyStats = { date: '2026-06-07', quizCompleted: 5, battlesPlayed: 3, cardsUnlocked: 2, lobbyVisited: true };
    const statuses = buildDailyQuestStatus(date, stale, []);
    for (const s of statuses) {
      expect(s.prog).toBe(0);
    }
  });

  it('수령된 퀘스트는 isClaimed=true이다', () => {
    const quests = getDailyQuests(date);
    const claimed = [quests[0].id];
    const statuses = buildDailyQuestStatus(date, undefined, claimed);
    expect(statuses[0].isClaimed).toBe(true);
    expect(statuses[1].isClaimed).toBe(false);
  });

  it('목표 달성 시 isReady=true이다', () => {
    const quests = getDailyQuests(date);
    const q = quests.find(q => q.goalKey === 'quizCompleted' && q.id !== 'dq_active' && q.id !== 'dq_hard');
    if (!q) return;
    const stats: DailyStats = { date, quizCompleted: q.goal, battlesPlayed: 0, cardsUnlocked: 0, lobbyVisited: false };
    const statuses = buildDailyQuestStatus(date, stats, []);
    const found = statuses.find(s => s.quest.id === q.id);
    expect(found?.isReady).toBe(true);
  });

  it('이미 수령한 퀘스트는 isReady=false이다', () => {
    const quests = getDailyQuests(date);
    const q = quests[0];
    const stats: DailyStats = { date, quizCompleted: 99, battlesPlayed: 99, cardsUnlocked: 99, lobbyVisited: true };
    const statuses = buildDailyQuestStatus(date, stats, [q.id]);
    expect(statuses[0].isReady).toBe(false);
  });
});
