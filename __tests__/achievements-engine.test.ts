import { describe, it, expect, beforeEach } from 'vitest';
import { gameStateManager } from '../lib/game-state';

describe('업적 엔진 (triggerAchievementEvent)', () => {
  beforeEach(() => gameStateManager.resetProgress());

  it('연속 정답 3회 → streak_3 업적 획득 + 영속', () => {
    const earned = gameStateManager.triggerAchievementEvent({ type: 'streak', val: 3 });
    expect(earned.map(a => a.id)).toContain('streak_3');
    expect(gameStateManager.getEarnedAchievementIds()).toContain('streak_3');
  });

  it('이미 획득한 업적은 재획득되지 않음 (idempotent)', () => {
    gameStateManager.triggerAchievementEvent({ type: 'streak', val: 3 });
    const again = gameStateManager.triggerAchievementEvent({ type: 'streak', val: 3 });
    expect(again.map(a => a.id)).not.toContain('streak_3');
  });

  it('낮은 streak 값으로는 미획득', () => {
    const earned = gameStateManager.triggerAchievementEvent({ type: 'streak', val: 2 });
    expect(earned.map(a => a.id)).not.toContain('streak_3');
  });

  it('title 보상 업적(streak_10)은 earnedTitles에 칭호 텍스트 저장 (D3)', () => {
    gameStateManager.triggerAchievementEvent({ type: 'streak', val: 10 });
    expect(gameStateManager.getEarnedAchievementIds()).toContain('streak_10');
    expect(gameStateManager.getProgress().earnedTitles).toContain('전설의 과학왕');
  });

  it('coins 보상 업적(streak_5)은 게이트웨이로 코인 지급', () => {
    const before = gameStateManager.getCoins();
    gameStateManager.triggerAchievementEvent({ type: 'streak', val: 5 });
    // streak_5 보상 coins 150
    expect(gameStateManager.getCoins()).toBe(before + 150);
  });

  it('completeUnit이 단원 완료 업적을 자동 발생시킴', () => {
    gameStateManager.completeUnit(1, 9);
    expect(gameStateManager.getEarnedAchievementIds()).toContain('unit_1_clear');
  });

  it('boss_damage 누적 500 이상 → boss_damage_500 업적', () => {
    gameStateManager.triggerAchievementEvent({ type: 'boss_damage', val: 499 });
    expect(gameStateManager.getEarnedAchievementIds()).not.toContain('boss_damage_500');
    gameStateManager.triggerAchievementEvent({ type: 'boss_damage', val: 500 });
    expect(gameStateManager.getEarnedAchievementIds()).toContain('boss_damage_500');
  });
});
