import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GameProgress, DailyStats } from '../types';
import { getDailyStats, incrementDailyStat, markLobbyVisited, claimDailyQuestReward, todayStr } from '../lib/daily-stats';
import { determineBattleOutcome, shouldEndBattle, updateRoundWins } from '../lib/battle-engine';
import { computeCP } from '../lib/cp-calculator';
import { getCardPower, processCardXpGain } from '../lib/card-xp';
import { processUnlockBadge } from '../lib/badge-system';
import { cards } from '../data/cards';

const dispatchSpy = vi.fn();
beforeEach(() => {
  (globalThis as Record<string, unknown>).window = { dispatchEvent: dispatchSpy };
  if (typeof (globalThis as Record<string, unknown>).CustomEvent === 'undefined') {
    (globalThis as Record<string, unknown>).CustomEvent = class {
      type: string; detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) { this.type = type; this.detail = init?.detail; }
    };
  }
  dispatchSpy.mockClear();
});
afterEach(() => { delete (globalThis as Record<string, unknown>).window; });

function emptyProgress(): GameProgress {
  return { unlockedCardIds: [], completedUnits: [], unitHighScores: {} };
}

// ── battle-engine (pure) ───────────────────────────────────────────────────
describe('determineBattleOutcome', () => {
  const noWins = { player: 0, opponent: 0 };
  it('standard: HP가 높은 쪽 승리', () => {
    expect(determineBattleOutcome('standard', 50, 10, noWins)).toBe('victory');
    expect(determineBattleOutcome('standard', 10, 50, noWins)).toBe('defeat');
  });
  it('standard: HP 동률 → 무승부', () => {
    expect(determineBattleOutcome('standard', 30, 30, noWins)).toBe('draw');
  });
  it('bestof3: 라운드 승수로 판정 (HP 무시)', () => {
    expect(determineBattleOutcome('bestof3', 0, 100, { player: 2, opponent: 1 })).toBe('victory');
    expect(determineBattleOutcome('bestof3', 100, 0, { player: 1, opponent: 2 })).toBe('defeat');
    expect(determineBattleOutcome('bestof3', 50, 50, { player: 1, opponent: 1 })).toBe('draw');
  });
});

describe('shouldEndBattle', () => {
  it('bestof3: 2승 선취 시 종료', () => {
    expect(shouldEndBattle('bestof3', { player: 2, opponent: 0 }, 2, 50, 50)).toBe(true);
    expect(shouldEndBattle('bestof3', { player: 0, opponent: 2 }, 2, 50, 50)).toBe(true);
  });
  it('bestof3: 3라운드 완료 시 종료', () => {
    expect(shouldEndBattle('bestof3', { player: 1, opponent: 1 }, 3, 50, 50)).toBe(true);
  });
  it('bestof3: 아직 진행 중', () => {
    expect(shouldEndBattle('bestof3', { player: 1, opponent: 0 }, 1, 50, 50)).toBe(false);
  });
  it('standard: HP 소진 시 종료', () => {
    expect(shouldEndBattle('standard', { player: 0, opponent: 0 }, 1, 0, 50)).toBe(true);
    expect(shouldEndBattle('standard', { player: 0, opponent: 0 }, 1, 50, 0)).toBe(true);
  });
  it('standard: 3라운드 완료 시 종료', () => {
    expect(shouldEndBattle('standard', { player: 0, opponent: 0 }, 3, 50, 50)).toBe(true);
  });
  it('standard: 진행 중', () => {
    expect(shouldEndBattle('standard', { player: 0, opponent: 0 }, 1, 50, 50)).toBe(false);
  });
});

describe('updateRoundWins', () => {
  it('승자에 따라 승수를 증가시킨다 (불변)', () => {
    const base = { player: 1, opponent: 1 };
    expect(updateRoundWins(base, 'player')).toEqual({ player: 2, opponent: 1 });
    expect(updateRoundWins(base, 'opponent')).toEqual({ player: 1, opponent: 2 });
    expect(updateRoundWins(base, 'draw')).toEqual({ player: 1, opponent: 1 });
    expect(base).toEqual({ player: 1, opponent: 1 }); // 원본 불변
  });
});

// ── daily-stats ────────────────────────────────────────────────────────────
describe('daily-stats', () => {
  it('todayStr은 YYYY-MM-DD 형식', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getDailyStats: 최초 호출 시 오늘 날짜로 초기화하고 save', () => {
    const progress = emptyProgress();
    const save = vi.fn();
    const stats = getDailyStats(progress, save);
    expect(stats.date).toBe(todayStr());
    expect(stats.quizCompleted).toBe(0);
    expect(stats.lobbyVisited).toBe(false);
    expect(save).toHaveBeenCalled();
  });

  it('getDailyStats: 날짜가 바뀌면 리셋', () => {
    const progress = emptyProgress();
    progress.dailyStats = { date: '2000-01-01', quizCompleted: 9, battlesPlayed: 9, cardsUnlocked: 9, lobbyVisited: true };
    const stats = getDailyStats(progress, vi.fn());
    expect(stats.date).toBe(todayStr());
    expect(stats.quizCompleted).toBe(0);
  });

  it('getDailyStats: 같은 날 재호출 시 save 없이 기존 반환', () => {
    const progress = emptyProgress();
    getDailyStats(progress, vi.fn());
    const save2 = vi.fn();
    getDailyStats(progress, save2);
    expect(save2).not.toHaveBeenCalled();
  });

  it('incrementDailyStat: 지정 키를 1 증가 (불변 갱신)', () => {
    const progress = emptyProgress();
    const getStats = (): DailyStats => getDailyStats(progress, vi.fn());
    incrementDailyStat(progress, 'quizCompleted', getStats);
    expect(progress.dailyStats!.quizCompleted).toBe(1);
    incrementDailyStat(progress, 'battlesPlayed', getStats);
    expect(progress.dailyStats!.battlesPlayed).toBe(1);
  });

  it('markLobbyVisited: 최초 1회만 save', () => {
    const progress = emptyProgress();
    const getStats = (): DailyStats => getDailyStats(progress, vi.fn());
    const save = vi.fn();
    markLobbyVisited(progress, save, getStats);
    expect(progress.dailyStats!.lobbyVisited).toBe(true);
    expect(save).toHaveBeenCalledOnce();
    save.mockClear();
    markLobbyVisited(progress, save, getStats); // 이미 방문
    expect(save).not.toHaveBeenCalled();
  });

  it('claimDailyQuestReward: 코인 지급 + 중복 청구 방지', () => {
    const progress = emptyProgress();
    const getStats = (): DailyStats => getDailyStats(progress, vi.fn());
    const award = vi.fn();
    claimDailyQuestReward(progress, 'dq1', 30, award, vi.fn(), getStats);
    expect(progress.claimedDailyQuestIds).toContain('dq1');
    expect(award).toHaveBeenCalledWith(30, 'daily_quest');
    award.mockClear();
    claimDailyQuestReward(progress, 'dq1', 30, award, vi.fn(), getStats); // 중복
    expect(award).not.toHaveBeenCalled();
  });
});

// ── cp-calculator ──────────────────────────────────────────────────────────
describe('computeCP', () => {
  const noCosmetics = { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none', hat: 'none', badge: 'none', title: 'none', petId: 'none' };

  it('보유 카드가 없으면 기본 CP (음수 아님)', () => {
    const cp = computeCP([], noCosmetics, undefined);
    expect(cp).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(cp)).toBe(true);
  });

  it('카드를 보유하면 CP가 증가한다', () => {
    const someCards = cards.slice(0, 3).map(c => c.id);
    const cpWith = computeCP(someCards, noCosmetics, undefined);
    const cpWithout = computeCP([], noCosmetics, undefined);
    expect(cpWith).toBeGreaterThan(cpWithout);
  });

  it('카드 레벨이 높으면 CP가 증가한다', () => {
    const someCards = cards.slice(0, 3).map(c => c.id);
    const lvl1 = computeCP(someCards, noCosmetics, {});
    const lvl5 = computeCP(someCards, noCosmetics, Object.fromEntries(someCards.map(id => [id, 5])));
    expect(lvl5).toBeGreaterThanOrEqual(lvl1);
  });
});

// ── card-xp ────────────────────────────────────────────────────────────────
describe('getCardPower', () => {
  it('알 수 없는 카드 → 기본 파워 20', () => {
    expect(getCardPower('nonexistent', emptyProgress())).toBe(20);
  });
  it('레벨이 오르면 파워 +10/레벨', () => {
    const card = cards[0];
    const progress = emptyProgress();
    const base = getCardPower(card.id, progress);
    progress.cardLevels = { [card.id]: 3 };
    expect(getCardPower(card.id, progress)).toBe(base + 20);
  });
});

describe('processCardXpGain', () => {
  it('미보유 카드는 XP를 받지 않는다', () => {
    const progress = emptyProgress();
    const save = vi.fn();
    processCardXpGain(progress, ['u1_c1'], 50, save);
    expect(progress.cardXps?.['u1_c1']).toBeUndefined();
  });

  it('100 미만 누적은 레벨 유지', () => {
    const progress = emptyProgress();
    progress.unlockedCardIds = ['u1_c1'];
    processCardXpGain(progress, ['u1_c1'], 50, vi.fn());
    expect(progress.cardXps!['u1_c1']).toBe(50);
    expect(progress.cardLevels?.['u1_c1'] ?? 1).toBe(1);
  });

  it('100 이상이면 레벨업하고 XP 이월 + 이벤트 발생', () => {
    const progress = emptyProgress();
    progress.unlockedCardIds = ['u1_c1'];
    processCardXpGain(progress, ['u1_c1'], 130, vi.fn());
    expect(progress.cardLevels!['u1_c1']).toBe(2);
    expect(progress.cardXps!['u1_c1']).toBe(30);
    expect(dispatchSpy).toHaveBeenCalled(); // react:cardLevelUp
  });

  it('레벨 10 만렙 카드는 더 이상 오르지 않는다', () => {
    const progress = emptyProgress();
    progress.unlockedCardIds = ['u1_c1'];
    progress.cardLevels = { u1_c1: 10 };
    progress.cardXps = { u1_c1: 0 };
    processCardXpGain(progress, ['u1_c1'], 200, vi.fn());
    expect(progress.cardLevels!['u1_c1']).toBe(10);
  });
});

// ── badge-system ───────────────────────────────────────────────────────────
describe('processUnlockBadge', () => {
  function handlers() {
    return { unlockCosmetic: vi.fn(), awardCoins: vi.fn(), save: vi.fn() };
  }

  it('배지를 잠금해제하고 체육관 격파를 기록한다', () => {
    const progress = emptyProgress();
    const h = handlers();
    processUnlockBadge(progress, 3, h);
    expect(progress.unlockedBadges).toContain('accessory_badge_u3');
    expect(progress.gymLeaderBeaten!['3']).toBe(true);
    expect(h.unlockCosmetic).toHaveBeenCalledWith('accessory_badge_u3');
    expect(h.save).toHaveBeenCalled();
  });

  it('최초 격파 시에만 코인 보상', () => {
    const progress = emptyProgress();
    const h = handlers();
    processUnlockBadge(progress, 1, h);
    expect(h.awardCoins).toHaveBeenCalledWith(expect.any(Number), 'gym_first_clear');
    h.awardCoins.mockClear();
    processUnlockBadge(progress, 1, h); // 재격파
    expect(h.awardCoins).not.toHaveBeenCalled();
  });

  it('배지 중복 추가 방지', () => {
    const progress = emptyProgress();
    processUnlockBadge(progress, 2, handlers());
    processUnlockBadge(progress, 2, handlers());
    const count = progress.unlockedBadges!.filter(b => b === 'accessory_badge_u2').length;
    expect(count).toBe(1);
  });
});
