import { describe, it, expect, beforeEach } from 'vitest';
import { gameStateManager } from '../lib/game-state';
import { deriveProgression } from '../lib/progression';

/** 카드를 해금하고 목표 레벨까지 XP를 누적시키는 헬퍼. */
function levelUpCard(cardId: string, targetLevel: number) {
  gameStateManager.unlockCard(cardId);
  // gainCardXp는 호출당 최대 1레벨 상승(100 XP) → 레벨당 1회.
  for (let lvl = 1; lvl < targetLevel; lvl++) {
    gameStateManager.gainCardXp([cardId], 100);
  }
}

describe('getCardEvolution 단계 경계', () => {
  beforeEach(() => gameStateManager.resetProgress());

  it('레벨 1~3은 1단계', () => {
    expect(gameStateManager.getCardEvolution('u1_c1', 1).stage).toBe(1);
    expect(gameStateManager.getCardEvolution('u1_c1', 3).stage).toBe(1);
  });

  it('레벨 4에서 2단계로 진화', () => {
    expect(gameStateManager.getCardEvolution('u1_c1', 4).stage).toBe(2);
    expect(gameStateManager.getCardEvolution('u1_c1', 7).stage).toBe(2);
  });

  it('레벨 8에서 3단계로 초진화', () => {
    expect(gameStateManager.getCardEvolution('u1_c1', 8).stage).toBe(3);
    expect(gameStateManager.getCardEvolution('u1_c1', 10).stage).toBe(3);
  });
});

describe('전투 XP → 카드 레벨 → 육성 지표 일관성 (D8/D-2)', () => {
  beforeEach(() => gameStateManager.resetProgress());

  it('gainCardXp 100 누적 시 카드 레벨 1 상승', () => {
    gameStateManager.unlockCard('u1_c1');
    gameStateManager.gainCardXp(['u1_c1'], 100);
    expect(gameStateManager.getProgress().cardLevels?.['u1_c1']).toBe(2);
  });

  it('카드 레벨이 오르면 트레이너 XP/레벨이 단일 산식과 일치', () => {
    levelUpCard('u1_c1', 4); // 카드 1장 + 레벨 4(step 3)
    const progress = gameStateManager.getProgress();
    const expected = deriveProgression(progress);
    const trainer = gameStateManager.getTrainerInfo();
    expect(trainer.xp).toBe(expected.xp);
    expect(trainer.level).toBe(expected.level);
  });

  it('카드 레벨↑ → CP↑ (단조 증가)', () => {
    gameStateManager.unlockCard('u1_c1');
    const equipped = gameStateManager.getProgress();
    void equipped;
    const cosmetics = { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' };
    const cpBefore = gameStateManager.calculateCP(['u1_c1'], cosmetics);
    gameStateManager.gainCardXp(['u1_c1'], 100); // 레벨 2
    const cpAfter = gameStateManager.calculateCP(['u1_c1'], cosmetics);
    expect(cpAfter).toBeGreaterThan(cpBefore);
  });

  it('getLocalPlayer().level 과 getTrainerInfo().level 이 동일 (전 화면 일관)', () => {
    levelUpCard('u1_c1', 8);
    gameStateManager.unlockCard('u1_c2');
    expect(gameStateManager.getLocalPlayer().level).toBe(gameStateManager.getTrainerInfo().level);
    expect(gameStateManager.getLocalPlayer().xp).toBe(gameStateManager.getTrainerInfo().xp);
  });
});
