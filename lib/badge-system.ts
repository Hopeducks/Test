import { GameProgress } from '../types';
import type { CoinSource } from './economy';
import { gymFirstClearBonus } from './economy';

export interface BadgeHandlers {
  unlockCosmetic(id: string): void;
  awardCoins(amount: number, source: CoinSource): void;
  save(): void;
}

export function processUnlockBadge(
  progress: GameProgress,
  unitId: number,
  handlers: BadgeHandlers
): void {
  const isFirstGymClear = !progress.gymLeaderBeaten?.[unitId];

  if (!progress.unlockedBadges) progress.unlockedBadges = [];
  const badgeId = `accessory_badge_u${unitId}`;
  if (!progress.unlockedBadges.includes(badgeId)) {
    progress.unlockedBadges = [...progress.unlockedBadges, badgeId];
  }
  handlers.unlockCosmetic(badgeId);

  if (!progress.gymLeaderBeaten) progress.gymLeaderBeaten = {};
  progress.gymLeaderBeaten[unitId] = true;

  if (isFirstGymClear) {
    handlers.awardCoins(gymFirstClearBonus(), 'gym_first_clear');
  }

  handlers.save();
}
