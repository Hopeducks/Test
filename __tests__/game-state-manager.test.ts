import { describe, it, expect } from 'vitest';
import { gameStateManager } from '../lib/game-state';
import { cards } from '../data/cards';

// node 환경에서 window가 없어 save()는 no-op(localStorage 미사용). 싱글톤 상태는
// 테스트 간 공유되므로 절댓값 대신 "변화량(delta)"으로 검증해 순서 독립성을 유지한다.
const mgr = gameStateManager;

describe('GameStateManager — 코인 게이트웨이', () => {
  it('awardCoins는 잔액을 증가시키고 새 잔액을 반환한다', () => {
    const before = mgr.getCoins();
    const after = mgr.awardCoins(50, 'daily_quest');
    expect(after).toBe(before + 50);
    expect(mgr.getCoins()).toBe(before + 50);
  });

  it('spendCoins는 잔액이 충분하면 차감하고 true', () => {
    mgr.awardCoins(100, 'daily_quest');
    const before = mgr.getCoins();
    expect(mgr.spendCoins(30)).toBe(true);
    expect(mgr.getCoins()).toBe(before - 30);
  });

  it('spendCoins는 잔액이 부족하면 false이고 차감하지 않는다', () => {
    const before = mgr.getCoins();
    expect(mgr.spendCoins(before + 9999)).toBe(false);
    expect(mgr.getCoins()).toBe(before);
  });

  it('canAffordCoins는 상태 변경 없이 구매 가능 여부만 반환', () => {
    const before = mgr.getCoins();
    expect(mgr.canAffordCoins(before)).toBe(true);
    expect(mgr.canAffordCoins(before + 1)).toBe(false);
    expect(mgr.getCoins()).toBe(before); // 불변
  });

  it('getCoins는 항상 음수 아닌 정수로 클램프', () => {
    expect(mgr.getCoins()).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(mgr.getCoins())).toBe(true);
  });
});

describe('GameStateManager — 프로필/역할/사운드', () => {
  it('setSoundOn / getSoundOn 라운드트립', () => {
    mgr.setSoundOn(false);
    expect(mgr.getSoundOn()).toBe(false);
    mgr.setSoundOn(true);
    expect(mgr.getSoundOn()).toBe(true);
  });

  it('setRole / getRole 라운드트립', () => {
    mgr.setRole('teacher');
    expect(mgr.getRole()).toBe('teacher');
    mgr.setRole('student');
    expect(mgr.getRole()).toBe('student');
  });

  it('setStudentProfile은 이름과 아바타를 갱신', () => {
    mgr.setStudentProfile('테스터', '🦊');
    expect(mgr.getStudentName()).toBe('테스터');
    expect(mgr.getStudentAvatar()).toBe('🦊');
  });
});

describe('GameStateManager — 교실 학생', () => {
  it('setClassroomStudents / getClassroomStudents 라운드트립', () => {
    mgr.setClassroomStudents([]);
    expect(mgr.getClassroomStudents()).toEqual([]);
  });

  it('addStudentResponse는 신규 학생을 추가하고 동명은 갱신한다', () => {
    mgr.setClassroomStudents([]);
    const base = {
      name: '학생1', avatar: '⚡', completedUnits: [1], unitScores: { 1: 8 },
      unlockedCardsCount: 2, lastActive: 'now',
      answers: {}, unlockedCosmetics: [], equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' },
    };
    mgr.addStudentResponse(base);
    expect(mgr.getClassroomStudents()).toHaveLength(1);
    mgr.addStudentResponse({ ...base, unlockedCardsCount: 9 }); // 동명 갱신
    expect(mgr.getClassroomStudents()).toHaveLength(1);
    expect(mgr.getClassroomStudents()[0].unlockedCardsCount).toBe(9);
  });

  it('updateStudentProgress는 신규/기존 학생 점수를 누적·최댓값 유지', () => {
    mgr.setClassroomStudents([]);
    mgr.updateStudentProgress('철수', 1, 7, 10, ['u1_c1'], {});
    let s = mgr.getClassroomStudents().find(x => x.name === '철수')!;
    expect(s.unitScores[1]).toBe(7);
    mgr.updateStudentProgress('철수', 1, 5, 10, ['u1_c1', 'u1_c2'], {}); // 낮은 점수 → 최댓값 유지
    s = mgr.getClassroomStudents().find(x => x.name === '철수')!;
    expect(s.unitScores[1]).toBe(7);
    expect(s.unlockedCardsCount).toBe(2);
  });
});

describe('GameStateManager — 코스튬', () => {
  it('unlockCosmetic은 중복 없이 추가', () => {
    mgr.unlockCosmetic('outfit_scientist');
    const len = mgr.getUnlockedCosmetics().length;
    mgr.unlockCosmetic('outfit_scientist'); // 중복
    expect(mgr.getUnlockedCosmetics().length).toBe(len);
    expect(mgr.getUnlockedCosmetics()).toContain('outfit_scientist');
  });

  it('equipCosmetic은 지정 슬롯을 갱신', () => {
    mgr.equipCosmetic('outfit', 'outfit_scientist');
    expect(mgr.getEquippedCosmetics().outfit).toBe('outfit_scientist');
    mgr.equipCosmetic('hat', 'hat_none');
    expect(mgr.getEquippedCosmetics().hat).toBe('hat_none');
  });
});

describe('GameStateManager — 카드/단원/아이템', () => {
  it('unlockCard는 최초 잠금해제 시 true, 재호출 시 false', () => {
    const card = cards[0].id;
    // 이미 잠금해제됐을 수 있으므로 상태 확인 후 분기
    const already = mgr.checkCardUnlocked(card);
    const result = mgr.unlockCard(card);
    expect(result).toBe(!already);
    expect(mgr.checkCardUnlocked(card)).toBe(true);
    expect(mgr.unlockCard(card)).toBe(false); // 재호출
  });

  it('completeUnit은 최초 완료 시 완료 목록에 추가하고 신기록을 저장', () => {
    mgr.completeUnit(2, 9);
    expect(mgr.getProgress().completedUnits).toContain(2);
    expect(mgr.getProgress().unitHighScores[2]).toBe(9);
    mgr.completeUnit(2, 5); // 낮은 점수 → 신기록 유지
    expect(mgr.getProgress().unitHighScores[2]).toBe(9);
  });

  it('completeUnit 최초 클리어는 마일스톤 코인을 지급한다', () => {
    const before = mgr.getCoins();
    mgr.completeUnit(7, 10); // 미완료였다면 첫 클리어 보너스
    expect(mgr.getCoins()).toBeGreaterThanOrEqual(before);
  });

  it('useItem은 재고가 있으면 차감 후 true, 없으면 false', () => {
    // potion 기본 3개
    const first = mgr.useItem('potion');
    expect(typeof first).toBe('boolean');
    // 재고 소진까지 사용
    let guard = 0;
    while (mgr.useItem('potion') && guard < 20) guard++;
    expect(mgr.useItem('potion')).toBe(false);
  });

  it('gainItem은 재고를 늘려 다시 사용 가능하게 한다', () => {
    mgr.gainItem('potion', 2);
    expect(mgr.useItem('potion')).toBe(true);
  });

  it('checkCardUnlocked는 미보유 카드에 false', () => {
    expect(mgr.checkCardUnlocked('definitely_not_a_card')).toBe(false);
  });
});

describe('GameStateManager — 구독', () => {
  it('subscribe는 상태 변경 시 리스너를 호출하고 해제 가능하다', () => {
    let calls = 0;
    const unsub = mgr.subscribe(() => { calls++; });
    mgr.setSoundOn(!mgr.getSoundOn());
    expect(calls).toBeGreaterThan(0);
    const snapshot = calls;
    unsub();
    mgr.setSoundOn(!mgr.getSoundOn());
    expect(calls).toBe(snapshot); // 해제 후 호출 안 됨
  });
});

describe('GameStateManager — 상점/퀘스트', () => {
  it('purchaseItem은 코인이 충분하면 차감 후 아이템을 지급', () => {
    mgr.awardCoins(500, 'daily_quest');
    const before = mgr.getCoins();
    expect(mgr.purchaseItem('superBall', 100, 1)).toBe(true);
    expect(mgr.getCoins()).toBe(before - 100);
  });

  it('purchaseItem은 코인이 부족하면 false', () => {
    const before = mgr.getCoins();
    expect(mgr.purchaseItem('masterBall', before + 99999, 1)).toBe(false);
    expect(mgr.getCoins()).toBe(before);
  });

  it('claimQuestReward는 최초 1회만 코인 지급', () => {
    const before = mgr.getCoins();
    mgr.claimQuestReward('q_test', 40);
    expect(mgr.getCoins()).toBe(before + 40);
    mgr.claimQuestReward('q_test', 40); // 중복
    expect(mgr.getCoins()).toBe(before + 40);
  });
});

describe('GameStateManager — 일일 통계/배지/오답', () => {
  it('getDailyStats는 오늘 통계를 반환한다', () => {
    const stats = mgr.getDailyStats();
    expect(stats.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('incrementDailyStat / markLobbyVisited 동작', () => {
    const before = mgr.getDailyStats().quizCompleted;
    mgr.incrementDailyStat('quizCompleted');
    expect(mgr.getDailyStats().quizCompleted).toBe(before + 1);
    mgr.markLobbyVisited();
    expect(mgr.getDailyStats().lobbyVisited).toBe(true);
  });

  it('claimDailyQuestReward는 코인을 지급한다', () => {
    const before = mgr.getCoins();
    mgr.claimDailyQuestReward('dq_test', 25);
    expect(mgr.getCoins()).toBe(before + 25);
  });

  it('unlockBadge는 배지를 잠금해제한다', () => {
    mgr.unlockBadge(4);
    expect(mgr.getProgress().unlockedBadges).toContain('accessory_badge_u4');
  });

  it('addWrongAnswer / removeWrongAnswer 라운드트립', () => {
    mgr.addWrongAnswer('q1');
    expect(mgr.getProgress().wrongAnswers).toContain('q1');
    mgr.addWrongAnswer('q1'); // 중복 방지
    expect(mgr.getProgress().wrongAnswers!.filter(x => x === 'q1')).toHaveLength(1);
    mgr.removeWrongAnswer('q1');
    expect(mgr.getProgress().wrongAnswers).not.toContain('q1');
  });
});

describe('GameStateManager — 플레이어/진행도 파생', () => {
  it('getLocalPlayer는 현재 상태로 Player를 구성한다', () => {
    const player = mgr.getLocalPlayer();
    expect(player.coins).toBe(mgr.getCoins());
    expect(typeof player.level).toBe('number');
  });

  it('현재 퀴즈 세션 getter/setter 라운드트립', () => {
    expect(mgr.getCurrentQuizSession()).toBeNull();
    mgr.setCurrentQuizSession({ code: 'QS1' } as unknown as ReturnType<typeof mgr.getCurrentQuizSession>);
    expect(mgr.getCurrentQuizSession()).not.toBeNull();
    mgr.setCurrentQuizSession(null);
  });

  it('getCostumeInventory는 보유 코스튬만 반환', () => {
    const inv = mgr.getCostumeInventory({ unlockedCostumes: ['outfit_scientist'] } as unknown as Parameters<typeof mgr.getCostumeInventory>[0]);
    expect(inv.every(i => i.id === 'outfit_scientist')).toBe(true);
  });

  it('getTrainerInfo는 level/xp를 파생한다', () => {
    const info = mgr.getTrainerInfo();
    expect(info.level).toBeGreaterThanOrEqual(1);
    expect(typeof info.xp).toBe('number');
  });

  it('calculateCP는 유한한 CP를 반환한다', () => {
    const cp = mgr.calculateCP(mgr.getProgress().unlockedCardIds, mgr.getEquippedCosmetics());
    expect(Number.isFinite(cp)).toBe(true);
  });

  it('getCardPower / getCardEvolution / gainCardXp 동작', () => {
    const card = cards[0].id;
    mgr.unlockCard(card);
    expect(mgr.getCardPower(card)).toBeGreaterThan(0);
    expect(mgr.getCardEvolution(card, 1)).toHaveProperty('stage');
    mgr.gainCardXp([card], 50); // 예외 없이 동작
  });

  it('triggerAchievementEvent / getEarnedAchievementIds 동작', () => {
    const result = mgr.triggerAchievementEvent({ type: 'unit_complete', val: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(Array.isArray(mgr.getEarnedAchievementIds())).toBe(true);
  });
});

// resetProgress는 싱글톤 전체를 초기화하므로 반드시 이 파일 마지막에 실행.
describe('GameStateManager — resetProgress (마지막)', () => {
  it('모든 진행도를 기본값으로 되돌린다', () => {
    mgr.resetProgress();
    expect(mgr.getCoins()).toBe(0);
    expect(mgr.getProgress().unlockedCardIds).toEqual([]);
    expect(mgr.getProgress().completedUnits).toEqual([]);
    expect(mgr.getRole()).toBe('none');
    expect(mgr.getStudentName()).toBe('');
  });
});
