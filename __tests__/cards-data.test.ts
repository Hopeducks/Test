import { describe, it, expect } from 'vitest';
import { cards } from '../data/cards';

describe('카드 데이터 무결성', () => {
  it('전체 카드 수는 80개', () => {
    expect(cards).toHaveLength(80);
  });

  it('각 단원당 10개 카드 존재', () => {
    for (let unitId = 1; unitId <= 8; unitId++) {
      const unitCards = cards.filter(c => c.unitId === unitId);
      expect(unitCards).toHaveLength(10);
    }
  });

  it('각 단원 마지막 카드는 legendary 등급', () => {
    for (let unitId = 1; unitId <= 8; unitId++) {
      const unitCards = cards.filter(c => c.unitId === unitId);
      const last = unitCards[unitCards.length - 1];
      expect(last.rarity).toBe('legendary');
    }
  });

  it('카드 ID 형식은 u{unitId}_c{index}', () => {
    for (const card of cards) {
      expect(card.id).toMatch(/^u[1-8]_c\d+$/);
    }
  });

  it('모든 카드에 name, image, description 필드 존재', () => {
    for (const card of cards) {
      expect(card.name).toBeTruthy();
      expect(card.image).toBeTruthy();
      expect(card.description).toBeTruthy();
    }
  });

  it('카드 ID는 중복 없음', () => {
    const ids = cards.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('rarity는 CardRarity 유효값 중 하나', () => {
    // types/index.ts: CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
    const validRarities = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary']);
    for (const card of cards) {
      expect(card.rarity).toBeDefined();
      expect(validRarities.has(card.rarity as string)).toBe(true);
    }
  });
});
