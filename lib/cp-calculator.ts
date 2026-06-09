import { cards } from '../data/cards';
import { costumeCatalog, getActiveSetBonus } from '../data/costume-catalog';
import { deriveCp, topTwoPowerSum, sumCardLevelSteps } from './progression';

type EquippedCosmetics = {
  outfit: string;
  expression: string;
  accessory: string;
  mount: string;
  hat?: string;
  badge?: string;
  title?: string;
  petId?: string;
};

export function computeCP(
  unlockedCardIds: string[],
  equippedCosmetics: EquippedCosmetics,
  cardLevels: Record<string, number> | undefined
): number {
  const unlockedCardsData = cards.filter(c => unlockedCardIds.includes(c.id));
  const powers = unlockedCardsData.map(c => c.power || c.attack || 20);

  const itemsToSum = [
    equippedCosmetics.outfit,
    equippedCosmetics.accessory,
    equippedCosmetics.mount,
    equippedCosmetics.hat,
    equippedCosmetics.badge,
    equippedCosmetics.title,
    equippedCosmetics.petId,
  ];

  let equippedStatsSum = 0;
  itemsToSum.forEach(itemId => {
    if (!itemId || itemId === 'none') return;
    const item = costumeCatalog.find(c => c.id === itemId);
    if (item && item.stats) {
      equippedStatsSum += (item.stats.hp || 0) + (item.stats.attack || 0) + (item.stats.defense || 0);
    }
  });

  const { totalCpBonus } = getActiveSetBonus(itemsToSum);

  return deriveCp({
    unlockedCardCount: unlockedCardIds.length,
    topTwoPowerSum: topTwoPowerSum(powers),
    equippedStatsSum,
    cardLevelSteps: sumCardLevelSteps(cardLevels),
    setBonus: totalCpBonus,
  });
}
