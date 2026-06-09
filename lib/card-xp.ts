import { GameProgress } from '../types';
import { cards } from '../data/cards';
import { EVOLUTION_LEVELS, getCardEvolution as cardEvolutionFn } from './card-evolution';

export function getCardPower(cardId: string, progress: GameProgress): number {
  const card = cards.find(c => c.id === cardId);
  const basePower = card?.power || card?.attack || 20;
  const level = progress.cardLevels?.[cardId] || 1;
  return basePower + (level - 1) * 10;
}

export function processCardXpGain(
  progress: GameProgress,
  cardIds: string[],
  amount: number,
  save: () => void
): void {
  if (!progress.cardLevels) progress.cardLevels = {};
  if (!progress.cardXps) progress.cardXps = {};

  let hasLevelUp = false;
  const levelUpCards: string[] = [];
  const evolvedCards: { cardId: string; newLevel: number }[] = [];

  cardIds.forEach(cardId => {
    if (!progress.unlockedCardIds.includes(cardId)) return;
    const currentXp = progress.cardXps![cardId] || 0;
    const currentLevel = progress.cardLevels![cardId] || 1;
    if (currentLevel >= 10) return;

    const nextXp = currentXp + amount;
    if (nextXp >= 100) {
      const newLevel = currentLevel + 1;
      progress.cardLevels![cardId] = newLevel;
      progress.cardXps![cardId] = nextXp - 100;
      hasLevelUp = true;
      levelUpCards.push(cardId);
      if (newLevel === EVOLUTION_LEVELS.stage2 || newLevel === EVOLUTION_LEVELS.stage3) {
        evolvedCards.push({ cardId, newLevel });
      }
    } else {
      progress.cardXps![cardId] = nextXp;
    }
  });

  if (hasLevelUp || amount > 0) save();

  if (levelUpCards.length > 0 && typeof window !== 'undefined') {
    levelUpCards.forEach(cId => {
      const matchingCard = cards.find(c => c.id === cId);
      if (matchingCard) {
        window.dispatchEvent(new CustomEvent('react:cardLevelUp', { detail: { cardId: cId, name: matchingCard.name } }));
      }
    });
  }

  if (evolvedCards.length > 0 && typeof window !== 'undefined') {
    evolvedCards.forEach(({ cardId, newLevel }) => {
      const evo = cardEvolutionFn(cardId, newLevel);
      window.dispatchEvent(new CustomEvent('react:cardEvolved', {
        detail: { cardId, name: evo.name, emoji: evo.emoji, stage: evo.stage }
      }));
    });
  }
}
