import { describe, it, expect } from 'vitest';
import {
  costumeCatalog,
  UNIT_MILESTONE_COSTUME_IDS,
  COSTUME_SETS,
  getActiveSetBonus,
} from '../data/costume-catalog';
import { ACHIEVEMENTS_LIST } from '../data/achievements';
import { ITEM_EMOJIS } from '../components/ui/avatar/avatar-constants';

const catalogIds = new Set(costumeCatalog.map(c => c.id));
const VALID_RARITIES = ['common', 'rare', 'epic', 'legendary'];

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

describe('카탈로그 확장 (C-1)', () => {
  it('코스튬 90종 이상', () => {
    expect(costumeCatalog.length).toBeGreaterThanOrEqual(90);
  });

  it('등급은 4단계(common/rare/epic/legendary) 내', () => {
    costumeCatalog.forEach(item => {
      expect(VALID_RARITIES, `${item.id} 등급 비정상: ${item.rarity}`).toContain(item.rarity);
    });
  });

  it('epic 등급 상품이 실제로 존재한다', () => {
    expect(costumeCatalog.some(c => c.rarity === 'epic')).toBe(true);
  });

  it('모든 코스튬은 ITEM_EMOJIS에 미리보기 이모지가 있다(로비/미리보기 렌더)', () => {
    costumeCatalog.forEach(item => {
      expect(ITEM_EMOJIS[item.id], `${item.id} 이모지 누락`).toBeTruthy();
    });
  });
});

describe('코스튬 세트 효과 (C-2)', () => {
  it('모든 세트 멤버 ID는 카탈로그에 존재한다', () => {
    COSTUME_SETS.forEach(set => {
      set.memberIds.forEach(id => {
        expect(catalogIds.has(id), `세트 ${set.id} 멤버 누락: ${id}`).toBe(true);
      });
    });
  });

  it('세트 멤버는 모두 동일 setId를 가진다', () => {
    COSTUME_SETS.forEach(set => {
      set.memberIds.forEach(id => {
        const item = costumeCatalog.find(c => c.id === id);
        expect(item?.setId, `${id}의 setId 불일치`).toBe(set.id);
      });
    });
  });

  it('세트 전부 장착 시에만 CP 보너스가 적용된다', () => {
    const space = COSTUME_SETS.find(s => s.id === 'set_space')!;
    // 일부만 장착 → 0
    const partial = getActiveSetBonus([space.memberIds[0], 'none']);
    expect(partial.totalCpBonus).toBe(0);
    // 전부 장착 → 보너스
    const full = getActiveSetBonus(space.memberIds);
    expect(full.totalCpBonus).toBe(space.cpBonus);
    expect(full.activeSets.map(s => s.id)).toContain('set_space');
  });

  it("'none'/빈 값은 세트 판정에서 무시된다", () => {
    expect(getActiveSetBonus(['none', undefined, null]).totalCpBonus).toBe(0);
  });
});
