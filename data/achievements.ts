import { Achievement } from '../types';

export const ACHIEVEMENTS_LIST: Achievement[] = [
  // ── 단원 완료 (8개) ──────────────────────────────────────────────
  {
    id: 'unit_1_clear',
    name: '화석 사냥꾼',
    description: '1단원 (지층과 화석) 퀴즈를 완료하세요.',
    icon: '🪨',
    condition: { type: 'unit_complete', unitId: 1 },
    reward: { type: 'costume', costumeId: 'hat_explorer' }
  },
  {
    id: 'unit_2_clear',
    name: '빛의 마법사',
    description: '2단원 (빛의 성질) 퀴즈를 완료하세요.',
    icon: '🌟',
    condition: { type: 'unit_complete', unitId: 2 },
    reward: { type: 'costume', costumeId: 'accessory_magnifier' }
  },
  {
    id: 'unit_3_clear',
    name: '용액 연금술사',
    description: '3단원 (용해와 용액) 퀴즈를 완료하세요.',
    icon: '🧪',
    condition: { type: 'unit_complete', unitId: 3 },
    reward: { type: 'costume', costumeId: 'accessory_testtube' }
  },
  {
    id: 'unit_4_clear',
    name: '인체 탐험가',
    description: '4단원 (우리 몸) 퀴즈를 완료하세요.',
    icon: '❤️',
    condition: { type: 'unit_complete', unitId: 4 },
    reward: { type: 'costume', costumeId: 'outfit_doctor' }
  },
  {
    id: 'unit_5_clear',
    name: '생태계 수호자',
    description: '5단원 (생물과 환경) 퀴즈를 완료하세요.',
    icon: '🌿',
    condition: { type: 'unit_complete', unitId: 5 },
    reward: { type: 'costume', costumeId: 'outfit_eco' }
  },
  {
    id: 'unit_6_clear',
    name: '기상 예보관',
    description: '6단원 (날씨와 우리 생활) 퀴즈를 완료하세요.',
    icon: '🌀',
    condition: { type: 'unit_complete', unitId: 6 },
    reward: { type: 'costume', costumeId: 'outfit_meteorologist' }
  },
  {
    id: 'unit_7_clear',
    name: '로켓 조종사',
    description: '7단원 (물체의 운동) 퀴즈를 완료하세요.',
    icon: '👟',
    condition: { type: 'unit_complete', unitId: 7 },
    reward: { type: 'costume', costumeId: 'outfit_spacesuit' }
  },
  {
    id: 'unit_8_clear',
    name: '산염기 연구원',
    description: '8단원 (산과 염기) 퀴즈를 완료하세요.',
    icon: '⚗️',
    condition: { type: 'unit_complete', unitId: 8 },
    reward: { type: 'costume', costumeId: 'hat_crown' }
  },

  // ── 연속 정답 스트릭 (3개) ───────────────────────────────────────
  {
    id: 'streak_3',
    name: '연속 정답 마스터',
    description: '퀴즈에서 3회 연속 정답을 기록하세요.',
    icon: '🔥',
    condition: { type: 'streak', count: 3 },
    reward: { type: 'costume', costumeId: 'hat_crown' }
  },
  {
    id: 'streak_5',
    name: '퀴즈 파이어 스트릭',
    description: '퀴즈에서 5회 연속 정답을 기록하세요.',
    icon: '🔥🔥',
    condition: { type: 'streak', count: 5 },
    reward: { type: 'coins', amount: 150 }
  },
  {
    id: 'streak_10',
    name: '전설의 완벽 스트릭',
    description: '퀴즈에서 10회 연속 정답을 기록하세요.',
    icon: '⚡',
    condition: { type: 'streak', count: 10 },
    reward: { type: 'title', titleText: '전설의 과학왕' }
  },

  // ── 카드 수집 마일스톤 (4개) ─────────────────────────────────────
  {
    id: 'cards_10',
    name: '초보 수집가',
    description: '도감 카드를 10장 이상 해금하세요.',
    icon: '📚',
    condition: { type: 'questions_correct', count: 10 },
    reward: { type: 'coins', amount: 100 }
  },
  {
    id: 'cards_30',
    name: '중급 도감 트레이너',
    description: '도감 카드를 30장 이상 해금하세요.',
    icon: '📖',
    condition: { type: 'questions_correct', count: 30 },
    reward: { type: 'coins', amount: 200 }
  },
  {
    id: 'cards_60',
    name: '숙련된 과학 박사',
    description: '도감 카드를 60장 이상 해금하세요.',
    icon: '🎓',
    condition: { type: 'questions_correct', count: 60 },
    reward: { type: 'title', titleText: '과학 박사' }
  },
  {
    id: 'cards_80',
    name: '도감 완전 정복!',
    description: '80개의 모든 카드를 해금해 도감을 완성하세요.',
    icon: '👑',
    condition: { type: 'questions_correct', count: 80 },
    reward: { type: 'title', titleText: '과학 마스터 챔피언' }
  },

  // ── 레벨 달성 (3개) ──────────────────────────────────────────────
  {
    id: 'level_2',
    name: '견습 트레이너',
    description: '트레이너 레벨 2에 도달하세요.',
    icon: '🌱',
    condition: { type: 'level', level: 2 },
    reward: { type: 'coins', amount: 50 }
  },
  {
    id: 'level_3',
    name: '우주 탐험가',
    description: '트레이너 레벨 3에 도달하세요.',
    icon: '🚀',
    condition: { type: 'level', level: 3 },
    reward: { type: 'costume', costumeId: 'vehicle_rocket' }
  },
  {
    id: 'level_5',
    name: '엘리트 과학 트레이너',
    description: '트레이너 레벨 5에 도달하세요.',
    icon: '🏆',
    condition: { type: 'level', level: 5 },
    reward: { type: 'title', titleText: '엘리트 트레이너' }
  },

  // ── 특별 업적 (2개) ──────────────────────────────────────────────
  {
    id: 'all_units_clear',
    name: '8단원 과학 마스터',
    description: '8개 단원을 모두 완료하세요.',
    icon: '🎖️',
    condition: { type: 'unit_complete', unitId: 0 },  // unitId 0 = 모든 단원
    reward: { type: 'title', titleText: '과학 마스터' }
  },
  {
    id: 'boss_damage_500',
    name: '레이드 영웅',
    description: '보스 레이드에서 누적 500 데미지를 입히세요.',
    icon: '⚔️',
    condition: { type: 'boss_damage', total: 500 },
    reward: { type: 'costume', costumeId: 'hat_helmet' }
  },
];

/** achievement ID로 업적 이름을 빠르게 조회하는 맵 */
export const ACHIEVEMENT_NAME_MAP: Record<string, string> = Object.fromEntries(
  ACHIEVEMENTS_LIST.map(a => [a.id, a.name])
);
