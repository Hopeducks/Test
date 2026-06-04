import { describe, it, expect } from 'vitest';
import { questions } from '../data/questions';
import { cards } from '../data/cards';

describe('문항 데이터 무결성', () => {
  it('전체 문항 수는 320개', () => {
    expect(questions).toHaveLength(320);
  });

  it('각 단원당 40문항 존재', () => {
    for (let unitId = 1; unitId <= 8; unitId++) {
      const unitQs = questions.filter(q => q.unitId === unitId);
      expect(unitQs).toHaveLength(40);
    }
  });

  it('correctIndex는 0~3 사이 정수', () => {
    for (const q of questions) {
      expect([0, 1, 2, 3]).toContain(q.correctIndex);
    }
  });

  it('모든 문항에 4개의 선택지 존재', () => {
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      for (const opt of q.options) {
        expect(opt).toBeTruthy();
      }
    }
  });

  it('문항 ID는 중복 없음', () => {
    const ids = questions.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('cardReward가 있는 경우 유효한 카드 ID 참조', () => {
    const validCardIds = new Set(cards.map(c => c.id));
    const questionsWithReward = questions.filter(q => q.cardReward);
    for (const q of questionsWithReward) {
      expect(validCardIds.has(q.cardReward!)).toBe(true);
    }
  });

  it('각 단원당 cardReward 문항이 9개', () => {
    for (let unitId = 1; unitId <= 8; unitId++) {
      const unitQs = questions.filter(q => q.unitId === unitId);
      const withReward = unitQs.filter(q => q.cardReward);
      expect(withReward).toHaveLength(9);
    }
  });

  it('모든 문항에 explanation 필드 존재', () => {
    for (const q of questions) {
      expect(q.explanation).toBeTruthy();
    }
  });
});
