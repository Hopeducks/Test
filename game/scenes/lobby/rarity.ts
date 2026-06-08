import { costumeCatalog } from '../../../data/costume-catalog';
import { CostumeRarity } from '../../../types';

/**
 * 등급 오라 파생 + 모션 감쇠 — Phaser 비의존 순수 로직 (E-2/E-4).
 * (Phaser import가 없어 node 환경 단위 테스트에서 그대로 사용 가능)
 */

/** 교실 저사양/접근성 — 모션 감쇠 여부. SSR 안전. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const RARITY_ORDER: Record<CostumeRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

const RARITY_COLOR: Record<CostumeRarity, number> = {
  common: 0x94a3b8,
  rare: 0x38bdf8,
  epic: 0xe879f9,
  legendary: 0xfbbf24,
};

export interface RarityAura {
  rarity: CostumeRarity;
  color: number;
  /** 오라를 그릴 가치가 있는 등급인가(epic 이상). */
  show: boolean;
}

/**
 * 장착된 코스튬 id 목록에서 최고 등급을 파생해 오라 스펙을 반환한다.
 * 카탈로그에 없는 id(카드 펫 등)는 무시한다.
 */
export function deriveRarityAura(ids: Array<string | null | undefined>): RarityAura {
  let best: CostumeRarity = 'common';
  for (const id of ids) {
    if (!id || id === 'none') continue;
    const item = costumeCatalog.find((c) => c.id === id);
    if (!item) continue;
    if (RARITY_ORDER[item.rarity] > RARITY_ORDER[best]) {
      best = item.rarity;
    }
  }
  return {
    rarity: best,
    color: RARITY_COLOR[best],
    show: RARITY_ORDER[best] >= RARITY_ORDER.epic,
  };
}
