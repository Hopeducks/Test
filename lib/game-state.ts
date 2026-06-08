import { ACHIEVEMENTS_LIST } from '../data/achievements';
import {
  GameProgress,
  DailyStats,
  StudentResponse,
  ClassroomSession,
  Player,
  CostumeId,
  CostumeItem,
  Achievement,
  EmoteId,
  ItemInventory
} from '../types';
import { cards } from '../data/cards';
import { costumeCatalog, UNIT_MILESTONE_COSTUME_IDS, getActiveSetBonus } from '../data/costume-catalog';
import {
  CoinSource,
  applyAward,
  applySpend,
  canAfford,
  normalizeLoadedCoins,
  firstClearBonus,
  highScoreBonus,
  gymFirstClearBonus,
} from './economy';
import {
  deriveProgression,
  sumCardLevelSteps,
  topTwoPowerSum,
  deriveCp,
} from './progression';
import { migrateLegacyState } from './legacy-migration';
import {
  EVOLUTION_LEVELS,
  getCardEvolution as cardEvolutionFn,
} from './card-evolution';

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

const DEFAULT_PROGRESS: GameProgress = {
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
  },
};

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
  private isGrantingReward = false; // 업적 보상 지급 중 재귀 방지 가드

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
    try {
      let shouldSaveAfterLoad = false;
      const savedProgress = localStorage.getItem('science_pokedex_progress');
      const savedSound = localStorage.getItem('science_pokedex_sound');
      const savedRole = localStorage.getItem('science_pokedex_role');
      const savedStudentName = localStorage.getItem('science_pokedex_student_name');
      const savedStudentAvatar = localStorage.getItem('science_pokedex_student_avatar');
      const savedClassroomStudents = localStorage.getItem('science_pokedex_classroom_students');
      const savedClassroomSession = localStorage.getItem('science_pokedex_classroom_session');
      const savedUnlockedCosmetics = localStorage.getItem('science_pokedex_unlocked_cosmetics');
      const savedEquippedCosmetics = localStorage.getItem('science_pokedex_equipped_cosmetics');

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        this.state.progress = {
          unlockedCardIds: parsed.unlockedCardIds || [],
          completedUnits: parsed.completedUnits || [],
          unitHighScores: parsed.unitHighScores || {},
          coins: normalizeLoadedCoins(parsed),
          claimedQuestIds: parsed.claimedQuestIds || [],
          earnedAchievementIds: parsed.earnedAchievementIds || [],
          earnedTitles: parsed.earnedTitles || [],
          unlockedBadges: parsed.unlockedBadges || [],
          wrongAnswers: parsed.wrongAnswers || [],
          gymLeaderBeaten: parsed.gymLeaderBeaten || {},
          cardLevels: parsed.cardLevels || {},
          cardXps: parsed.cardXps || {},
          items: {
            potion: parsed.items?.potion !== undefined ? parsed.items.potion : 3,
            magnifier: parsed.items?.magnifier !== undefined ? parsed.items.magnifier : 3,
            watch: parsed.items?.watch !== undefined ? parsed.items.watch : 3,
            superBall: parsed.items?.superBall || 0,
            ultraBall: parsed.items?.ultraBall || 0,
            masterBall: parsed.items?.masterBall || 0,
            potionHyper: parsed.items?.potionHyper || 0,
            potionMax: parsed.items?.potionMax || 0,
            revive: parsed.items?.revive || 0,
          }
        };
      } else {
        // Attempt migration from legacy storage key (Science Pokedex Review Webapp v1)
        const legacyData = localStorage.getItem('sci_pokedex_game_state_v1');
        if (legacyData) {
          const migrated = migrateLegacyState(legacyData);
          if (migrated) {
            this.state.progress = { ...migrated.progress } as GameProgress;
            if (migrated.soundOn !== undefined) this.state.soundOn = migrated.soundOn;
            shouldSaveAfterLoad = true;
            console.log('Successfully migrated legacy game state from v1 to Metaverse progress:', this.state.progress);
          } else {
            console.error('Failed to migrate legacy state');
            this.state.progress = {
              unlockedCardIds: [],
              completedUnits: [],
              unitHighScores: {},
              items: { potion: 3, magnifier: 3, watch: 3 }
            };
          }
        } else {
          this.state.progress = {
            unlockedCardIds: [],
            completedUnits: [],
            unitHighScores: {},
            items: { potion: 3, magnifier: 3, watch: 3 }
          };
        }
      }
      if (savedSound !== null) {
        this.state.soundOn = savedSound === 'true';
      }
      if (savedRole !== null) {
        this.state.role = savedRole as GameState['role'];
      } else {
        this.state.role = 'none';
      }
      if (savedStudentName !== null) {
        this.state.studentName = savedStudentName;
      } else {
        this.state.studentName = '';
      }
      if (savedStudentAvatar !== null) {
        this.state.studentAvatar = savedStudentAvatar;
      } else {
        this.state.studentAvatar = '⚡';
      }
      if (savedClassroomStudents) {
        this.state.classroomStudents = JSON.parse(savedClassroomStudents);
      } else {
        this.state.classroomStudents = [];
      }
      if (savedClassroomSession) {
        this.state.classroomSession = JSON.parse(savedClassroomSession);
      } else {
        this.state.classroomSession = null;
      }
      if (savedUnlockedCosmetics) {
        this.state.unlockedCosmetics = JSON.parse(savedUnlockedCosmetics);
      } else {
        this.state.unlockedCosmetics = ['outfit_none', 'expression_none', 'accessory_none', 'mount_none'];
      }
      if (savedEquippedCosmetics) {
        const parsed = JSON.parse(savedEquippedCosmetics);
        this.state.equippedCosmetics = {
          outfit: parsed.outfit || 'none',
          expression: parsed.expression || 'none',
          accessory: parsed.accessory || 'none',
          mount: parsed.mount || 'none',
          hat: parsed.hat || 'none',
          badge: parsed.badge || 'none',
          title: parsed.title || 'none',
          petId: parsed.petId || 'none',
        };
      } else {
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
      }
      
      if (shouldSaveAfterLoad) {
        this.save();
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('science_pokedex_progress', JSON.stringify(this.state.progress));
      localStorage.setItem('science_pokedex_sound', String(this.state.soundOn));
      localStorage.setItem('science_pokedex_role', this.state.role);
      localStorage.setItem('science_pokedex_student_name', this.state.studentName);
      localStorage.setItem('science_pokedex_student_avatar', this.state.studentAvatar);
      localStorage.setItem('science_pokedex_classroom_students', JSON.stringify(this.state.classroomStudents));
      localStorage.setItem('science_pokedex_unlocked_cosmetics', JSON.stringify(this.state.unlockedCosmetics));
      localStorage.setItem('science_pokedex_equipped_cosmetics', JSON.stringify(this.state.equippedCosmetics));
      if (this.state.classroomSession) {
        localStorage.setItem('science_pokedex_classroom_session', JSON.stringify(this.state.classroomSession));
      } else {
        localStorage.removeItem('science_pokedex_classroom_session');
      }
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
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
      if (!this.isGrantingReward) {
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

  /** 오늘 날짜 문자열 반환 (YYYY-MM-DD). */
  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** 일일 통계를 읽어온다. 날짜가 바뀌었으면 초기화하고 claimedDailyQuestIds도 리셋. */
  getDailyStats(): DailyStats {
    this.ensureInitialized();
    const progress = this.state.progress;
    const today = this.todayStr();
    if (!progress.dailyStats || progress.dailyStats.date !== today) {
      progress.dailyStats = { date: today, quizCompleted: 0, battlesPlayed: 0, cardsUnlocked: 0, lobbyVisited: false };
      progress.claimedDailyQuestIds = [];
      this.save();
    }
    return progress.dailyStats;
  }

  /** 일일 숫자형 통계 1 증가. */
  incrementDailyStat(key: 'quizCompleted' | 'battlesPlayed' | 'cardsUnlocked') {
    const stats = this.getDailyStats();
    this.state.progress.dailyStats = { ...stats, [key]: stats[key] + 1 };
  }

  /** 로비 입장 기록. */
  markLobbyVisited() {
    const stats = this.getDailyStats();
    if (!stats.lobbyVisited) {
      this.state.progress.dailyStats = { ...stats, lobbyVisited: true };
      this.save();
    }
  }

  /** 일일 퀘스트 보상 수령. 하루 1회만 가능하며 coins는 A-3 상한 내 소액. */
  claimDailyQuestReward(questId: string, coinReward: number) {
    this.ensureInitialized();
    const progress = this.state.progress;
    this.getDailyStats(); // 날짜 리셋 보장
    if (!progress.claimedDailyQuestIds) progress.claimedDailyQuestIds = [];
    if (!progress.claimedDailyQuestIds.includes(questId)) {
      progress.claimedDailyQuestIds = [...progress.claimedDailyQuestIds, questId];
      this.awardCoins(coinReward, 'daily_quest');
      this.save();
    }
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
    const progress = this.state.progress;

    // 최초 격파 여부를 변경 전 캡처 (마일스톤 코인 판정용).
    const isFirstGymClear = !progress.gymLeaderBeaten?.[unitId];

    if (!progress.unlockedBadges) {
      progress.unlockedBadges = [];
    }
    const badgeId = `accessory_badge_u${unitId}`;
    if (!progress.unlockedBadges.includes(badgeId)) {
      progress.unlockedBadges = [...progress.unlockedBadges, badgeId];
    }
    this.unlockCosmetic(badgeId);
    if (!progress.gymLeaderBeaten) {
      progress.gymLeaderBeaten = {};
    }
    progress.gymLeaderBeaten[unitId] = true;

    // 체육관 관장 최초 격파 시에만 마일스톤 코인 지급. (EPIC A)
    if (isFirstGymClear) {
      this.awardCoins(gymFirstClearBonus(), 'gym_first_clear');
    }

    this.save();
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

    // D8: 레벨/XP/코인은 항상 통합 산식에서 파생 — 저장본을 로드해도 이 값으로 덮어쓴다.
    const info = deriveProgression(this.state.progress);

    // Attempt load from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('science_pokedex_player');
      if (saved) {
        try {
          const player = JSON.parse(saved) as Player;
          // 저장본의 stale한 level/xp/coins를 신선한 파생값으로 정합화.
          player.level = info.level;
          player.xp = info.xp;
          player.coins = this.getCoins();
          player.achievements = this.state.progress.earnedAchievementIds ?? [];
          return player;
        } catch (e) {}
      }
    }

    // Fallback/Construction bridging local fields
    return {
      id: typeof window !== 'undefined' ? (localStorage.getItem('app.player_id') || 'local-player-id') : 'local-player-id',
      nickname: this.state.studentName || '학생',
      sessionCode: typeof window !== 'undefined' ? (localStorage.getItem('app.session_code') || '') : '',
      avatar: {
        bodyColor: '#4f46e5',
        outfit: this.state.equippedCosmetics.outfit as CostumeId || null,
        accessory: this.state.equippedCosmetics.accessory as CostumeId || null,
        vehicle: this.state.equippedCosmetics.mount as CostumeId || null,
        hat: this.state.equippedCosmetics.hat as CostumeId || null,
        badge: this.state.equippedCosmetics.badge as CostumeId || null,
        title: this.state.equippedCosmetics.title as CostumeId || null,
        emote: this.state.equippedCosmetics.expression as EmoteId || null,
        petId: this.state.equippedCosmetics.petId || null
      },
      position: { x: 400, y: 300 },
      xp: info.xp,
      level: info.level,
      coins: this.getCoins(),
      unlockedCards: this.state.progress.unlockedCardIds,
      unlockedCostumes: this.state.unlockedCosmetics as CostumeId[],
      achievements: this.state.progress.earnedAchievementIds ?? []
    };
  }

  setLocalPlayer(player: Player) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('science_pokedex_player', JSON.stringify(player));
      localStorage.setItem('app.player_id', player.id);
      localStorage.setItem('app.session_code', player.sessionCode);
      window.dispatchEvent(new CustomEvent('react:avatarUpdate', { detail: { nickname: player.nickname, avatar: player.avatar } }));
    }
    
    this.state.studentName = player.nickname;
    this.state.unlockedCosmetics = player.unlockedCostumes;
    this.state.equippedCosmetics = {
      outfit: player.avatar.outfit || 'none',
      expression: player.avatar.emote || 'none',
      accessory: player.avatar.accessory || 'none',
      mount: player.avatar.vehicle || 'none',
      hat: player.avatar.hat || 'none',
      badge: player.avatar.badge || 'none',
      title: player.avatar.title || 'none',
      petId: player.avatar.petId || 'none',
    };
    this.state.progress.unlockedCardIds = player.unlockedCards;
    this.state.progress.coins = player.coins;
    this.save();
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

  /** 획득한 업적 ID 목록(영속). */
  getEarnedAchievementIds(): string[] {
    this.ensureInitialized();
    if (!this.state.progress.earnedAchievementIds) {
      this.state.progress.earnedAchievementIds = [];
    }
    return this.state.progress.earnedAchievementIds;
  }

  /** 업적 보상 지급 (costume/coins/card/title 전부 처리 — D3). 재귀 방지 가드 사용. */
  private grantAchievementReward(ach: Achievement): void {
    const reward = ach.reward;
    this.isGrantingReward = true;
    try {
      if (reward.type === 'costume') {
        this.unlockCosmetic(reward.costumeId);
      } else if (reward.type === 'coins') {
        this.awardCoins(reward.amount, 'achievement_reward');
      } else if (reward.type === 'card') {
        this.unlockCard(reward.cardId);
      } else if (reward.type === 'title') {
        // 칭호 텍스트를 영속 저장하고, 동일 이름의 카탈로그 칭호가 있으면 해금한다.
        const progress = this.state.progress;
        if (!progress.earnedTitles) progress.earnedTitles = [];
        if (!progress.earnedTitles.includes(reward.titleText)) {
          progress.earnedTitles = [...progress.earnedTitles, reward.titleText];
        }
        const matchingTitle = costumeCatalog.find(
          c => c.category === 'title' && c.name === reward.titleText
        );
        if (matchingTitle) this.unlockCosmetic(matchingTitle.id);
      }
    } finally {
      this.isGrantingReward = false;
    }
  }

  /**
   * 업적 이벤트를 평가하여 새로 달성한 업적을 영속 기록·보상하고 반환한다. (D2)
   * 호출 지점: completeUnit/unlockCard(내부 자동), QuizScreen(streak), BossRaidScreen(boss_damage).
   */
  triggerAchievementEvent(event: { type: string; val: number }): Achievement[] {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.earnedAchievementIds) progress.earnedAchievementIds = [];

    const newlyEarned: Achievement[] = [];
    const unlockedCards = progress.unlockedCardIds;
    const completedUnits = progress.completedUnits;

    ACHIEVEMENTS_LIST.forEach(ach => {
      if (progress.earnedAchievementIds!.includes(ach.id)) return;

      let met = false;
      const cond = ach.condition;

      if (cond.type === 'streak' && event.type === 'streak') {
        met = event.val >= cond.count;
      } else if (cond.type === 'unit_complete' && event.type === 'unit_complete') {
        met = cond.unitId === 0 ? completedUnits.length >= 8 : event.val === cond.unitId;
      } else if (cond.type === 'level' && event.type === 'level') {
        met = event.val >= cond.level;
      } else if (cond.type === 'questions_correct' && event.type === 'questions_correct') {
        met = unlockedCards.length >= cond.count;
      } else if (cond.type === 'boss_damage' && event.type === 'boss_damage') {
        met = event.val >= cond.total;
      } else if (cond.type === 'battles_won' && event.type === 'battles_won') {
        met = event.val >= cond.count;
      }

      if (met) {
        progress.earnedAchievementIds!.push(ach.id);
        this.grantAchievementReward(ach);
        newlyEarned.push(ach);
      }
    });

    if (newlyEarned.length > 0) {
      this.save();
      if (typeof window !== 'undefined') {
        newlyEarned.forEach(ach => {
          window.dispatchEvent(
            new CustomEvent('react:achievementUnlocked', {
              detail: { id: ach.id, name: ach.name, icon: ach.icon, description: ach.description }
            })
          );
        });
      }
    }

    return newlyEarned;
  }

  /** @deprecated 하위 호환용. player 인자는 무시되고 triggerAchievementEvent로 위임된다. */
  checkAchievements(_player: Player, event: { type: string; val: number }): Achievement[] {
    return this.triggerAchievementEvent(event);
  }

  getCardPower(cardId: string): number {
    const card = cards.find(c => c.id === cardId);
    const basePower = card?.power || card?.attack || 20;
    const level = this.state.progress.cardLevels?.[cardId] || 1;
    return basePower + (level - 1) * 10;
  }

  getCardEvolution(cardId: string, level: number) {
    return cardEvolutionFn(cardId, level);
  }

  gainCardXp(cardIds: string[], amount: number) {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.cardLevels) progress.cardLevels = {};
    if (!progress.cardXps) progress.cardXps = {};

    let hasLevelUp = false;
    const levelUpCards: string[] = [];
    // 진화 단계 교차 카드 — getCardEvolution의 stage 경계(레벨 4=2단계, 8=3단계)와 일치.
    const evolvedCards: { cardId: string; newLevel: number }[] = [];

    cardIds.forEach(cardId => {
      if (!progress.unlockedCardIds.includes(cardId)) return;

      const currentXp = progress.cardXps![cardId] || 0;
      const currentLevel = progress.cardLevels![cardId] || 1;

      if (currentLevel >= 10) return;

      const nextXp = currentXp + amount;
      if (nextXp >= 100) {
        const newLevel = currentLevel + 1;
        progress.cardLevels![cardId] = newLevel;
        progress.cardXps![cardId] = nextXp - 100;
        hasLevelUp = true;
        levelUpCards.push(cardId);
        if (newLevel === EVOLUTION_LEVELS.stage2 || newLevel === EVOLUTION_LEVELS.stage3) {
          evolvedCards.push({ cardId, newLevel });
        }
      } else {
        progress.cardXps![cardId] = nextXp;
      }
    });

    if (hasLevelUp || amount > 0) {
      this.save();
    }

    if (levelUpCards.length > 0 && typeof window !== 'undefined') {
      levelUpCards.forEach(cId => {
        const matchingCard = cards.find(c => c.id === cId);
        if (matchingCard) {
          window.dispatchEvent(new CustomEvent('react:cardLevelUp', { detail: { cardId: cId, name: matchingCard.name } }));
        }
      });
    }

    // 진화 연출(D-2): 레벨업이 진화 단계를 넘으면 전역 진화 오버레이를 띄운다.
    if (evolvedCards.length > 0 && typeof window !== 'undefined') {
      evolvedCards.forEach(({ cardId, newLevel }) => {
        const evo = this.getCardEvolution(cardId, newLevel);
        window.dispatchEvent(new CustomEvent('react:cardEvolved', {
          detail: { cardId, name: evo.name, emoji: evo.emoji, stage: evo.stage }
        }));
      });
    }
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
    const unlockedCardsData = cards.filter(c => unlockedCardIds.includes(c.id));
    const powers = unlockedCardsData.map(c => c.power || c.attack || 20);

    let equippedStatsSum = 0;
    const itemsToSum = [
      equippedCosmetics.outfit,
      equippedCosmetics.accessory,
      equippedCosmetics.mount,
      equippedCosmetics.hat,
      equippedCosmetics.badge,
      equippedCosmetics.title,
      equippedCosmetics.petId
    ];
    itemsToSum.forEach(itemId => {
      if (!itemId || itemId === 'none') return;
      const item = costumeCatalog.find(c => c.id === itemId);
      if (item && item.stats) {
        equippedStatsSum += (item.stats.hp || 0) + (item.stats.attack || 0) + (item.stats.defense || 0);
      }
    });

    // 코스튬 세트 완성 보너스(C-2).
    const { totalCpBonus } = getActiveSetBonus(itemsToSum);

    // D8: CP 가중치도 lib/progression.ts 1곳. 여기서는 데이터만 해석한다.
    return deriveCp({
      unlockedCardCount: unlockedCardIds.length,
      topTwoPowerSum: topTwoPowerSum(powers),
      equippedStatsSum,
      cardLevelSteps: sumCardLevelSteps(this.getProgress().cardLevels),
      setBonus: totalCpBonus,
    });
  }
}

export const gameStateManager = new GameStateManager();

// React hook for component reactivity
import { useState, useEffect } from 'react';

export function useGameState() {
  const [state, setState] = useState<GameState>({
    progress: { unlockedCardIds: [], completedUnits: [], unitHighScores: {} },
    soundOn: true,
    role: 'none',
    studentName: '',
    studentAvatar: '⚡',
    classroomStudents: [],
    classroomSession: null,
    unlockedCosmetics: ['outfit_none', 'expression_none', 'accessory_none', 'mount_none'],
    equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none', hat: 'none', badge: 'none', title: 'none', petId: 'none' },
  });

  useEffect(() => {
    setState({
      progress: gameStateManager.getProgress(),
      soundOn: gameStateManager.getSoundOn(),
      role: gameStateManager.getRole(),
      studentName: gameStateManager.getStudentName(),
      studentAvatar: gameStateManager.getStudentAvatar(),
      classroomStudents: gameStateManager.getClassroomStudents(),
      classroomSession: gameStateManager.getClassroomSession(),
      unlockedCosmetics: gameStateManager.getUnlockedCosmetics(),
      equippedCosmetics: gameStateManager.getEquippedCosmetics(),
    });

    const unsubscribe = gameStateManager.subscribe(() => {
      setState({
        progress: gameStateManager.getProgress(),
        soundOn: gameStateManager.getSoundOn(),
        role: gameStateManager.getRole(),
        studentName: gameStateManager.getStudentName(),
        studentAvatar: gameStateManager.getStudentAvatar(),
        classroomStudents: gameStateManager.getClassroomStudents(),
        classroomSession: gameStateManager.getClassroomSession(),
        unlockedCosmetics: gameStateManager.getUnlockedCosmetics(),
        equippedCosmetics: gameStateManager.getEquippedCosmetics(),
      });
    });

    return unsubscribe;
  }, []);

  return {
    progress: state.progress,
    soundOn: state.soundOn,
    role: state.role,
    studentName: state.studentName,
    studentAvatar: state.studentAvatar,
    classroomStudents: state.classroomStudents,
    classroomSession: state.classroomSession,
    unlockedCosmetics: state.unlockedCosmetics,
    equippedCosmetics: state.equippedCosmetics,
    setRole: (role: 'none' | 'student' | 'teacher') => gameStateManager.setRole(role),
    setStudentProfile: (name: string, avatar: string) => gameStateManager.setStudentProfile(name, avatar),
    setClassroomStudents: (students: StudentResponse[]) => gameStateManager.setClassroomStudents(students),
    setClassroomSession: (session: ClassroomSession | null) => gameStateManager.setClassroomSession(session),
    addStudentResponse: (response: StudentResponse) => gameStateManager.addStudentResponse(response),
    updateStudentProgress: (
      studentName: string, 
      unitId: number, 
      score: number, 
      answersCount: number, 
      unlockedCards: string[], 
      detailedAnswers: StudentResponse['answers']
    ) => gameStateManager.updateStudentProgress(studentName, unitId, score, answersCount, unlockedCards, detailedAnswers),
    setSoundOn: (on: boolean) => gameStateManager.setSoundOn(on),
    unlockCard: (cardId: string) => gameStateManager.unlockCard(cardId),
    completeUnit: (unitId: number, score: number) => gameStateManager.completeUnit(unitId, score),
    checkCardUnlocked: (cardId: string) => gameStateManager.checkCardUnlocked(cardId),
    resetProgress: () => gameStateManager.resetProgress(),
    unlockCosmetic: (itemId: string) => gameStateManager.unlockCosmetic(itemId),
    equipCosmetic: (type: 'outfit' | 'expression' | 'accessory' | 'mount' | 'hat' | 'petId' | 'badge' | 'title', item: string) => gameStateManager.equipCosmetic(type, item),
    updateStudentCoordinates: (x: number, y: number) => gameStateManager.updateStudentCoordinates(x, y),
    useItem: (type: keyof ItemInventory) => gameStateManager.useItem(type),
    gainItem: (type: keyof ItemInventory, amount: number) => gameStateManager.gainItem(type, amount),
    purchaseItem: (type: keyof ItemInventory, cost: number, amount: number) => gameStateManager.purchaseItem(type, cost, amount),
    claimQuestReward: (questId: string, coinReward: number) => gameStateManager.claimQuestReward(questId, coinReward),
    claimDailyQuestReward: (questId: string, coinReward: number) => gameStateManager.claimDailyQuestReward(questId, coinReward),
    getDailyStats: () => gameStateManager.getDailyStats(),
    markLobbyVisited: () => gameStateManager.markLobbyVisited(),
    incrementDailyStat: (key: 'quizCompleted' | 'battlesPlayed' | 'cardsUnlocked') => gameStateManager.incrementDailyStat(key),
    getCoins: () => gameStateManager.getCoins(),
    awardCoins: (amount: number, source?: CoinSource) => gameStateManager.awardCoins(amount, source),
    spendCoins: (amount: number) => gameStateManager.spendCoins(amount),
    canAffordCoins: (cost: number) => gameStateManager.canAffordCoins(cost),
    calculateCP: (
      unlockedCardIds: string[], 
      equippedCosmetics: { outfit: string; expression: string; accessory: string; mount: string; hat?: string; badge?: string; title?: string; petId?: string }
    ) => gameStateManager.calculateCP(unlockedCardIds, equippedCosmetics),
    
    // ── TASK 1D: expose new methods in hook ──
    getLocalPlayer: () => gameStateManager.getLocalPlayer(),
    setLocalPlayer: (player: Player) => gameStateManager.setLocalPlayer(player),
    getCurrentQuizSession: () => gameStateManager.getCurrentQuizSession(),
    setCurrentQuizSession: (session: ClassroomSession | null) => gameStateManager.setCurrentQuizSession(session),
    getCostumeInventory: (player: Player) => gameStateManager.getCostumeInventory(player),
    checkAchievements: (player: Player, event: { type: string; val: number }) => gameStateManager.checkAchievements(player, event),
    triggerAchievementEvent: (event: { type: string; val: number }) => gameStateManager.triggerAchievementEvent(event),
    getEarnedAchievementIds: () => gameStateManager.getEarnedAchievementIds(),
    getCardPower: (cardId: string) => gameStateManager.getCardPower(cardId),
    getCardEvolution: (cardId: string, level: number) => gameStateManager.getCardEvolution(cardId, level),
    gainCardXp: (cardIds: string[], amount: number) => gameStateManager.gainCardXp(cardIds, amount),
    getTrainerInfo: () => gameStateManager.getTrainerInfo(),
    unlockBadge: (unitId: number) => gameStateManager.unlockBadge(unitId),
    addWrongAnswer: (questionId: string) => gameStateManager.addWrongAnswer(questionId),
    removeWrongAnswer: (questionId: string) => gameStateManager.removeWrongAnswer(questionId),
  };
}

export default useGameState;
