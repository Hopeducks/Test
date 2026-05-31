import { CostumeItem } from '../types';

export const costumeCatalog: CostumeItem[] = [
  // ── 의상 (10종) ──────────────────────────────────
  {
    id: 'outfit_scientist',
    name: '과학자 가운',
    category: 'outfit',
    rarity: 'common',
    unlockCondition: { type: 'default' },
    spriteKey: 'outfit_scientist_spr',
    stats: { hp: 10, defense: 2 }
  },
  {
    id: 'outfit_spacesuit',
    name: '우주복',
    category: 'outfit',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'first_space_quiz' },
    price: 150,
    spriteKey: 'outfit_spacesuit_spr',
    stats: { hp: 25, defense: 5 }
  },
  {
    id: 'outfit_diver',
    name: '잠수복',
    category: 'outfit',
    rarity: 'common',
    unlockCondition: { type: 'unit_complete', unitId: 3 },
    spriteKey: 'outfit_diver_spr',
    stats: { hp: 12, defense: 3 }
  },
  {
    id: 'outfit_paleontologist',
    name: '고생물학자 의상',
    category: 'outfit',
    rarity: 'rare',
    unlockCondition: { type: 'unit_complete', unitId: 5 },
    spriteKey: 'outfit_paleo_spr',
    stats: { hp: 30, defense: 6 }
  },
  {
    id: 'outfit_chemist',
    name: '화학자 의상',
    category: 'outfit',
    rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 80 },
    price: 80,
    spriteKey: 'outfit_chemist_spr',
    stats: { hp: 15, defense: 2 }
  },
  {
    id: 'outfit_meteorologist',
    name: '기상관측사 의상',
    category: 'outfit',
    rarity: 'common',
    unlockCondition: { type: 'level', level: 3 },
    spriteKey: 'outfit_meteor_spr',
    stats: { hp: 15, defense: 3 }
  },
  {
    id: 'outfit_doctor',
    name: '의사 의상',
    category: 'outfit',
    rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 120 },
    price: 120,
    spriteKey: 'outfit_doctor_spr',
    stats: { hp: 28, defense: 5 }
  },
  {
    id: 'outfit_optics',
    name: '빛 연구원 의상',
    category: 'outfit',
    rarity: 'common',
    unlockCondition: { type: 'unit_complete', unitId: 1 },
    spriteKey: 'outfit_optics_spr',
    stats: { hp: 10, defense: 2 }
  },
  {
    id: 'outfit_eco',
    name: '환경 활동가 의상',
    category: 'outfit',
    rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 100 },
    price: 100,
    spriteKey: 'outfit_eco_spr',
    stats: { hp: 25, defense: 6 }
  },
  {
    id: 'outfit_legend',
    name: '전설 연구원 의상',
    category: 'outfit',
    rarity: 'legendary',
    unlockCondition: { type: 'achievement', achievementId: 'all_units_clear' },
    spriteKey: 'outfit_legend_spr',
    stats: { hp: 55, attack: 15, defense: 12 }
  },

  // ── 악세서리 (7종) ──────────────────────────────────
  {
    id: 'accessory_magnifier',
    name: '돋보기',
    category: 'accessory',
    rarity: 'common',
    unlockCondition: { type: 'default' },
    spriteKey: 'acc_magnifier_spr',
    stats: { hp: 10, attack: 3 }
  },
  {
    id: 'accessory_goggles',
    name: '안전 고글',
    category: 'accessory',
    rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 30 },
    price: 30,
    spriteKey: 'acc_goggles_spr',
    stats: { hp: 10, defense: 3 }
  },
  {
    id: 'accessory_stethoscope',
    name: '청진기',
    category: 'accessory',
    rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 60 },
    price: 60,
    spriteKey: 'acc_stethoscope_spr',
    stats: { hp: 20, defense: 5 }
  },
  {
    id: 'accessory_compass',
    name: '나침반',
    category: 'accessory',
    rarity: 'common',
    unlockCondition: { type: 'level', level: 2 },
    spriteKey: 'acc_compass_spr',
    stats: { hp: 10, attack: 2 }
  },
  {
    id: 'accessory_prism',
    name: '프리즘',
    category: 'accessory',
    rarity: 'rare',
    unlockCondition: { type: 'unit_complete', unitId: 2 },
    spriteKey: 'acc_prism_spr',
    stats: { hp: 15, attack: 10 }
  },
  {
    id: 'accessory_testtube',
    name: '시험관 목걸이',
    category: 'accessory',
    rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 40 },
    price: 40,
    spriteKey: 'acc_testtube_spr',
    stats: { hp: 10, attack: 3 }
  },
  {
    id: 'accessory_crystal',
    name: '전설 크리스탈',
    category: 'accessory',
    rarity: 'legendary',
    unlockCondition: { type: 'achievement', achievementId: 'boss_slayer' },
    spriteKey: 'acc_crystal_spr',
    stats: { attack: 18, hp: 45, defense: 10 }
  },

  // ── 탈 것 (6종) ──────────────────────────────────
  {
    id: 'vehicle_rocket',
    name: '로켓',
    category: 'vehicle',
    rarity: 'legendary',
    unlockCondition: { type: 'achievement', achievementId: 'rocket_pilot' },
    spriteKey: 'veh_rocket_spr',
    stats: { attack: 22, hp: 50 }
  },
  {
    id: 'vehicle_ufo',
    name: '비행접시',
    category: 'vehicle',
    rarity: 'legendary',
    unlockCondition: { type: 'purchase', coinCost: 500 },
    price: 500,
    spriteKey: 'veh_ufo_spr',
    stats: { hp: 40, attack: 20, defense: 12 }
  },
  {
    id: 'vehicle_submarine',
    name: '잠수함',
    category: 'vehicle',
    rarity: 'rare',
    unlockCondition: { type: 'unit_complete', unitId: 4 },
    spriteKey: 'veh_sub_spr',
    stats: { defense: 6, hp: 25 }
  },
  {
    id: 'vehicle_balloon',
    name: '열기구',
    category: 'vehicle',
    rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 250 },
    price: 250,
    spriteKey: 'veh_balloon_spr',
    stats: { hp: 30, defense: 5 }
  },
  {
    id: 'vehicle_skates',
    name: '롤러스케이트',
    category: 'vehicle',
    rarity: 'common',
    unlockCondition: { type: 'default' },
    spriteKey: 'veh_skates_spr',
    stats: { attack: 3, hp: 8 }
  },
  {
    id: 'vehicle_scooter',
    name: '전동 킥보드',
    category: 'vehicle',
    rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 100 },
    price: 100,
    spriteKey: 'veh_scooter_spr',
    stats: { hp: 6, attack: 4, defense: 2 }
  },

  // ── 모자 (6종) ──────────────────────────────────
  {
    id: 'hat_explorer',
    name: '탐험가 모자',
    category: 'hat',
    rarity: 'common',
    unlockCondition: { type: 'default' },
    spriteKey: 'hat_explorer_spr',
    stats: { hp: 10, defense: 2 }
  },
  {
    id: 'hat_mortarboard',
    name: '졸업모',
    category: 'hat',
    rarity: 'rare',
    unlockCondition: { type: 'level', level: 5 },
    spriteKey: 'hat_mortarboard_spr',
    stats: { hp: 20, attack: 7, defense: 3 }
  },
  {
    id: 'hat_helmet',
    name: '안전모',
    category: 'hat',
    rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 50 },
    price: 50,
    spriteKey: 'hat_helmet_spr',
    stats: { hp: 10, defense: 3 }
  },
  {
    id: 'hat_beanie',
    name: '소용돌이 비니',
    category: 'hat',
    rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 40 },
    price: 40,
    spriteKey: 'hat_beanie_spr',
    stats: { hp: 12, defense: 1 }
  },
  {
    id: 'hat_spacesuit_helmet',
    name: '우주 헬멧',
    category: 'hat',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'first_space_quiz' },
    spriteKey: 'hat_space_spr',
    stats: { hp: 20, attack: 5, defense: 5 }
  },
  {
    id: 'hat_crown',
    name: '왕관',
    category: 'hat',
    rarity: 'legendary',
    unlockCondition: { type: 'achievement', achievementId: 'streak_master' },
    spriteKey: 'hat_crown_spr',
    stats: { hp: 50, attack: 15, defense: 10 }
  },

  // ── 체육관 배지 (9종 - 카테고리를 badge로 분리) ───────────────────
  {
    id: 'accessory_badge',
    name: '화석 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'unit_complete', unitId: 6 },
    spriteKey: 'acc_badge_spr',
    stats: { hp: 20, defense: 6, attack: 4 }
  },
  {
    id: 'accessory_badge_u1',
    name: '지층 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'gym_badge_u1' },
    spriteKey: 'acc_badge_u1_spr',
    stats: { hp: 20, defense: 5, attack: 5 }
  },
  {
    id: 'accessory_badge_u2',
    name: '빛의 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'gym_badge_u2' },
    spriteKey: 'acc_badge_u2_spr',
    stats: { hp: 20, attack: 6, defense: 4 }
  },
  {
    id: 'accessory_badge_u3',
    name: '용해 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'gym_badge_u3' },
    spriteKey: 'acc_badge_u3_spr',
    stats: { hp: 20, defense: 5, attack: 5 }
  },
  {
    id: 'accessory_badge_u4',
    name: '우리몸 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'gym_badge_u4' },
    spriteKey: 'acc_badge_u4_spr',
    stats: { hp: 25, defense: 3, attack: 2 }
  },
  {
    id: 'accessory_badge_u5',
    name: '생물환경 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'gym_badge_u5' },
    spriteKey: 'acc_badge_u5_spr',
    stats: { hp: 20, defense: 5, attack: 5 }
  },
  {
    id: 'accessory_badge_u6',
    name: '날씨 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'gym_badge_u6' },
    spriteKey: 'acc_badge_u6_spr',
    stats: { hp: 20, attack: 6, defense: 4 }
  },
  {
    id: 'accessory_badge_u7',
    name: '운동 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'gym_badge_u7' },
    spriteKey: 'acc_badge_u7_spr',
    stats: { hp: 20, attack: 6, defense: 4 }
  },
  {
    id: 'accessory_badge_u8',
    name: '산염기 배지',
    category: 'badge',
    rarity: 'rare',
    unlockCondition: { type: 'achievement', achievementId: 'gym_badge_u8' },
    spriteKey: 'acc_badge_u8_spr',
    stats: { hp: 18, attack: 8, defense: 4 }
  },

  // ── 칭호 (3종) ──────────────────────────────────
  {
    id: 'title_beginner',
    name: '초보 연구원',
    category: 'title',
    rarity: 'common',
    unlockCondition: { type: 'default' },
    spriteKey: 'title_beginner_spr',
    stats: { hp: 10, attack: 2 }
  },
  {
    id: 'title_gym_breaker',
    name: '체육관 돌파자',
    category: 'title',
    rarity: 'rare',
    unlockCondition: { type: 'level', level: 3 },
    price: 100,
    spriteKey: 'title_gym_breaker_spr',
    stats: { hp: 18, attack: 8, defense: 4 }
  },
  {
    id: 'title_science_master',
    name: '과학 마스터',
    category: 'title',
    rarity: 'legendary',
    unlockCondition: { type: 'achievement', achievementId: 'all_units_clear' },
    spriteKey: 'title_science_master_spr',
    stats: { hp: 45, attack: 18, defense: 12 }
  },

  // ── 전용 동반자 펫 (5종) ──────────────────────────
  {
    id: 'pet_robo',
    name: '꼬마 로봇',
    category: 'pet',
    rarity: 'common',
    unlockCondition: { type: 'default' },
    spriteKey: 'pet_robo_spr',
    stats: { hp: 12, defense: 1 }
  },
  {
    id: 'pet_slime',
    name: '실험실 슬라임',
    category: 'pet',
    rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 60 },
    price: 60,
    spriteKey: 'pet_slime_spr',
    stats: { hp: 10, defense: 3 }
  },
  {
    id: 'pet_dino',
    name: '아기 공룡',
    category: 'pet',
    rarity: 'rare',
    unlockCondition: { type: 'level', level: 4 },
    price: 150,
    spriteKey: 'pet_dino_spr',
    stats: { hp: 25, defense: 5 }
  },
  {
    id: 'pet_cat',
    name: '양자 고양이',
    category: 'pet',
    rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 200 },
    price: 200,
    spriteKey: 'pet_cat_spr',
    stats: { hp: 18, attack: 8, defense: 4 }
  },
  {
    id: 'pet_dragon',
    name: '전설의 드래곤',
    category: 'pet',
    rarity: 'legendary',
    unlockCondition: { type: 'achievement', achievementId: 'boss_slayer' },
    spriteKey: 'pet_dragon_spr',
    stats: { hp: 50, attack: 16, defense: 10 }
  }
];
