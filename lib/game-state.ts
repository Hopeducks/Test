import {
  GameProgress,
  DailyStats,
  StudentResponse,
  ClassroomSession,
  Player,
  CostumeItem,
  Achievement,
  ItemInventory
} from '../types';
import { costumeCatalog, UNIT_MILESTONE_COSTUME_IDS } from '../data/costume-catalog';
import {
  CoinSource,
  applyAward,
  applySpend,
  canAfford,
  firstClearBonus,
  highScoreBonus,
} from './economy';
import { deriveProgression } from './progression';
import { computeCP } from './cp-calculator';
import {
  getCardEvolution as cardEvolutionFn,
} from './card-evolution';
import { loadGameStateFromStorage, saveGameStateToStorage } from './game-state-storage';
import { processAchievementEvent, getEarnedAchievementIds, type AchievementHandlers } from './achievement-engine';
import { processCardXpGain, getCardPower as calcCardPower } from './card-xp';
import { getDailyStats as getDailyStatsUtil, incrementDailyStat as incrementDailyStatUtil, markLobbyVisited as markLobbyVisitedUtil, claimDailyQuestReward as claimDailyQuestRewardUtil } from './daily-stats';
import { processUnlockBadge } from './badge-system';
import { buildLocalPlayer, applyLocalPlayer } from './player-state';

// 속성(Attribute) 시스템은 lib/attributes.ts로 추출됨.
// 기존 import 경로 하위 호환을 위해 game-state에서 re-export 한다.
export type { PokemonAttribute } from './attributes';
export {
  ATTRIBUTE_EMOJIS,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_COLORS,
  getCardAttribute,
  getAttackMultiplier,
  getEffectivenessLabel
} from './attributes';


export interface GameState {
  progress: GameProgress;
  soundOn: boolean;
  role: 'none' | 'student' | 'teacher';
  studentName: string;
  studentAvatar: string;
  classroomStudents: StudentResponse[];
  classroomSession: ClassroomSession | null;
  unlockedCosmetics: string[];
  equippedCosmetics: {
    outfit: string;
    expression: string;
    accessory: string;
    mount: string;
    hat: string;
    badge: string;
    title: string;
    petId: string;
  };
}


class GameStateManager {
  private state: GameState = {
    progress: {
      unlockedCardIds: [],
      completedUnits: [],
      unitHighScores: {},
      coins: 0,
      claimedQuestIds: [],
      items: {
        potion: 3,
        magnifier: 3,
        watch: 3,
        superBall: 0,
        ultraBall: 0,
        masterBall: 0,
        potionHyper: 0,
        potionMax: 0,
        revive: 0,
      }
    },
    soundOn: true,
    role: 'none',
    studentName: '',
    studentAvatar: '⚡',
    classroomStudents: [],
    classroomSession: null,
    unlockedCosmetics: ['outfit_none', 'expression_none', 'accessory_none', 'mount_none'],
    equippedCosmetics: {
      outfit: 'none',
      expression: 'none',
      accessory: 'none',
      mount: 'none',
      hat: 'none',
      badge: 'none',
      title: 'none',
      petId: 'none',
    },
  };
  private listeners: Set<() => void> = new Set();
  private isInitialized = false;
  private localQuizSession: ClassroomSession | null = null;
  private isGrantingRewardRef = { value: false };
  private get achievementHandlers(): AchievementHandlers {
    return {
      awardCoins: (amt, src) => this.awardCoins(amt, src),
      unlockCosmetic: (id) => this.unlockCosmetic(id),
      unlockCard: (id) => this.unlockCard(id),
      save: () => this.save(),
    };
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
      // Listen to cross-tab storage changes to allow real-time multi-tab sync
      window.addEventListener('storage', (e) => {
        if (
          e.key === 'science_pokedex_progress' ||
          e.key === 'science_pokedex_sound' ||
          e.key === 'science_pokedex_role' ||
          e.key === 'science_pokedex_student_name' ||
          e.key === 'science_pokedex_student_avatar' ||
          e.key === 'science_pokedex_classroom_students' ||
          e.key === 'science_pokedex_classroom_session' ||
          e.key === 'science_pokedex_unlocked_cosmetics' ||
          e.key === 'science_pokedex_equipped_cosmetics'
        ) {
          this.loadFromStorage();
        }
      });

      // Listen to Supabase Realtime broadcast channel to sync session state in real time
      import('./supabase-client').then(({ supabase }) => {
        supabase.channel('classroom_session_global')
          .on('broadcast', { event: 'session_update' }, ({ payload }: { payload: ClassroomSession }) => {
            if (!payload) return;
            const isTeacher = this.state.role === 'teacher';
            const playerSessionCode = localStorage.getItem('science_pokedex_player_session_code') || '';
            // 교사는 항상 수신, 학생은 자신이 입장한 세션 코드와 일치할 때만 수신
            if (isTeacher || !playerSessionCode || playerSessionCode === payload.code) {
              this.state.classroomSession = payload;
              this.save();
            }
          })
          .subscribe();
      });
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.loadFromStorage();
    this.isInitialized = true;
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const shouldSave = loadGameStateFromStorage(this.state);
    if (shouldSave) this.save();
  }

  private save() {
    saveGameStateToStorage(this.state);
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getProgress(): GameProgress {
    this.ensureInitialized();
    return this.state.progress;
  }

  // ── 코인 단일 게이트웨이 (EPIC A) ────────────────────────────────
  // 모든 코인 증감은 반드시 이 메서드들을 거친다. progress.coins가 유일한 진실 원천.

  /** 현재 코인 잔액(항상 클램프된 정수). fallback 산식 없음. */
  getCoins(): number {
    this.ensureInitialized();
    const coins = this.state.progress.coins;
    return coins === undefined || Number.isNaN(coins) || coins < 0 ? 0 : Math.floor(coins);
  }

  /** 마일스톤/보상 코인 지급. source는 감사/추적용. */
  awardCoins(amount: number, _source?: CoinSource): number {
    this.ensureInitialized();
    this.state.progress.coins = applyAward(this.getCoins(), amount);
    this.save();
    return this.state.progress.coins;
  }

  /** 코인 차감. 잔액 부족 시 false 반환(차감하지 않음). */
  spendCoins(amount: number): boolean {
    this.ensureInitialized();
    const next = applySpend(this.getCoins(), amount);
    if (next < 0) return false;
    this.state.progress.coins = next;
    this.save();
    return true;
  }

  /** 구매 가능 여부 조회(상태 변경 없음). */
  canAffordCoins(cost: number): boolean {
    return canAfford(this.getCoins(), cost);
  }

  getSoundOn(): boolean {
    this.ensureInitialized();
    return this.state.soundOn;
  }

  setSoundOn(on: boolean) {
    this.state.soundOn = on;
    this.save();
  }

  getRole(): 'none' | 'student' | 'teacher' {
    this.ensureInitialized();
    return this.state.role;
  }

  setRole(role: 'none' | 'student' | 'teacher') {
    this.state.role = role;
    this.save();
  }

  getStudentName(): string {
    this.ensureInitialized();
    return this.state.studentName;
  }

  getStudentAvatar(): string {
    this.ensureInitialized();
    return this.state.studentAvatar;
  }

  setStudentProfile(name: string, avatar: string) {
    this.state.studentName = name;
    this.state.studentAvatar = avatar;
    this.save();
  }

  getClassroomStudents(): StudentResponse[] {
    this.ensureInitialized();
    return this.state.classroomStudents;
  }

  setClassroomStudents(students: StudentResponse[]) {
    this.state.classroomStudents = students;
    this.save();
  }

  getClassroomSession(): ClassroomSession | null {
    this.ensureInitialized();
    return this.state.classroomSession;
  }

  setClassroomSession(session: ClassroomSession | null) {
    this.state.classroomSession = session;
    this.save();

    // Broadcast session update to other clients in realtime
    import('./supabase-client').then(({ supabase }) => {
      const channel = supabase.channel('classroom_session_global');
      channel.send({
        type: 'broadcast',
        event: 'session_update',
        payload: session
      });
    });
  }

  addStudentResponse(response: StudentResponse) {
    this.ensureInitialized();
    const students = [...this.state.classroomStudents];
    const index = students.findIndex(s => s.name === response.name);
    if (index >= 0) {
      students[index] = response;
    } else {
      students.push(response);
    }
    this.state.classroomStudents = students;
    this.save();
  }

  updateStudentProgress(
    studentName: string, 
    unitId: number, 
    score: number, 
    answersCount: number, 
    unlockedCards: string[], 
    detailedAnswers: StudentResponse['answers']
  ) {
    this.ensureInitialized();
    const students = [...this.state.classroomStudents];
    const index = students.findIndex(s => s.name === studentName);
    
    const now = new Date().toISOString();
    
    if (index >= 0) {
      const student = students[index];
      const completedUnits = student.completedUnits.includes(unitId) 
        ? student.completedUnits 
        : [...student.completedUnits, unitId];
      
      const unitScores = {
        ...student.unitScores,
        [unitId]: Math.max(student.unitScores[unitId] || 0, score)
      };

      students[index] = {
        ...student,
        completedUnits,
        unitScores,
        unlockedCardsCount: Math.max(student.unlockedCardsCount, unlockedCards.length),
        lastActive: now,
        answers: {
          ...student.answers,
          ...detailedAnswers
        },
        items: student.items || (studentName === this.state.studentName ? this.state.progress.items : { potion: 3, magnifier: 3, watch: 3 })
      };
    } else {
      let avatar = '⚡';
      if (this.state.classroomSession) {
        const found = this.state.classroomSession.students.find(s => s.name === studentName);
        if (found) avatar = found.avatar;
      }

      students.push({
        name: studentName,
        avatar,
        completedUnits: [unitId],
        unitScores: { [unitId]: score },
        unlockedCardsCount: unlockedCards.length,
        lastActive: now,
        answers: detailedAnswers,
        unlockedCosmetics: ['outfit_none', 'expression_none', 'accessory_none', 'mount_none'],
        equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' },
        items: studentName === this.state.studentName ? this.state.progress.items : { potion: 3, magnifier: 3, watch: 3 },
      });
    }
    
    this.state.classroomStudents = students;
    this.save();
  }

  private ensureInitialized() {
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.init();
    }
  }

  getUnlockedCosmetics(): string[] {
    this.ensureInitialized();
    return this.state.unlockedCosmetics;
  }

  getEquippedCosmetics(): GameState['equippedCosmetics'] {
    this.ensureInitialized();
    return this.state.equippedCosmetics;
  }

  unlockCosmetic(itemId: string) {
    this.ensureInitialized();
    if (!this.state.unlockedCosmetics.includes(itemId)) {
      this.state.unlockedCosmetics = [...this.state.unlockedCosmetics, itemId];
      this.save();
    }
  }

  equipCosmetic(type: 'outfit' | 'expression' | 'accessory' | 'mount' | 'hat' | 'petId' | 'badge' | 'title', item: string) {
    this.ensureInitialized();
    this.state.equippedCosmetics = {
      ...this.state.equippedCosmetics,
      [type]: item,
    };
    this.save();

    // Also update current active student profile in active classroomSession if present
    if (this.state.classroomSession) {
      const updatedStudents = this.state.classroomSession.students.map(s => {
        if (s.name === this.state.studentName) {
          return {
            ...s,
            equippedCosmetics: this.state.equippedCosmetics
          };
        }
        return s;
      });
      this.setClassroomSession({
        ...this.state.classroomSession,
        students: updatedStudents
      });
    }
  }

  updateStudentCoordinates(x: number, y: number) {
    this.ensureInitialized();
    if (this.state.classroomSession) {
      const updatedStudents = this.state.classroomSession.students.map(s => {
        if (s.name === this.state.studentName) {
          return {
            ...s,
            x,
            y,
            equippedCosmetics: this.state.equippedCosmetics // Keep sync
          };
        }
        return s;
      });
      
      this.state.classroomSession.students = updatedStudents;
      this.save();
    }
  }

  checkMilestones(unitId: number, score: number) {
    if (score >= 8) { // 80% 이상 획득 시 단원 마일스톤 코스튬 해금 (카탈로그 실재 ID — D4)
      const unlockable = UNIT_MILESTONE_COSTUME_IDS[unitId];
      if (unlockable) {
        this.unlockCosmetic(unlockable);
      }
    }
  }

  unlockCard(cardId: string): boolean {
    const progress = this.state.progress;
    if (!progress.unlockedCardIds.includes(cardId)) {
      progress.unlockedCardIds = [...progress.unlockedCardIds, cardId];
      // 카드 해금의 보상은 카드 그 자체. 코인은 지급하지 않는다. (PRD EPIC A)
      this.incrementDailyStat('cardsUnlocked');
      this.save();
      // 카드 수집/레벨 업적 평가 (보상 지급 중 재귀 방지)
      if (!this.isGrantingRewardRef.value) {
        this.triggerAchievementEvent({ type: 'questions_correct', val: progress.unlockedCardIds.length });
        this.triggerAchievementEvent({ type: 'level', val: this.getTrainerInfo().level });
      }
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  }

  completeUnit(unitId: number, score: number) {
    const progress = this.state.progress;

    // 마일스톤 판정을 위해 변경 전 상태를 먼저 캡처한다.
    const isFirstClear = !progress.completedUnits.includes(unitId);
    const prevHighScore = progress.unitHighScores[unitId] || 0;

    if (isFirstClear) {
      progress.completedUnits = [...progress.completedUnits, unitId];
    }

    if (score > prevHighScore) {
      progress.unitHighScores = {
        ...progress.unitHighScores,
        [unitId]: score,
      };
    }

    // 마일스톤 코인 (EPIC A): 최초 완료 보너스 + 신기록 갱신 보너스(증가분 비례).
    // 반복 플레이로는 신기록을 못 깨므로 코인이 늘지 않아 farming이 차단된다.
    let milestoneCoins = 0;
    if (isFirstClear) milestoneCoins += firstClearBonus();
    milestoneCoins += highScoreBonus(prevHighScore, score);
    if (milestoneCoins > 0) {
      this.awardCoins(milestoneCoins, isFirstClear ? 'first_unit_clear' : 'new_high_score');
    }

    this.checkMilestones(unitId, score);
    this.incrementDailyStat('quizCompleted');
    this.save();

    // 업적 평가: 단원 완료 / 카드 수집 / 트레이너 레벨
    this.triggerAchievementEvent({ type: 'unit_complete', val: unitId });
    this.triggerAchievementEvent({ type: 'questions_correct', val: progress.unlockedCardIds.length });
    this.triggerAchievementEvent({ type: 'level', val: this.getTrainerInfo().level });
  }

  checkCardUnlocked(cardId: string): boolean {
    return this.getProgress().unlockedCardIds.includes(cardId);
  }

  useItem(type: keyof ItemInventory): boolean {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.items) {
      progress.items = {
        potion: 3, magnifier: 3, watch: 3,
        superBall: 0, ultraBall: 0, masterBall: 0,
        potionHyper: 0, potionMax: 0, revive: 0
      };
    }
    const currentCount = progress.items[type] || 0;
    if (currentCount > 0) {
      progress.items = {
        ...progress.items,
        [type]: currentCount - 1
      };
      this.save();
      
      if (this.state.classroomSession) {
        const updatedStudents = this.state.classroomSession.students.map(s => {
          if (s.name === this.state.studentName) {
            return {
              ...s,
              items: progress.items
            };
          }
          return s;
        });
        this.setClassroomSession({
          ...this.state.classroomSession,
          students: updatedStudents
        });
      }
      return true;
    }
    return false;
  }

  gainItem(type: keyof ItemInventory, amount: number) {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.items) {
      progress.items = {
        potion: 3, magnifier: 3, watch: 3,
        superBall: 0, ultraBall: 0, masterBall: 0,
        potionHyper: 0, potionMax: 0, revive: 0
      };
    }
    progress.items = {
      ...progress.items,
      [type]: (progress.items[type] || 0) + amount
    };
    this.save();

    if (this.state.classroomSession) {
      const updatedStudents = this.state.classroomSession.students.map(s => {
        if (s.name === this.state.studentName) {
          return {
            ...s,
            items: progress.items
          };
        }
        return s;
      });
      this.setClassroomSession({
        ...this.state.classroomSession,
        students: updatedStudents
      });
    }
  }

  purchaseItem(type: keyof ItemInventory, cost: number, amount: number): boolean {
    this.ensureInitialized();
    const progress = this.state.progress;

    if (!this.spendCoins(cost)) return false; // 잔액 부족 시 차감 없이 실패

    if (!progress.items) {
      progress.items = {
        potion: 3, magnifier: 3, watch: 3,
        superBall: 0, ultraBall: 0, masterBall: 0,
        potionHyper: 0, potionMax: 0, revive: 0
      };
    }
    progress.items = {
      ...progress.items,
      [type]: (progress.items[type] || 0) + amount
    };

    this.save();
    return true;
  }

  claimQuestReward(questId: string, coinReward: number) {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.claimedQuestIds) {
      progress.claimedQuestIds = [];
    }
    if (!progress.claimedQuestIds.includes(questId)) {
      progress.claimedQuestIds = [...progress.claimedQuestIds, questId];
      this.awardCoins(coinReward, 'quest_reward');
    }
  }

  getDailyStats(): DailyStats {
    this.ensureInitialized();
    return getDailyStatsUtil(this.state.progress, () => this.save());
  }

  incrementDailyStat(key: 'quizCompleted' | 'battlesPlayed' | 'cardsUnlocked') {
    incrementDailyStatUtil(this.state.progress, key, () => this.getDailyStats());
  }

  markLobbyVisited() {
    markLobbyVisitedUtil(this.state.progress, () => this.save(), () => this.getDailyStats());
  }

  claimDailyQuestReward(questId: string, coinReward: number) {
    this.ensureInitialized();
    claimDailyQuestRewardUtil(
      this.state.progress, questId, coinReward,
      (amt, src) => this.awardCoins(amt, src),
      () => this.save(),
      () => this.getDailyStats()
    );
  }

  resetProgress() {
    this.state.progress = {
      unlockedCardIds: [],
      completedUnits: [],
      unitHighScores: {},
      coins: 0,
      claimedQuestIds: [],
      earnedAchievementIds: [],
      earnedTitles: [],
      items: {
        potion: 3,
        magnifier: 3,
        watch: 3,
        superBall: 0,
        ultraBall: 0,
        masterBall: 0,
        potionHyper: 0,
        potionMax: 0,
        revive: 0,
      }
    };
    this.state.role = 'none';
    this.state.studentName = '';
    this.state.studentAvatar = '⚡';
    this.state.classroomStudents = [];
    this.state.classroomSession = null;
    this.state.unlockedCosmetics = ['outfit_none', 'expression_none', 'accessory_none', 'mount_none'];
    this.state.equippedCosmetics = {
      outfit: 'none',
      expression: 'none',
      accessory: 'none',
      mount: 'none',
      hat: 'none',
      badge: 'none',
      title: 'none',
      petId: 'none',
    };
    this.state.soundOn = true;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('science_pokedex_player');
    }
    this.save();
  }

  unlockBadge(unitId: number) {
    this.ensureInitialized();
    processUnlockBadge(this.state.progress, unitId, {
      unlockCosmetic: (id) => this.unlockCosmetic(id),
      awardCoins: (amt, src) => this.awardCoins(amt, src),
      save: () => this.save(),
    });
  }

  addWrongAnswer(questionId: string) {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.wrongAnswers) {
      progress.wrongAnswers = [];
    }
    if (!progress.wrongAnswers.includes(questionId)) {
      progress.wrongAnswers = [...progress.wrongAnswers, questionId];
      this.save();
    }
  }

  removeWrongAnswer(questionId: string) {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.wrongAnswers) {
      progress.wrongAnswers = [];
    }
    if (progress.wrongAnswers.includes(questionId)) {
      progress.wrongAnswers = progress.wrongAnswers.filter(id => id !== questionId);
      this.save();
    }
  }

  // ── TASK 1D: 신규 로컬 상태 관리 메서드들 ───────────────────────────────

  getLocalPlayer(): Player {
    this.ensureInitialized();
    return buildLocalPlayer(this.state, () => this.getCoins());
  }

  setLocalPlayer(player: Player) {
    applyLocalPlayer(this.state, player, () => this.save());
  }

  getCurrentQuizSession(): ClassroomSession | null {
    return this.localQuizSession;
  }

  setCurrentQuizSession(session: ClassroomSession | null) {
    this.localQuizSession = session;
  }

  getCostumeInventory(player: Player): CostumeItem[] {
    return costumeCatalog.filter(item => player.unlockedCostumes.includes(item.id));
  }

  getEarnedAchievementIds(): string[] {
    this.ensureInitialized();
    return getEarnedAchievementIds(this.state.progress);
  }

  triggerAchievementEvent(event: { type: string; val: number }): Achievement[] {
    this.ensureInitialized();
    return processAchievementEvent(
      this.state.progress, event, this.achievementHandlers, this.isGrantingRewardRef
    );
  }

  /** @deprecated 하위 호환용. */
  checkAchievements(_player: Player, event: { type: string; val: number }): Achievement[] {
    return this.triggerAchievementEvent(event);
  }

  getCardPower(cardId: string): number {
    return calcCardPower(cardId, this.state.progress);
  }

  getCardEvolution(cardId: string, level: number) {
    return cardEvolutionFn(cardId, level);
  }

  gainCardXp(cardIds: string[], amount: number) {
    this.ensureInitialized();
    processCardXpGain(this.state.progress, cardIds, amount, () => this.save());
  }

  getTrainerInfo() {
    this.ensureInitialized();
    const progress = this.state.progress;

    // D8: 통합 산식(lib/progression.ts)이 유일한 진실 원천.
    const info = deriveProgression(progress);

    progress.trainerLevel = info.level;
    progress.trainerXp = info.xp;

    return info;
  }

  calculateCP(
    unlockedCardIds: string[],
    equippedCosmetics: { outfit: string; expression: string; accessory: string; mount: string; hat?: string; badge?: string; title?: string; petId?: string }
  ): number {
    return computeCP(unlockedCardIds, equippedCosmetics, this.getProgress().cardLevels);
  }
}

export const gameStateManager = new GameStateManager();


export { useGameState } from './use-game-state';
export { default } from './use-game-state';
