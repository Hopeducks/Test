import { describe, it, expect, beforeEach } from 'vitest';
import { gameStateManager } from '../lib/game-state';
import { COIN_POLICY } from '../lib/economy';

describe('completeUnit 마일스톤 코인', () => {
  beforeEach(() => gameStateManager.resetProgress());

  it('최초 완료: 첫클리어 보너스 + 점수 비례 신기록 보너스', () => {
    gameStateManager.completeUnit(1, 9);
    expect(gameStateManager.getCoins()).toBe(
      COIN_POLICY.firstUnitClear + 9 * COIN_POLICY.highScorePerPoint
    );
  });

  it('동일 점수로 반복 플레이해도 코인 불변 (farming 차단)', () => {
    gameStateManager.completeUnit(1, 9);
    const after1 = gameStateManager.getCoins();
    gameStateManager.completeUnit(1, 9);
    gameStateManager.completeUnit(1, 9);
    gameStateManager.completeUnit(1, 9);
    expect(gameStateManager.getCoins()).toBe(after1);
  });

  it('신기록 갱신 시 증가분만큼만 추가 지급', () => {
    gameStateManager.completeUnit(1, 8);
    const after = gameStateManager.getCoins();
    gameStateManager.completeUnit(1, 10);
    expect(gameStateManager.getCoins()).toBe(after + 2 * COIN_POLICY.highScorePerPoint);
  });

  it('더 낮은 점수로 재플레이하면 코인 변화 없음', () => {
    gameStateManager.completeUnit(1, 10);
    const after = gameStateManager.getCoins();
    gameStateManager.completeUnit(1, 3);
    expect(gameStateManager.getCoins()).toBe(after);
  });

  it('서로 다른 단원은 각각 최초 완료 보너스', () => {
    gameStateManager.completeUnit(1, 5);
    gameStateManager.completeUnit(2, 5);
    expect(gameStateManager.getCoins()).toBe(
      2 * (COIN_POLICY.firstUnitClear + 5 * COIN_POLICY.highScorePerPoint)
    );
  });
});

describe('체육관 첫 격파 코인', () => {
  beforeEach(() => gameStateManager.resetProgress());

  it('최초 격파만 보너스, 재격파는 0', () => {
    gameStateManager.unlockBadge(1);
    expect(gameStateManager.getCoins()).toBe(COIN_POLICY.gymFirstClear);
    gameStateManager.unlockBadge(1);
    expect(gameStateManager.getCoins()).toBe(COIN_POLICY.gymFirstClear);
  });
});

describe('코인 게이트웨이 spend/award', () => {
  beforeEach(() => gameStateManager.resetProgress());

  it('잔액 부족 시 차감 실패하고 잔액 불변', () => {
    expect(gameStateManager.spendCoins(50)).toBe(false);
    expect(gameStateManager.getCoins()).toBe(0);
  });

  it('지급 후 차감 정상', () => {
    gameStateManager.awardCoins(100);
    expect(gameStateManager.spendCoins(30)).toBe(true);
    expect(gameStateManager.getCoins()).toBe(70);
  });

  it('음수 지급은 무시', () => {
    gameStateManager.awardCoins(-100);
    expect(gameStateManager.getCoins()).toBe(0);
  });
});
