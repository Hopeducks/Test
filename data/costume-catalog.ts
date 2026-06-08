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
    setId: 'set_space',
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
    setId: 'set_medic',
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
    setId: 'set_medic',
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
    setId: 'set_space',
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
    setId: 'set_space',
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
  },

  // ════════════════════════════════════════════════════════
  // Phase F4 2.4 신규 상품 (46종) — 등급 4단계(epic 포함)·세트 효과
  // ════════════════════════════════════════════════════════

  // ── 신규 의상 (+9) ──────────────────────────────────
  {
    id: 'outfit_botanist', name: '식물학자 의상', category: 'outfit', rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 90 }, price: 90,
    spriteKey: 'outfit_botanist_spr', stats: { hp: 14, defense: 3 }
  },
  {
    id: 'outfit_geologist', name: '지질학자 의상', category: 'outfit', rarity: 'common',
    unlockCondition: { type: 'unit_complete', unitId: 6 },
    spriteKey: 'outfit_geologist_spr', stats: { hp: 14, defense: 3 }
  },
  {
    id: 'outfit_astronomer', name: '천문학자 의상', category: 'outfit', rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 160 }, price: 160,
    spriteKey: 'outfit_astronomer_spr', stats: { hp: 26, attack: 6, defense: 5 }
  },
  {
    id: 'outfit_inventor', name: '발명가 의상', category: 'outfit', rarity: 'rare',
    unlockCondition: { type: 'level', level: 4 },
    spriteKey: 'outfit_inventor_spr', stats: { hp: 28, attack: 7, defense: 4 }
  },
  {
    id: 'outfit_arctic', name: '극지 탐험대 의상', category: 'outfit', rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 200 }, price: 200,
    spriteKey: 'outfit_arctic_spr', stats: { hp: 32, defense: 8 }
  },
  {
    id: 'outfit_marine', name: '심해 연구복', category: 'outfit', rarity: 'epic',
    unlockCondition: { type: 'purchase', coinCost: 350 }, price: 350,
    spriteKey: 'outfit_marine_spr', stats: { hp: 40, attack: 10, defense: 10 }
  },
  {
    id: 'outfit_volcano', name: '화산 방호복', category: 'outfit', rarity: 'epic',
    unlockCondition: { type: 'purchase', coinCost: 380 }, price: 380,
    spriteKey: 'outfit_volcano_spr', setId: 'set_volcano', stats: { hp: 42, attack: 12, defense: 9 }
  },
  {
    id: 'outfit_ninja_sci', name: '과학 닌자 슈트', category: 'outfit', rarity: 'epic',
    unlockCondition: { type: 'level', level: 5 },
    spriteKey: 'outfit_ninja_sci_spr', stats: { hp: 38, attack: 16, defense: 8 }
  },
  {
    id: 'outfit_galaxy', name: '은하 수호자 의상', category: 'outfit', rarity: 'legendary',
    unlockCondition: { type: 'purchase', coinCost: 800 }, price: 800,
    spriteKey: 'outfit_galaxy_spr', setId: 'set_cosmos', stats: { hp: 60, attack: 18, defense: 14 }
  },

  // ── 신규 악세서리 (+9) ──────────────────────────────
  {
    id: 'accessory_beaker', name: '실험 비커', category: 'accessory', rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 35 }, price: 35,
    spriteKey: 'acc_beaker_spr', stats: { hp: 10, attack: 3 }
  },
  {
    id: 'accessory_lightbulb', name: '아이디어 전구', category: 'accessory', rarity: 'common',
    unlockCondition: { type: 'unit_complete', unitId: 2 },
    spriteKey: 'acc_lightbulb_spr', stats: { hp: 10, attack: 4 }
  },
  {
    id: 'accessory_battery', name: '에너지 배터리', category: 'accessory', rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 45 }, price: 45,
    spriteKey: 'acc_battery_spr', stats: { hp: 12, attack: 3 }
  },
  {
    id: 'accessory_microscope', name: '휴대용 현미경', category: 'accessory', rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 90 }, price: 90,
    spriteKey: 'acc_microscope_spr', stats: { hp: 18, attack: 9, defense: 3 }
  },
  {
    id: 'accessory_telescope', name: '손망원경', category: 'accessory', rarity: 'rare',
    unlockCondition: { type: 'level', level: 3 },
    spriteKey: 'acc_telescope_spr', stats: { hp: 16, attack: 10 }
  },
  {
    id: 'accessory_magnet', name: '강력 자석', category: 'accessory', rarity: 'rare',
    unlockCondition: { type: 'unit_complete', unitId: 7 },
    spriteKey: 'acc_magnet_spr', stats: { hp: 18, attack: 8, defense: 4 }
  },
  {
    id: 'accessory_dna', name: 'DNA 펜던트', category: 'accessory', rarity: 'epic',
    unlockCondition: { type: 'purchase', coinCost: 320 }, price: 320,
    spriteKey: 'acc_dna_spr', stats: { hp: 30, attack: 14, defense: 8 }
  },
  {
    id: 'accessory_atom', name: '원자 모형', category: 'accessory', rarity: 'epic',
    unlockCondition: { type: 'level', level: 5 },
    spriteKey: 'acc_atom_spr', stats: { hp: 28, attack: 16, defense: 6 }
  },
  {
    id: 'accessory_galaxy_orb', name: '은하 오브', category: 'accessory', rarity: 'legendary',
    unlockCondition: { type: 'purchase', coinCost: 700 }, price: 700,
    spriteKey: 'acc_galaxy_orb_spr', setId: 'set_cosmos', stats: { hp: 48, attack: 20, defense: 12 }
  },

  // ── 신규 탈것 (+6) ──────────────────────────────────
  {
    id: 'vehicle_bike', name: '과학 자전거', category: 'vehicle', rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 80 }, price: 80,
    spriteKey: 'veh_bike_spr', stats: { hp: 8, attack: 4 }
  },
  {
    id: 'vehicle_hoverboard', name: '호버보드', category: 'vehicle', rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 220 }, price: 220,
    spriteKey: 'veh_hoverboard_spr', stats: { hp: 24, attack: 10, defense: 4 }
  },
  {
    id: 'vehicle_dino_ride', name: '공룡 라이드', category: 'vehicle', rarity: 'rare',
    unlockCondition: { type: 'unit_complete', unitId: 5 },
    spriteKey: 'veh_dino_ride_spr', stats: { hp: 30, attack: 12, defense: 5 }
  },
  {
    id: 'vehicle_jetpack', name: '제트팩', category: 'vehicle', rarity: 'epic',
    unlockCondition: { type: 'purchase', coinCost: 360 }, price: 360,
    spriteKey: 'veh_jetpack_spr', stats: { hp: 34, attack: 18, defense: 8 }
  },
  {
    id: 'vehicle_mecha', name: '과학 메카', category: 'vehicle', rarity: 'epic',
    unlockCondition: { type: 'level', level: 6 },
    spriteKey: 'veh_mecha_spr', stats: { hp: 44, attack: 16, defense: 14 }
  },
  {
    id: 'vehicle_dragon_ride', name: '드래곤 라이드', category: 'vehicle', rarity: 'legendary',
    unlockCondition: { type: 'purchase', coinCost: 750 }, price: 750,
    spriteKey: 'veh_dragon_ride_spr', stats: { hp: 55, attack: 22, defense: 13 }
  },

  // ── 신규 모자 (+7) ──────────────────────────────────
  {
    id: 'hat_party', name: '파티 고깔', category: 'hat', rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 35 }, price: 35,
    spriteKey: 'hat_party_spr', stats: { hp: 8, attack: 2 }
  },
  {
    id: 'hat_antenna', name: '안테나 머리띠', category: 'hat', rarity: 'common',
    unlockCondition: { type: 'unit_complete', unitId: 2 },
    spriteKey: 'hat_antenna_spr', stats: { hp: 10, attack: 3 }
  },
  {
    id: 'hat_wizard', name: '마법사 모자', category: 'hat', rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 140 }, price: 140,
    spriteKey: 'hat_wizard_spr', stats: { hp: 22, attack: 9, defense: 3 }
  },
  {
    id: 'hat_pirate', name: '해적 모자', category: 'hat', rarity: 'rare',
    unlockCondition: { type: 'unit_complete', unitId: 3 },
    spriteKey: 'hat_pirate_spr', stats: { hp: 20, attack: 8, defense: 4 }
  },
  {
    id: 'hat_halo', name: '천사 고리', category: 'hat', rarity: 'epic',
    unlockCondition: { type: 'level', level: 5 },
    spriteKey: 'hat_halo_spr', stats: { hp: 30, attack: 10, defense: 10 }
  },
  {
    id: 'hat_volcano', name: '화산 헬멧', category: 'hat', rarity: 'epic',
    unlockCondition: { type: 'purchase', coinCost: 340 }, price: 340,
    spriteKey: 'hat_volcano_spr', setId: 'set_volcano', stats: { hp: 32, attack: 13, defense: 9 }
  },
  {
    id: 'hat_galaxy', name: '은하 왕관', category: 'hat', rarity: 'legendary',
    unlockCondition: { type: 'purchase', coinCost: 700 }, price: 700,
    spriteKey: 'hat_galaxy_spr', setId: 'set_cosmos', stats: { hp: 52, attack: 17, defense: 13 }
  },

  // ── 신규 칭호 (+7) ──────────────────────────────────
  {
    id: 'title_explorer', name: '탐험가', category: 'title', rarity: 'common',
    unlockCondition: { type: 'unit_complete', unitId: 1 },
    spriteKey: 'title_explorer_spr', stats: { hp: 10, attack: 3 }
  },
  {
    id: 'title_collector', name: '수집왕', category: 'title', rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 150 }, price: 150,
    spriteKey: 'title_collector_spr', stats: { hp: 18, attack: 8, defense: 4 }
  },
  {
    id: 'title_inventor', name: '발명왕', category: 'title', rarity: 'rare',
    unlockCondition: { type: 'level', level: 4 },
    spriteKey: 'title_inventor_spr', stats: { hp: 18, attack: 9, defense: 3 }
  },
  {
    id: 'title_legend_seeker', name: '전설 추적자', category: 'title', rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 180 }, price: 180,
    spriteKey: 'title_legend_seeker_spr', stats: { hp: 20, attack: 8, defense: 5 }
  },
  {
    id: 'title_perfectionist', name: '완벽주의자', category: 'title', rarity: 'epic',
    unlockCondition: { type: 'level', level: 5 },
    spriteKey: 'title_perfectionist_spr', stats: { hp: 32, attack: 14, defense: 9 }
  },
  {
    id: 'title_champion', name: '챔피언', category: 'title', rarity: 'epic',
    unlockCondition: { type: 'purchase', coinCost: 400 }, price: 400,
    spriteKey: 'title_champion_spr', stats: { hp: 34, attack: 15, defense: 10 }
  },
  {
    id: 'title_grandmaster', name: '그랜드마스터', category: 'title', rarity: 'legendary',
    unlockCondition: { type: 'purchase', coinCost: 900 }, price: 900,
    spriteKey: 'title_grandmaster_spr', stats: { hp: 50, attack: 20, defense: 14 }
  },

  // ── 신규 펫 (+8) ────────────────────────────────────
  {
    id: 'pet_owl', name: '지혜의 부엉이', category: 'pet', rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 70 }, price: 70,
    spriteKey: 'pet_owl_spr', stats: { hp: 12, attack: 3 }
  },
  {
    id: 'pet_penguin', name: '실험실 펭귄', category: 'pet', rarity: 'common',
    unlockCondition: { type: 'unit_complete', unitId: 4 },
    spriteKey: 'pet_penguin_spr', stats: { hp: 12, defense: 3 }
  },
  {
    id: 'pet_turtle', name: '느림보 거북', category: 'pet', rarity: 'common',
    unlockCondition: { type: 'purchase', coinCost: 75 }, price: 75,
    spriteKey: 'pet_turtle_spr', stats: { hp: 16, defense: 4 }
  },
  {
    id: 'pet_fox', name: '영리한 여우', category: 'pet', rarity: 'rare',
    unlockCondition: { type: 'purchase', coinCost: 180 }, price: 180,
    spriteKey: 'pet_fox_spr', stats: { hp: 20, attack: 9, defense: 4 }
  },
  {
    id: 'pet_octopus', name: '심해 문어', category: 'pet', rarity: 'rare',
    unlockCondition: { type: 'unit_complete', unitId: 3 },
    spriteKey: 'pet_octopus_spr', stats: { hp: 22, attack: 8, defense: 5 }
  },
  {
    id: 'pet_phoenix', name: '불사조', category: 'pet', rarity: 'epic',
    unlockCondition: { type: 'purchase', coinCost: 380 }, price: 380,
    spriteKey: 'pet_phoenix_spr', stats: { hp: 36, attack: 16, defense: 9 }
  },
  {
    id: 'pet_unicorn', name: '유니콘', category: 'pet', rarity: 'epic',
    unlockCondition: { type: 'level', level: 6 },
    spriteKey: 'pet_unicorn_spr', stats: { hp: 38, attack: 14, defense: 11 }
  },
  {
    id: 'pet_griffin', name: '전설의 그리핀', category: 'pet', rarity: 'legendary',
    unlockCondition: { type: 'purchase', coinCost: 820 }, price: 820,
    spriteKey: 'pet_griffin_spr', stats: { hp: 52, attack: 18, defense: 12 }
  }
];

// ── 코스튬 세트 효과 (C-2) ────────────────────────────
export interface CostumeSet {
  id: string;
  name: string;
  /** 세트 완성에 필요한 전체 멤버 코스튬 ID — 모두 장착 시 보너스. */
  memberIds: string[];
  /** 세트 완성 시 추가 CP. */
  cpBonus: number;
  /** 세트 완성 시 노출되는 전용 칭호 텍스트. */
  bonusTitle: string;
}

export const COSTUME_SETS: CostumeSet[] = [
  {
    id: 'set_space',
    name: '우주 탐사대',
    memberIds: ['outfit_spacesuit', 'hat_spacesuit_helmet', 'vehicle_rocket'],
    cpBonus: 120,
    bonusTitle: '우주 개척자',
  },
  {
    id: 'set_medic',
    name: '의료 연구진',
    memberIds: ['outfit_doctor', 'accessory_stethoscope'],
    cpBonus: 60,
    bonusTitle: '생명 수호자',
  },
  {
    id: 'set_volcano',
    name: '화산 탐사대',
    memberIds: ['outfit_volcano', 'hat_volcano'],
    cpBonus: 90,
    bonusTitle: '불의 정복자',
  },
  {
    id: 'set_cosmos',
    name: '은하 수호대',
    memberIds: ['outfit_galaxy', 'hat_galaxy', 'accessory_galaxy_orb'],
    cpBonus: 250,
    bonusTitle: '은하의 수호자',
  },
];

export interface ActiveSetResult {
  totalCpBonus: number;
  activeSets: CostumeSet[];
}

/**
 * 장착된 코스튬 ID 목록에서 완성된 세트의 CP 보너스 합을 계산한다(순수).
 * 'none'/빈 값은 무시한다.
 */
export function getActiveSetBonus(equippedIds: (string | undefined | null)[]): ActiveSetResult {
  const equipped = new Set(equippedIds.filter((id): id is string => !!id && id !== 'none'));
  const activeSets = COSTUME_SETS.filter(set => set.memberIds.every(id => equipped.has(id)));
  const totalCpBonus = activeSets.reduce((sum, set) => sum + set.cpBonus, 0);
  return { totalCpBonus, activeSets };
}

/**
 * 단원 80%+ 완료(checkMilestones) 시 해금되는 마일스톤 코스튬 ID.
 * 모든 값은 위 costumeCatalog에 실제로 존재하는 ID여야 한다 (정합성 테스트로 강제). — D4
 */
export const UNIT_MILESTONE_COSTUME_IDS: Record<number, string> = {
  1: 'hat_explorer',
  2: 'accessory_magnifier',
  3: 'accessory_testtube',
  4: 'outfit_doctor',
  5: 'outfit_eco',
  6: 'outfit_meteorologist',
  7: 'outfit_spacesuit',
  8: 'hat_crown',
};
