// 포켓몬 속성(Attribute) 시스템
// 단원 번호 → 속성 매핑과 상성 테이블로 카드 배틀 배율을 계산한다.
// game-state.ts에서 re-export 하여 기존 import 경로 하위 호환을 유지한다.

export type PokemonAttribute = '땅' | '전기' | '물' | '에스퍼' | '풀' | '비행' | '노말' | '불꽃';

export const ATTRIBUTE_EMOJIS: Record<PokemonAttribute, string> = {
  '땅': '🪨',
  '전기': '⚡',
  '물': '💧',
  '에스퍼': '🔮',
  '풀': '🍃',
  '비행': '🌪️',
  '노말': '⚪',
  '불꽃': '🔥'
};

export const ATTRIBUTE_NAMES: Record<PokemonAttribute, string> = {
  '땅': '땅 (Ground)',
  '전기': '전기 (Electric)',
  '물': '물 (Water)',
  '에스퍼': '에스퍼 (Psychic)',
  '풀': '풀 (Grass)',
  '비행': '비행 (Flying)',
  '노말': '노말 (Normal)',
  '불꽃': '불꽃 (Fire)'
};

export const ATTRIBUTE_COLORS: Record<PokemonAttribute, string> = {
  '땅': 'text-amber-500 bg-amber-950/40 border-amber-500/30',
  '전기': 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30',
  '물': 'text-blue-400 bg-blue-950/40 border-blue-500/30',
  '에스퍼': 'text-purple-400 bg-purple-950/40 border-purple-500/30',
  '풀': 'text-green-400 bg-green-950/40 border-green-500/30',
  '비행': 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
  '노말': 'text-gray-400 bg-gray-950/40 border-gray-500/30',
  '불꽃': 'text-red-500 bg-red-950/40 border-red-500/30'
};

const ATTRIBUTE_MAPPING: Record<number, PokemonAttribute> = {
  1: '땅',
  2: '전기',
  3: '물',
  4: '에스퍼',
  5: '풀',
  6: '비행',
  7: '노말',
  8: '불꽃'
};

export function getCardAttribute(unitId: number): PokemonAttribute {
  return ATTRIBUTE_MAPPING[unitId] || '노말';
}

const ATTRIBUTE_RELATIONSHIPS: Record<PokemonAttribute, Partial<Record<PokemonAttribute, number>>> = {
  '불꽃': { '풀': 2, '물': 0.5, '불꽃': 0.5 },
  '물': { '불꽃': 2, '땅': 2, '물': 0.5, '풀': 0.5 },
  '풀': { '물': 2, '땅': 2, '불꽃': 0.5, '풀': 0.5, '비행': 0.5 },
  '전기': { '물': 2, '비행': 2, '풀': 0.5, '전기': 0.5, '땅': 0 },
  '땅': { '불꽃': 2, '전기': 2, '풀': 0.5, '비행': 0 },
  '비행': { '풀': 2, '전기': 0.5 },
  '에스퍼': { '노말': 2, '에스퍼': 0.5 },
  '노말': {}
};

export function getAttackMultiplier(attackerUnitId: number, defenderUnitId: number): number {
  const attackerAttr = getCardAttribute(attackerUnitId);
  const defenderAttr = getCardAttribute(defenderUnitId);
  return ATTRIBUTE_RELATIONSHIPS[attackerAttr]?.[defenderAttr] ?? 1.0;
}

export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier >= 2.0) return '효과는 굉장했다! (2.0배) 💥';
  if (multiplier <= 0.0) return '효과가 전혀 없는 것 같다... (0.0배) 💨';
  if (multiplier < 1.0) return '효과가 별로인 듯하다... (0.5배) 🛡️';
  return '';
}
