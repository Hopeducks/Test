/**
 * 코인(재화) 경제 정책 — 순수 모듈.
 *
 * 설계 원칙 (PRD F4 / EPIC A):
 *  - `progress.coins`가 코인의 유일한 진실 원천. 곳곳의 `coins ?? cards*10` fallback을 제거한다.
 *  - 코인 변경은 반드시 이 모듈의 함수를 거쳐 클램프(음수/NaN/소수 방지)된다.
 *  - 코인은 "참여"가 아니라 "숙달·진척(마일스톤)"에서만 발생한다 → 학습 흥미 저하 방지.
 *
 * 이 모듈은 side-effect가 없고 localStorage/window에 접근하지 않으므로 node 환경에서 테스트 가능하다.
 * 실제 상태 변경은 `lib/game-state.ts`의 게이트웨이 메서드(awardCoins/spendCoins)가 담당한다.
 */

/** 코인이 발생할 수 있는 출처 (감사/추적용 단일 enum). */
export type CoinSource =
  | 'first_unit_clear'   // 단원 최초 완료 보너스
  | 'new_high_score'     // 단원 신기록 갱신 보너스
  | 'gym_first_clear'    // 체육관 관장 최초 격파
  | 'quest_reward'       // 퀘스트 티어 수령
  | 'daily_quest'        // 일일 도전과제 수령
  | 'achievement_reward' // 업적 최초 달성
  | 'migration';         // 레거시 데이터 1회 보정

/** 마일스톤 코인 지급 정책 (단일 진실 원천). */
export const COIN_POLICY = {
  /** 단원 최초 완료 시 지급. */
  firstUnitClear: 50,
  /** 신기록 갱신 시 향상된 점수 1점(10점 척도)당 지급. */
  highScorePerPoint: 8,
  /** 체육관 관장 최초 격파 시 지급. */
  gymFirstClear: 60,
} as const;

/**
 * 코인 값을 안전한 정수로 클램프한다.
 * 음수·NaN·undefined → 0, 소수 → 내림.
 */
export function clampCoins(value: number | undefined | null): number {
  if (value === undefined || value === null || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  return Math.floor(value);
}

/** 코인 지급을 적용한다(음수 지급은 무시). 결과는 항상 클램프된 정수. */
export function applyAward(currentCoins: number, amount: number): number {
  const safeAmount = !amount || amount < 0 || Number.isNaN(amount) ? 0 : amount;
  return clampCoins(clampCoins(currentCoins) + Math.floor(safeAmount));
}

/** 구매 가능 여부. */
export function canAfford(currentCoins: number, cost: number): boolean {
  return clampCoins(currentCoins) >= clampCoins(cost);
}

/**
 * 코인 차감을 적용한다.
 * 잔액이 충분하면 차감 후 잔액을, 부족하면 -1(차감 불가 신호)을 반환한다.
 */
export function applySpend(currentCoins: number, cost: number): number {
  const coins = clampCoins(currentCoins);
  const safeCost = clampCoins(cost);
  if (coins < safeCost) return -1;
  return coins - safeCost;
}

/**
 * 저장된 progress에서 코인 초기값을 1회 정규화한다.
 * - coins가 정의되어 있으면 클램프만.
 * - 없으면 레거시 산식(해금 카드 수 * 10)으로 1회 보정.
 */
export function normalizeLoadedCoins(parsed: {
  coins?: number;
  unlockedCardIds?: string[];
}): number {
  if (parsed.coins !== undefined) {
    return clampCoins(parsed.coins);
  }
  const cardCount = parsed.unlockedCardIds?.length ?? 0;
  return clampCoins(cardCount * 10);
}

/** 단원 최초 완료 보너스. */
export function firstClearBonus(): number {
  return COIN_POLICY.firstUnitClear;
}

/**
 * 신기록 갱신 보너스 — 향상된 점수 증가분에 비례.
 * 경신하지 못하면 0(반복 farming 차단).
 * @param prevHighScore 이전 최고 점수(10점 척도)
 * @param newScore 이번 점수(10점 척도)
 */
export function highScoreBonus(prevHighScore: number, newScore: number): number {
  const improvement = newScore - prevHighScore;
  if (improvement <= 0) return 0;
  return improvement * COIN_POLICY.highScorePerPoint;
}

/** 체육관 관장 최초 격파 보너스. */
export function gymFirstClearBonus(): number {
  return COIN_POLICY.gymFirstClear;
}
