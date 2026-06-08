/**
 * 육성 지표 통합 산식 — 순수 모듈 (PRD F4 / EPIC D, 결함 D8).
 *
 * 배경: 트레이너 XP/레벨, CP, 카드 레벨이 `game-state.ts` 곳곳에서 서로 다른
 * 상수로 계산되어 화면마다 값이 달라졌다(D8). 이 모듈이 **유일한 산식 진실 원천**이다.
 *
 *  - 트레이너 XP = 해금 카드 수·카드 레벨 합·완료 단원 수의 가중합.
 *  - 트레이너 레벨/랭크 = XP 임계 테이블(`TRAINER_TIERS`) 1곳에서 파생.
 *  - CP = 해금 카드 수·상위 2장 파워·장착 스탯·카드 레벨의 가중합.
 *
 * side-effect 없음 · localStorage/window 미접근 → node 환경 단위테스트 가능.
 * `game-state.ts`의 getTrainerInfo/calculateCP/getLocalPlayer는 이 모듈의 thin adapter다.
 */

/** 트레이너 레벨 임계 테이블 — 레벨/랭크의 단일 진실 원천. threshold 오름차순. */
export interface TrainerTier {
  level: number;
  threshold: number; // 이 레벨에 진입하는 최소 누적 XP
  rank: string;
}

export const TRAINER_TIERS: readonly TrainerTier[] = [
  { level: 1, threshold: 0, rank: '초보 과학 트레이너 ⚪' },
  { level: 2, threshold: 300, rank: '견습 과학 트레이너 🌱' },
  { level: 3, threshold: 800, rank: '엘리트 과학 트레이너 ⚡' },
  { level: 4, threshold: 1500, rank: '베테랑 과학 트레이너 🔮' },
  { level: 5, threshold: 2500, rank: '체육관 관장 트레이너 👑' },
  { level: 6, threshold: 4000, rank: '과학 마스터 챔피언 🏆' },
] as const;

/** 마지막 티어보다 위가 없을 때 사용하는 nextThreshold 표시값. */
export const MAX_NEXT_THRESHOLD = 999999;

/** 트레이너 XP 가중치 — 단일 진실 원천. */
export const TRAINER_XP_WEIGHTS = {
  perUnlockedCard: 100,
  perCardLevelStep: 50, // (카드레벨 - 1) 합에 곱
  perCompletedUnit: 100,
} as const;

/** CP(전투력) 가중치 — 단일 진실 원천. */
export const CP_WEIGHTS = {
  perUnlockedCard: 50,
  equippedStatMultiplier: 10,
  perCardLevelStep: 20, // (카드레벨 - 1) 합에 곱
} as const;

/** 육성 산식에 필요한 progress 최소 형태(테스트 용이성을 위한 좁은 입력). */
export interface ProgressionInput {
  unlockedCardIds: string[];
  completedUnits: number[];
  cardLevels?: Record<string, number>;
}

export interface ProgressionInfo {
  level: number;
  xp: number;
  rank: string;
  prevThreshold: number;
  nextThreshold: number;
}

/** 카드 레벨 합에서 (레벨 - 1)의 총합. 레벨 1(미육성)은 0 기여. 음수 방지. */
export function sumCardLevelSteps(cardLevels?: Record<string, number>): number {
  if (!cardLevels) return 0;
  let sum = 0;
  for (const lvl of Object.values(cardLevels)) {
    sum += Math.max(0, (lvl || 0) - 1);
  }
  return sum;
}

/** 트레이너 누적 XP — 가중합 산식의 유일한 구현. */
export function deriveTrainerXp(progress: ProgressionInput): number {
  const cardCount = progress.unlockedCardIds?.length ?? 0;
  const stepSum = sumCardLevelSteps(progress.cardLevels);
  const completedCount = progress.completedUnits?.length ?? 0;
  return (
    cardCount * TRAINER_XP_WEIGHTS.perUnlockedCard +
    stepSum * TRAINER_XP_WEIGHTS.perCardLevelStep +
    completedCount * TRAINER_XP_WEIGHTS.perCompletedUnit
  );
}

/** XP → 트레이너 레벨/랭크/임계값 파생. 모든 화면이 이 결과를 공유한다. */
export function deriveProgression(progress: ProgressionInput): ProgressionInfo {
  const xp = deriveTrainerXp(progress);

  let tierIdx = 0;
  for (let i = 0; i < TRAINER_TIERS.length; i++) {
    if (xp >= TRAINER_TIERS[i].threshold) tierIdx = i;
  }

  const tier = TRAINER_TIERS[tierIdx];
  const next = TRAINER_TIERS[tierIdx + 1];

  return {
    level: tier.level,
    xp,
    rank: tier.rank,
    prevThreshold: tier.threshold,
    nextThreshold: next ? next.threshold : MAX_NEXT_THRESHOLD,
  };
}

/** 파워 배열에서 상위 2장의 합. CP 산식 보조. */
export function topTwoPowerSum(powers: number[]): number {
  const sorted = [...powers].sort((a, b) => b - a);
  return (sorted[0] || 0) + (sorted[1] || 0);
}

/**
 * CP(전투력) 산식의 유일한 구현 — 이미 해석된 원시 입력만 받는다(순수).
 * 데이터 해석(어떤 카드/코스튬)은 호출부(game-state)가 담당하고, 가중치는 여기 1곳.
 */
export function deriveCp(input: {
  unlockedCardCount: number;
  topTwoPowerSum: number;
  equippedStatsSum: number;
  cardLevelSteps: number;
  /** 완성된 코스튬 세트의 CP 보너스 합(C-2). 미지정 시 0. */
  setBonus?: number;
}): number {
  return (
    input.unlockedCardCount * CP_WEIGHTS.perUnlockedCard +
    input.topTwoPowerSum +
    input.equippedStatsSum * CP_WEIGHTS.equippedStatMultiplier +
    input.cardLevelSteps * CP_WEIGHTS.perCardLevelStep +
    (input.setBonus ?? 0)
  );
}
