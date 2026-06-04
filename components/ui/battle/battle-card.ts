import { CollectibleCard, Card } from '../../../types';

export interface BattleCard extends Card {
  defense: number;
}

// CollectibleCard(도감 데이터) → BattleCard(배틀용 스탯) 매핑
export function mapToBattleCard(card: CollectibleCard, cardLevels?: Record<string, number>): BattleCard {
  const isLegendary = card.rarity === 'legendary';
  const isRare = card.rarity === 'rare';

  // Power mapping
  let power = 30;
  if (isLegendary) power = 85;
  else if (isRare) power = 55;

  // Level bonus
  const level = cardLevels?.[card.id] || 1;
  power = power + (level - 1) * 6;

  // Type mapping
  let type: 'attack' | 'defense' | 'special' = 'attack';
  if (isLegendary) {
    type = 'special';
  } else if ((card.unitId) % 2 === 0) {
    type = 'defense';
  }

  // Defense mapping
  let defense = 0;
  if (type === 'defense') {
    defense = isRare ? 18 : 10;
  } else if (type === 'special') {
    defense = 5;
  }

  // Special effect description
  let specialEffect = '';
  if (isLegendary) {
    if ([1, 4].includes(card.unitId)) {
      specialEffect = '화석 폭발!';
    } else if ([2, 7].includes(card.unitId)) {
      specialEffect = '번개 섬광!';
    } else {
      specialEffect = 'DNA 소용돌이!';
    }
  }

  return {
    id: card.id,
    name: card.name,
    emoji: card.image || '❓',
    rarity: (card.rarity || 'common') as 'common' | 'rare' | 'legendary',
    unitId: card.unitId,
    description: card.description,
    power,
    type,
    defense,
    specialEffect
  };
}
