import { GameProgress, DailyStats } from '../types';
import type { CoinSource } from './economy';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyStats(progress: GameProgress, save: () => void): DailyStats {
  const today = todayStr();
  if (!progress.dailyStats || progress.dailyStats.date !== today) {
    progress.dailyStats = { date: today, quizCompleted: 0, battlesPlayed: 0, cardsUnlocked: 0, lobbyVisited: false };
    progress.claimedDailyQuestIds = [];
    save();
  }
  return progress.dailyStats;
}

export function incrementDailyStat(
  progress: GameProgress,
  key: 'quizCompleted' | 'battlesPlayed' | 'cardsUnlocked',
  getDailyStatsFn: () => DailyStats
): void {
  const stats = getDailyStatsFn();
  progress.dailyStats = { ...stats, [key]: stats[key] + 1 };
}

export function markLobbyVisited(progress: GameProgress, save: () => void, getDailyStatsFn: () => DailyStats): void {
  const stats = getDailyStatsFn();
  if (!stats.lobbyVisited) {
    progress.dailyStats = { ...stats, lobbyVisited: true };
    save();
  }
}

export function claimDailyQuestReward(
  progress: GameProgress,
  questId: string,
  coinReward: number,
  awardCoins: (amount: number, source: CoinSource) => void,
  save: () => void,
  getDailyStatsFn: () => DailyStats
): void {
  getDailyStatsFn(); // ensure date reset
  if (!progress.claimedDailyQuestIds) progress.claimedDailyQuestIds = [];
  if (!progress.claimedDailyQuestIds.includes(questId)) {
    progress.claimedDailyQuestIds = [...progress.claimedDailyQuestIds, questId];
    awardCoins(coinReward, 'daily_quest');
    save();
  }
}
