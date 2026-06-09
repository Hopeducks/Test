import { Achievement, GameProgress } from '../types';
import { ACHIEVEMENTS_LIST } from '../data/achievements';
import { costumeCatalog } from '../data/costume-catalog';
import type { CoinSource } from './economy';

export interface AchievementHandlers {
  awardCoins(amount: number, source: CoinSource): void;
  unlockCosmetic(id: string): void;
  unlockCard(id: string): void;
  save(): void;
}

function grantAchievementReward(
  ach: Achievement,
  progress: GameProgress,
  handlers: AchievementHandlers,
  isGrantingReward: { value: boolean }
): void {
  const reward = ach.reward;
  isGrantingReward.value = true;
  try {
    if (reward.type === 'costume') {
      handlers.unlockCosmetic(reward.costumeId);
    } else if (reward.type === 'coins') {
      handlers.awardCoins(reward.amount, 'achievement_reward');
    } else if (reward.type === 'card') {
      handlers.unlockCard(reward.cardId);
    } else if (reward.type === 'title') {
      if (!progress.earnedTitles) progress.earnedTitles = [];
      if (!progress.earnedTitles.includes(reward.titleText)) {
        progress.earnedTitles = [...progress.earnedTitles, reward.titleText];
      }
      const matchingTitle = costumeCatalog.find(
        c => c.category === 'title' && c.name === reward.titleText
      );
      if (matchingTitle) handlers.unlockCosmetic(matchingTitle.id);
    }
  } finally {
    isGrantingReward.value = false;
  }
}

export function getEarnedAchievementIds(progress: GameProgress): string[] {
  if (!progress.earnedAchievementIds) {
    progress.earnedAchievementIds = [];
  }
  return progress.earnedAchievementIds;
}

export function processAchievementEvent(
  progress: GameProgress,
  event: { type: string; val: number },
  handlers: AchievementHandlers,
  isGrantingReward: { value: boolean }
): Achievement[] {
  if (!progress.earnedAchievementIds) progress.earnedAchievementIds = [];
  const newlyEarned: Achievement[] = [];
  const unlockedCards = progress.unlockedCardIds;
  const completedUnits = progress.completedUnits;

  ACHIEVEMENTS_LIST.forEach(ach => {
    if (progress.earnedAchievementIds!.includes(ach.id)) return;
    let met = false;
    const cond = ach.condition;
    if (cond.type === 'streak' && event.type === 'streak') {
      met = event.val >= cond.count;
    } else if (cond.type === 'unit_complete' && event.type === 'unit_complete') {
      met = cond.unitId === 0 ? completedUnits.length >= 8 : event.val === cond.unitId;
    } else if (cond.type === 'level' && event.type === 'level') {
      met = event.val >= cond.level;
    } else if (cond.type === 'questions_correct' && event.type === 'questions_correct') {
      met = unlockedCards.length >= cond.count;
    } else if (cond.type === 'boss_damage' && event.type === 'boss_damage') {
      met = event.val >= cond.total;
    } else if (cond.type === 'battles_won' && event.type === 'battles_won') {
      met = event.val >= cond.count;
    }
    if (met) {
      progress.earnedAchievementIds!.push(ach.id);
      grantAchievementReward(ach, progress, handlers, isGrantingReward);
      newlyEarned.push(ach);
    }
  });

  if (newlyEarned.length > 0) {
    handlers.save();
    if (typeof window !== 'undefined') {
      newlyEarned.forEach(ach => {
        window.dispatchEvent(
          new CustomEvent('react:achievementUnlocked', {
            detail: { id: ach.id, name: ach.name, icon: ach.icon, description: ach.description }
          })
        );
      });
    }
  }

  return newlyEarned;
}
