/**
 * 도전과제(퀘스트) 정의 — 데이터 모듈 (PRD F4 / EPIC B-4).
 *
 * 설계 원칙:
 *  - 모든 메트릭은 **실제 GameProgress에서 계산 가능**해야 한다(추적 불가 지표로 만든
 *    "죽은 퀘스트"를 만들지 않는다 — D2 교훈).
 *  - 카테고리별 5~6 티어로 빠른 학생용 long-tail 확보(총 80+).
 *  - 보상 코인은 EPIC A 경제 정책 내(퀘스트 수령 = 마일스톤형 1회성).
 *  - 컴포넌트는 이 모듈의 `buildActiveQuests`만 호출(하드코딩 분리).
 */

import { GameProgress, DailyStats } from '../types';
import { cards } from './cards';

export interface QuestTier {
  max: number;
  reward: number;
  desc: string;
}

/** 진행도 계산에 필요한 파생 컨텍스트(트레이너 지표는 progression에서 주입). */
export interface QuestMetricContext {
  progress: GameProgress;
  trainerLevel: number;
  trainerXp: number;
}

export interface QuestCategoryDef {
  category: string;
  namePrefix: string;
  icon: string;
  /** 진행도 현재값 — 항상 progress 등에서 결정론적으로 파생. */
  metric: (ctx: QuestMetricContext) => number;
  tiers: QuestTier[];
}

/** 패널 렌더용 — 카테고리별 현재 활성 티어(또는 전부 클리어). */
export interface ActiveQuest {
  id: string;
  name: string;
  desc: string;
  icon: string;
  prog: number;
  max: number;
  reward: number;
  isAllCleared: boolean;
}

export const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// ── 메트릭 헬퍼 (순수) ─────────────────────────────────

function unlockedSet(progress: GameProgress): Set<string> {
  return new Set(progress.unlockedCardIds);
}

function countByRarity(progress: GameProgress, rarity: string): number {
  const set = unlockedSet(progress);
  return cards.filter(c => c.rarity === rarity && set.has(c.id)).length;
}

/** 해금 카드들의 레벨 배열(미육성=1). */
function unlockedCardLevels(progress: GameProgress): number[] {
  const levels = progress.cardLevels || {};
  return progress.unlockedCardIds.map(id => levels[id] || 1);
}

function countCardsAtLeastLevel(progress: GameProgress, level: number): number {
  return unlockedCardLevels(progress).filter(l => l >= level).length;
}

function maxCardLevel(progress: GameProgress): number {
  const vals = unlockedCardLevels(progress);
  return vals.length ? Math.max(...vals) : 1;
}

/** 해금 카드 레벨의 단순 합(기존 '포켓몬 성장' 산식 계승). */
function cardLevelSum(progress: GameProgress): number {
  return progress.unlockedCardIds.reduce((sum, id) => sum + (progress.cardLevels?.[id] || 1), 0);
}

/** 만점(10점) 단원 수. */
function perfectUnitsCount(progress: GameProgress): number {
  return Object.values(progress.unitHighScores || {}).filter(s => s >= 10).length;
}

/** 도감을 100% 채운(모든 카드 해금) 단원 수. */
function fullyCollectedUnitsCount(progress: GameProgress): number {
  const set = unlockedSet(progress);
  const byUnit = new Map<number, { total: number; have: number }>();
  for (const c of cards) {
    const entry = byUnit.get(c.unitId) || { total: 0, have: 0 };
    entry.total += 1;
    if (set.has(c.id)) entry.have += 1;
    byUnit.set(c.unitId, entry);
  }
  let count = 0;
  byUnit.forEach(e => {
    if (e.total > 0 && e.have === e.total) count += 1;
  });
  return count;
}

// ── 카테고리 정의 (16종 × 5~6티어 = 84) ───────────────────

export const QUEST_CATEGORIES: QuestCategoryDef[] = [
  {
    category: 'solver',
    namePrefix: '퀴즈 해결사',
    icon: '📝',
    metric: ({ progress }) => progress.completedUnits.length,
    tiers: [
      { max: 1, reward: 15, desc: '단원 복습 퀴즈 1회 완료하기' },
      { max: 3, reward: 30, desc: '단원 복습 퀴즈 3회 완료하기' },
      { max: 7, reward: 60, desc: '단원 복습 퀴즈 7회 완료하기' },
      { max: 15, reward: 120, desc: '단원 복습 퀴즈 15회 완료하기' },
      { max: 30, reward: 250, desc: '단원 복습 퀴즈 30회 완료하기' },
      { max: 50, reward: 450, desc: '단원 복습 퀴즈 50회 완료하기' },
    ],
  },
  {
    category: 'collector',
    namePrefix: '지식의 수집가',
    icon: '📚',
    metric: ({ progress }) => progress.unlockedCardIds.length,
    tiers: [
      { max: 5, reward: 25, desc: '과학 도감 카드 5장 해금하기' },
      { max: 15, reward: 50, desc: '과학 도감 카드 15장 해금하기' },
      { max: 30, reward: 100, desc: '과학 도감 카드 30장 해금하기' },
      { max: 50, reward: 200, desc: '과학 도감 카드 50장 해금하기' },
      { max: 80, reward: 500, desc: '과학 도감 카드 80장 모두 해금하기' },
    ],
  },
  {
    category: 'wealth',
    namePrefix: '백만장자',
    icon: '🪙',
    metric: ({ progress }) => progress.coins ?? 0,
    tiers: [
      { max: 50, reward: 10, desc: '보유 코인 50개 이상 달성하기' },
      { max: 150, reward: 20, desc: '보유 코인 150개 이상 달성하기' },
      { max: 300, reward: 40, desc: '보유 코인 300개 이상 달성하기' },
      { max: 600, reward: 80, desc: '보유 코인 600개 이상 달성하기' },
      { max: 1200, reward: 150, desc: '보유 코인 1200개 이상 달성하기' },
      { max: 2000, reward: 250, desc: '보유 코인 2000개 이상 달성하기' },
    ],
  },
  {
    category: 'trainer',
    namePrefix: '만렙 트레이너',
    icon: '🎖️',
    metric: ({ trainerLevel }) => trainerLevel,
    tiers: [
      { max: 2, reward: 25, desc: '트레이너 레벨 2 달성하기' },
      { max: 3, reward: 50, desc: '트레이너 레벨 3 달성하기' },
      { max: 4, reward: 100, desc: '트레이너 레벨 4 달성하기' },
      { max: 5, reward: 200, desc: '트레이너 레벨 5 달성하기' },
      { max: 6, reward: 400, desc: '트레이너 레벨 6(챔피언) 달성하기' },
    ],
  },
  {
    category: 'xp_hunter',
    namePrefix: '경험치 사냥꾼',
    icon: '⚡',
    metric: ({ trainerXp }) => trainerXp,
    tiers: [
      { max: 500, reward: 20, desc: '트레이너 경험치 500 달성하기' },
      { max: 1500, reward: 45, desc: '트레이너 경험치 1500 달성하기' },
      { max: 3000, reward: 90, desc: '트레이너 경험치 3000 달성하기' },
      { max: 6000, reward: 180, desc: '트레이너 경험치 6000 달성하기' },
      { max: 10000, reward: 350, desc: '트레이너 경험치 10000 달성하기' },
      { max: 15000, reward: 600, desc: '트레이너 경험치 15000 달성하기' },
    ],
  },
  {
    category: 'growth',
    namePrefix: '포켓몬 성장',
    icon: '🌱',
    metric: ({ progress }) => cardLevelSum(progress),
    tiers: [
      { max: 20, reward: 25, desc: '해금 카드 레벨 합계 20 달성하기' },
      { max: 60, reward: 50, desc: '해금 카드 레벨 합계 60 달성하기' },
      { max: 150, reward: 100, desc: '해금 카드 레벨 합계 150 달성하기' },
      { max: 350, reward: 200, desc: '해금 카드 레벨 합계 350 달성하기' },
      { max: 650, reward: 400, desc: '해금 카드 레벨 합계 650 달성하기' },
      { max: 800, reward: 600, desc: '해금 카드 레벨 합계 800(만렙 군단) 달성하기' },
    ],
  },
  {
    category: 'badge',
    namePrefix: '체육관 뱃지 수집',
    icon: '🏅',
    metric: ({ progress }) => progress.unlockedBadges?.length || 0,
    tiers: [
      { max: 1, reward: 100, desc: '체육관 뱃지 1개 이상 수집하기' },
      { max: 3, reward: 200, desc: '체육관 뱃지 3개 이상 수집하기' },
      { max: 5, reward: 350, desc: '체육관 뱃지 5개 이상 수집하기' },
      { max: 7, reward: 500, desc: '체육관 뱃지 7개 이상 수집하기' },
      { max: 8, reward: 1000, desc: '체육관 뱃지 8개 모두 수집하기' },
    ],
  },
  {
    category: 'perfectionist',
    namePrefix: '완벽주의자',
    icon: '💯',
    metric: ({ progress }) => perfectUnitsCount(progress),
    tiers: [
      { max: 1, reward: 80, desc: '단원 만점(10점) 1회 달성하기' },
      { max: 2, reward: 160, desc: '서로 다른 단원 만점 2개 달성하기' },
      { max: 4, reward: 300, desc: '서로 다른 단원 만점 4개 달성하기' },
      { max: 6, reward: 500, desc: '서로 다른 단원 만점 6개 달성하기' },
      { max: 8, reward: 1000, desc: '전 단원(8개) 만점 달성하기' },
    ],
  },
  {
    category: 'completionist',
    namePrefix: '도감 완성가',
    icon: '🗂️',
    metric: ({ progress }) => fullyCollectedUnitsCount(progress),
    tiers: [
      { max: 1, reward: 80, desc: '한 단원 도감 100% 완성하기' },
      { max: 2, reward: 160, desc: '두 단원 도감 100% 완성하기' },
      { max: 4, reward: 320, desc: '네 단원 도감 100% 완성하기' },
      { max: 6, reward: 560, desc: '여섯 단원 도감 100% 완성하기' },
      { max: 8, reward: 1200, desc: '전 단원 도감 100% 완성하기' },
    ],
  },
  {
    category: 'achiever',
    namePrefix: '업적 헌터',
    icon: '🏆',
    metric: ({ progress }) => progress.earnedAchievementIds?.length || 0,
    tiers: [
      { max: 1, reward: 50, desc: '업적 1개 달성하기' },
      { max: 3, reward: 100, desc: '업적 3개 달성하기' },
      { max: 6, reward: 200, desc: '업적 6개 달성하기' },
      { max: 10, reward: 400, desc: '업적 10개 달성하기' },
      { max: 20, reward: 900, desc: '업적 20개 모두 달성하기' },
    ],
  },
  {
    category: 'evolver',
    namePrefix: '진화 마스터',
    icon: '✨',
    metric: ({ progress }) => countCardsAtLeastLevel(progress, 4),
    tiers: [
      { max: 1, reward: 60, desc: '카드 1장을 2단계(레벨 4) 진화시키기' },
      { max: 3, reward: 120, desc: '카드 3장을 2단계 이상 진화시키기' },
      { max: 8, reward: 240, desc: '카드 8장을 2단계 이상 진화시키기' },
      { max: 15, reward: 450, desc: '카드 15장을 2단계 이상 진화시키기' },
      { max: 25, reward: 800, desc: '카드 25장을 2단계 이상 진화시키기' },
    ],
  },
  {
    category: 'super_evolver',
    namePrefix: '초진화 정복자',
    icon: '👑',
    metric: ({ progress }) => countCardsAtLeastLevel(progress, 8),
    tiers: [
      { max: 1, reward: 100, desc: '카드 1장을 3단계(레벨 8) 초진화시키기' },
      { max: 2, reward: 200, desc: '카드 2장을 3단계 초진화시키기' },
      { max: 5, reward: 400, desc: '카드 5장을 3단계 초진화시키기' },
      { max: 10, reward: 700, desc: '카드 10장을 3단계 초진화시키기' },
      { max: 20, reward: 1300, desc: '카드 20장을 3단계 초진화시키기' },
    ],
  },
  {
    category: 'maxcard',
    namePrefix: '최강 카드 육성',
    icon: '🔱',
    metric: ({ progress }) => countCardsAtLeastLevel(progress, 10),
    tiers: [
      { max: 1, reward: 120, desc: '카드 1장을 만렙(레벨 10) 달성하기' },
      { max: 2, reward: 240, desc: '카드 2장을 만렙 달성하기' },
      { max: 3, reward: 400, desc: '카드 3장을 만렙 달성하기' },
      { max: 5, reward: 700, desc: '카드 5장을 만렙 달성하기' },
      { max: 8, reward: 1400, desc: '카드 8장을 만렙 달성하기' },
    ],
  },
  {
    category: 'ace',
    namePrefix: '에이스 카드',
    icon: '⭐',
    metric: ({ progress }) => maxCardLevel(progress),
    tiers: [
      { max: 4, reward: 60, desc: '한 카드를 레벨 4까지 키우기' },
      { max: 6, reward: 120, desc: '한 카드를 레벨 6까지 키우기' },
      { max: 8, reward: 240, desc: '한 카드를 레벨 8까지 키우기' },
      { max: 9, reward: 400, desc: '한 카드를 레벨 9까지 키우기' },
      { max: 10, reward: 700, desc: '한 카드를 만렙(레벨 10)까지 키우기' },
    ],
  },
  {
    category: 'legendary_hunter',
    namePrefix: '전설 수집가',
    icon: '🌟',
    metric: ({ progress }) => countByRarity(progress, 'legendary'),
    tiers: [
      { max: 1, reward: 100, desc: '레전더리 카드 1장 해금하기' },
      { max: 2, reward: 200, desc: '레전더리 카드 2장 해금하기' },
      { max: 4, reward: 400, desc: '레전더리 카드 4장 해금하기' },
      { max: 6, reward: 650, desc: '레전더리 카드 6장 해금하기' },
      { max: 8, reward: 1200, desc: '레전더리 카드 8장 모두 해금하기' },
    ],
  },
  {
    category: 'epic_hunter',
    namePrefix: '에픽 수집가',
    icon: '💜',
    metric: ({ progress }) => countByRarity(progress, 'epic'),
    tiers: [
      { max: 1, reward: 80, desc: '에픽 카드 1장 해금하기' },
      { max: 2, reward: 160, desc: '에픽 카드 2장 해금하기' },
      { max: 4, reward: 320, desc: '에픽 카드 4장 해금하기' },
      { max: 6, reward: 520, desc: '에픽 카드 6장 해금하기' },
      { max: 8, reward: 1000, desc: '에픽 카드 8장 모두 해금하기' },
    ],
  },
];

/** 전체 정의된 도전과제 수(티어 합). */
export const TOTAL_QUEST_COUNT = QUEST_CATEGORIES.reduce((sum, c) => sum + c.tiers.length, 0);

// ── 일일 도전과제 ──────────────────────────────────────

export interface DailyQuest {
  id: string;
  name: string;
  desc: string;
  icon: string;
  goalKey: keyof Omit<DailyStats, 'date'>;
  goal: number;
  reward: number;
}

/** 날짜 시드 기반 단순 해시 (YYYY-MM-DD → 정수). 순수 함수. */
export function dateSeed(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (Math.imul(31, h) + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export const DAILY_QUEST_POOL: DailyQuest[] = [
  { id: 'dq_quiz1', name: '오늘의 탐구자',    desc: '퀴즈 단원 1개 완료하기',    icon: '📝', goalKey: 'quizCompleted', goal: 1,  reward: 20 },
  { id: 'dq_quiz2', name: '집중 학습',         desc: '퀴즈 단원 2개 완료하기',    icon: '📖', goalKey: 'quizCompleted', goal: 2,  reward: 40 },
  { id: 'dq_quiz3', name: '오늘의 과학자',     desc: '퀴즈 단원 3개 완료하기',    icon: '🔬', goalKey: 'quizCompleted', goal: 3,  reward: 70 },
  { id: 'dq_battle1', name: '전투 입문',        desc: '배틀 또는 레이드 1회 참가', icon: '⚔️', goalKey: 'battlesPlayed', goal: 1,  reward: 20 },
  { id: 'dq_battle3', name: '전투의 달인',      desc: '배틀 또는 레이드 3회 참가', icon: '🏆', goalKey: 'battlesPlayed', goal: 3,  reward: 50 },
  { id: 'dq_card1', name: '카드 수집가',        desc: '오늘 카드 1장 해금하기',    icon: '🃏', goalKey: 'cardsUnlocked', goal: 1,  reward: 25 },
  { id: 'dq_card3', name: '열혈 수집가',        desc: '오늘 카드 3장 해금하기',    icon: '🎴', goalKey: 'cardsUnlocked', goal: 3,  reward: 55 },
  { id: 'dq_lobby', name: '메타버스 탐험',      desc: '오늘 로비에 입장하기',      icon: '🌐', goalKey: 'lobbyVisited', goal: 1,  reward: 15 },
  { id: 'dq_active', name: '활발한 하루',       desc: '퀴즈 1개 + 배틀 1회 참가',  icon: '⭐', goalKey: 'quizCompleted', goal: 1,  reward: 30 },
  { id: 'dq_hard',  name: '오늘의 챔피언',      desc: '퀴즈 2개 + 배틀 2회 참가',  icon: '👑', goalKey: 'battlesPlayed', goal: 2,  reward: 60 },
  { id: 'dq_card5', name: '도감 마스터',        desc: '오늘 카드 5장 해금하기',    icon: '📔', goalKey: 'cardsUnlocked', goal: 5,  reward: 80 },
  { id: 'dq_quiz4', name: '슈퍼 학습자',        desc: '퀴즈 단원 4개 완료하기',    icon: '🚀', goalKey: 'quizCompleted', goal: 4,  reward: 90 },
];

/**
 * 날짜 문자열(YYYY-MM-DD)을 받아 오늘의 일일 도전과제 3개를 반환한다.
 * 같은 날짜는 항상 같은 3개를 반환 (결정론적).
 */
export function getDailyQuests(dateStr: string): DailyQuest[] {
  const seed = dateSeed(dateStr);
  const n = DAILY_QUEST_POOL.length;
  const i0 = seed % n;
  const i1 = (seed * 7 + 3) % n;
  const i2 = (seed * 13 + 5) % n;
  const indices = [...new Set([i0, i1, i2])];
  while (indices.length < 3) {
    indices.push((indices[indices.length - 1] + 1) % n);
  }
  return indices.slice(0, 3).map(i => DAILY_QUEST_POOL[i]);
}

export interface DailyQuestStatus {
  quest: DailyQuest;
  prog: number;
  isClaimed: boolean;
  isReady: boolean;
  /** 복합 조건(active/hard) 퀘스트 보조 진행도 */
  extraProg?: number;
  extraGoal?: number;
}

/** 오늘의 일일 퀘스트 상태 배열 (UI 렌더용). */
export function buildDailyQuestStatus(
  dateStr: string,
  dailyStats: DailyStats | undefined,
  claimedDailyQuestIds: string[]
): DailyQuestStatus[] {
  const quests = getDailyQuests(dateStr);
  const stats: DailyStats = dailyStats && dailyStats.date === dateStr
    ? dailyStats
    : { date: dateStr, quizCompleted: 0, battlesPlayed: 0, cardsUnlocked: 0, lobbyVisited: false };
  const claimed = new Set(claimedDailyQuestIds);

  return quests.map(q => {
    const rawProg = q.goalKey === 'lobbyVisited'
      ? (stats.lobbyVisited ? 1 : 0)
      : (stats[q.goalKey] as number);

    let prog = rawProg;
    let extraProg: number | undefined;
    let extraGoal: number | undefined;

    // dq_active: 퀴즈 1 AND 배틀 1
    if (q.id === 'dq_active') {
      prog = Math.min(stats.quizCompleted, 1);
      extraProg = Math.min(stats.battlesPlayed, 1);
      extraGoal = 1;
    }
    // dq_hard: 퀴즈 2 AND 배틀 2
    if (q.id === 'dq_hard') {
      prog = Math.min(stats.quizCompleted, 2);
      extraProg = Math.min(stats.battlesPlayed, 2);
      extraGoal = 2;
    }

    const isReady = q.id === 'dq_active'
      ? stats.quizCompleted >= 1 && stats.battlesPlayed >= 1 && !claimed.has(q.id)
      : q.id === 'dq_hard'
      ? stats.quizCompleted >= 2 && stats.battlesPlayed >= 2 && !claimed.has(q.id)
      : prog >= q.goal && !claimed.has(q.id);

    return { quest: q, prog, isClaimed: claimed.has(q.id), isReady, extraProg, extraGoal };
  });
}

/**
 * 카테고리별 현재 활성 티어를 계산한다.
 * 아직 수령하지 않은 가장 낮은 티어가 활성. 전부 수령하면 isAllCleared.
 */
export function buildActiveQuests(
  ctx: QuestMetricContext,
  claimedQuestIds: string[] = []
): ActiveQuest[] {
  const claimed = new Set(claimedQuestIds);

  return QUEST_CATEGORIES.map(cat => {
    const currentVal = cat.metric(ctx);

    let activeTierIdx = -1;
    for (let i = 0; i < cat.tiers.length; i++) {
      if (!claimed.has(`quest_${cat.category}_t${i + 1}`)) {
        activeTierIdx = i;
        break;
      }
    }

    if (activeTierIdx === -1) {
      const lastTier = cat.tiers[cat.tiers.length - 1];
      return {
        id: `quest_${cat.category}_cleared`,
        name: cat.namePrefix,
        desc: '모든 티어 클리어 완료!',
        icon: cat.icon,
        prog: lastTier.max,
        max: lastTier.max,
        reward: 0,
        isAllCleared: true,
      };
    }

    const activeTier = cat.tiers[activeTierIdx];
    return {
      id: `quest_${cat.category}_t${activeTierIdx + 1}`,
      name: `${cat.namePrefix} ${ROMAN_NUMERALS[activeTierIdx]}`,
      desc: activeTier.desc,
      icon: cat.icon,
      prog: currentVal,
      max: activeTier.max,
      reward: activeTier.reward,
      isAllCleared: false,
    };
  });
}
