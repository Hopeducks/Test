import { describe, it, expect } from 'vitest';
import { costumeCatalog, UNIT_MILESTONE_COSTUME_IDS } from '../data/costume-catalog';
import { ACHIEVEMENTS_LIST } from '../data/achievements';

const catalogIds = new Set(costumeCatalog.map(c => c.id));

describe('코스튬 ID 정합성 (D4)', () => {
  it('모든 단원 마일스톤 코스튬 ID는 카탈로그에 존재한다', () => {
    Object.values(UNIT_MILESTONE_COSTUME_IDS).forEach(id => {
      expect(catalogIds.has(id), `마일스톤 코스튬 누락: ${id}`).toBe(true);
    });
  });

  it('모든 업적 costume 보상의 costumeId는 카탈로그에 존재한다', () => {
    ACHIEVEMENTS_LIST.forEach(ach => {
      if (ach.reward.type === 'costume') {
        expect(
          catalogIds.has(ach.reward.costumeId),
          `업적 ${ach.id}의 보상 코스튬 누락: ${ach.reward.costumeId}`
        ).toBe(true);
      }
    });
  });

  it('8개 단원 모두 마일스톤 코스튬이 정의되어 있다', () => {
    for (let unit = 1; unit <= 8; unit++) {
      expect(UNIT_MILESTONE_COSTUME_IDS[unit]).toBeTruthy();
    }
  });

  it('카탈로그 ID는 중복되지 않는다', () => {
    expect(catalogIds.size).toBe(costumeCatalog.length);
  });
});
