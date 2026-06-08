import { describe, it, expect } from 'vitest';
import { simulatedBotCp, SIMULATED_BOT_CP } from '../lib/progression';
import { deriveRarityAura } from '../game/scenes/lobby/rarity';
import { SIMULATED_CLASSMATES } from '../data/questions';
import { costumeCatalog } from '../data/costume-catalog';

describe('simulatedBotCp — 결정론적 봇 CP (D10)', () => {
  it('같은 입력은 항상 같은 CP를 반환한다(결정론)', () => {
    const a = simulatedBotCp(0.85, 0.6);
    const b = simulatedBotCp(0.85, 0.6);
    expect(a).toBe(b);
  });

  it('정답률이 높을수록 CP가 크다', () => {
    const low = simulatedBotCp(0.65, 1.0);
    const high = simulatedBotCp(0.94, 1.0);
    expect(high).toBeGreaterThan(low);
  });

  it('속도가 빠를수록(speedFactor 작을수록) CP가 크다', () => {
    const fast = simulatedBotCp(0.8, 0.6);
    const slow = simulatedBotCp(0.8, 1.4);
    expect(fast).toBeGreaterThan(slow);
  });

  it('항상 정수이며 음수/NaN이 없다', () => {
    const values = [
      simulatedBotCp(0, 0),
      simulatedBotCp(1, 0),
      simulatedBotCp(NaN, NaN),
      simulatedBotCp(-5, 99),
    ];
    values.forEach((v) => {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    });
  });

  it('실제 시뮬레이션 봇 전원이 합리적 CP 범위(base~상한)에 든다', () => {
    const max = SIMULATED_BOT_CP.base + SIMULATED_BOT_CP.accuracyWeight + SIMULATED_BOT_CP.speedWeight;
    SIMULATED_CLASSMATES.forEach((bot) => {
      const cp = simulatedBotCp(bot.accuracyFactor, bot.speedFactor);
      expect(cp).toBeGreaterThanOrEqual(SIMULATED_BOT_CP.base);
      expect(cp).toBeLessThanOrEqual(max);
    });
  });
});

describe('deriveRarityAura — 장착 코스튬 최고 등급 파생 (E-2)', () => {
  it('빈 입력은 common·오라 비표시', () => {
    const aura = deriveRarityAura([null, undefined, 'none']);
    expect(aura.rarity).toBe('common');
    expect(aura.show).toBe(false);
  });

  it('legendary 코스튬 장착 시 최고 등급으로 오라 표시', () => {
    const legendary = costumeCatalog.find((c) => c.rarity === 'legendary');
    expect(legendary).toBeDefined();
    const aura = deriveRarityAura([legendary!.id]);
    expect(aura.rarity).toBe('legendary');
    expect(aura.show).toBe(true);
  });

  it('여러 등급 혼합 시 가장 높은 등급을 채택한다', () => {
    const common = costumeCatalog.find((c) => c.rarity === 'common');
    const epic = costumeCatalog.find((c) => c.rarity === 'epic');
    if (!epic) return; // epic이 없으면 스킵(데이터 의존)
    const aura = deriveRarityAura([common!.id, epic.id]);
    expect(aura.rarity).toBe('epic');
    expect(aura.show).toBe(true);
  });

  it('카탈로그에 없는 id(카드 펫 등)는 무시한다', () => {
    const aura = deriveRarityAura(['u1_c1', 'nonexistent_id']);
    expect(aura.rarity).toBe('common');
    expect(aura.show).toBe(false);
  });
});
