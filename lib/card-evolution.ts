import { cards } from '../data/cards';
import { getCardAttribute } from './attributes';

export const EVOLUTION_LEVELS = { stage2: 4, stage3: 8 } as const;

const ATTRIBUTE_SKILLS: Record<string, string[]> = {
  '땅':   ['몸통박치기', '모래뿌리기', '지진 🪨'],
  '전기': ['전기자석파', '10만볼트', '번개 ⚡'],
  '물':   ['거품', '물대포', '하이드로펌프 💧'],
  '에스퍼': ['명상', '환상빔', '사이코키네시스 🔮'],
  '풀':   ['잎날여르기', '덩굴채찍', '솔라빔 🍃'],
  '비행': ['바람일으키기', '에어슬래시', '폭풍 🌪️'],
  '노말': ['몸통박치기', '헤드버트', '기가임팩트 ⚪'],
  '불꽃': ['불꽃세례', '화염방사', '오버히트 🔥'],
};

export function getCardEvolution(cardId: string, level: number): {
  name: string;
  emoji: string;
  stage: number;
  skills: string[];
} {
  const card = cards.find(c => c.id === cardId);
  if (!card) {
    return { name: '알 수 없음', emoji: '❓', stage: 1, skills: ['몸통박치기'] };
  }

  const attribute = getCardAttribute(card.unitId);
  const allSkills = ATTRIBUTE_SKILLS[attribute] ?? ATTRIBUTE_SKILLS['노말'];
  const activeSkills = [allSkills[0]];
  if (level >= EVOLUTION_LEVELS.stage2) activeSkills.push(allSkills[1]);
  if (level >= EVOLUTION_LEVELS.stage3) activeSkills.push(allSkills[2]);

  let evolvedName = card.name;
  let evolvedEmoji = (card.image || card.emoji || '❓') as string;
  let stage = 1;

  if (level >= EVOLUTION_LEVELS.stage3) {
    evolvedName = `초강력 ${card.name}`;
    evolvedEmoji = `👑${evolvedEmoji}`;
    stage = 3;
  } else if (level >= EVOLUTION_LEVELS.stage2) {
    evolvedName = `진화한 ${card.name}`;
    evolvedEmoji = `${evolvedEmoji}✨`;
    stage = 2;
  }

  return { name: evolvedName, emoji: evolvedEmoji, stage, skills: activeSkills };
}
