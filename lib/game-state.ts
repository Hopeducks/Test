import { ACHIEVEMENTS_LIST } from '../data/achievements';
import {
  GameProgress,
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
import { costumeCatalog } from '../data/costume-catalog';

export type PokemonAttribute = '땅' | '전기' | '물' | '에스퍼' | '풀' | '비행' | '노말' | '불꽃';

export const ATTRIBUTE_EMOJIS: Record<PokemonAttribute, string> = {
  '땅': '🪨',
  '전기': '⚡',
  '물': '💧',
  '에스퍼': '🔮',
  '풀': '🍃',
  '비행': '🌪️',
  '노말': '⚪',
  '불꽃': '🔥'
};

export const ATTRIBUTE_NAMES: Record<PokemonAttribute, string> = {
  '땅': '땅 (Ground)',
  '전기': '전기 (Electric)',
  '물': '물 (Water)',
  '에스퍼': '에스퍼 (Psychic)',
  '풀': '풀 (Grass)',
  '비행': '비행 (Flying)',
  '노말': '노말 (Normal)',
  '불꽃': '불꽃 (Fire)'
};

export const ATTRIBUTE_COLORS: Record<PokemonAttribute, string> = {
  '땅': 'text-amber-500 bg-amber-950/40 border-amber-500/30',
  '전기': 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30',
  '물': 'text-blue-400 bg-blue-950/40 border-blue-500/30',
  '에스퍼': 'text-purple-400 bg-purple-950/40 border-purple-500/30',
  '풀': 'text-green-400 bg-green-950/40 border-green-500/30',
  '비행': 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
  '노말': 'text-gray-400 bg-gray-950/40 border-gray-500/30',
  '불꽃': 'text-red-500 bg-red-950/40 border-red-500/30'
};

const ATTRIBUTE_MAPPING: Record<number, PokemonAttribute> = {
  1: '땅',
  2: '전기',
  3: '물',
  4: '에스퍼',
  5: '풀',
  6: '비행',
  7: '노말',
  8: '불꽃'
};

export function getCardAttribute(unitId: number): PokemonAttribute {
  return ATTRIBUTE_MAPPING[unitId] || '노말';
}

const ATTRIBUTE_RELATIONSHIPS: Record<PokemonAttribute, Partial<Record<PokemonAttribute, number>>> = {
  '불꽃': { '풀': 2, '물': 0.5, '불꽃': 0.5 },
  '물': { '불꽃': 2, '땅': 2, '물': 0.5, '풀': 0.5 },
  '풀': { '물': 2, '땅': 2, '불꽃': 0.5, '풀': 0.5, '비행': 0.5 },
  '전기': { '물': 2, '비행': 2, '풀': 0.5, '전기': 0.5, '땅': 0 },
  '땅': { '불꽃': 2, '전기': 2, '풀': 0.5, '비행': 0 },
  '비행': { '풀': 2, '전기': 0.5 },
  '에스퍼': { '노말': 2, '에스퍼': 0.5 },
  '노말': {}
};

export function getAttackMultiplier(attackerUnitId: number, defenderUnitId: number): number {
  const attackerAttr = getCardAttribute(attackerUnitId);
  const defenderAttr = getCardAttribute(defenderUnitId);
  return ATTRIBUTE_RELATIONSHIPS[attackerAttr]?.[defenderAttr] ?? 1.0;
}

export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier >= 2.0) return '효과는 굉장했다! (2.0배) 💥';
  if (multiplier <= 0.0) return '효과가 전혀 없는 것 같다... (0.0배) 💨';
  if (multiplier < 1.0) return '효과가 별로인 듯하다... (0.5배) 🛡️';
  return '';
}

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
  private localQuizSession: any = null;

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
          .on('broadcast', { event: 'session_update' }, ({ payload }: any) => {
            if (payload) {
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
          coins: parsed.coins !== undefined ? parsed.coins : (parsed.unlockedCardIds || []).length * 10,
          claimedQuestIds: parsed.claimedQuestIds || [],
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
          try {
            const parsedLegacy = JSON.parse(legacyData);
            
            const completedUnits: number[] = [];
            const unitHighScores: Record<number, number> = {};
            
            if (parsedLegacy.completedQuizzes) {
              Object.entries(parsedLegacy.completedQuizzes).forEach(([key, val]) => {
                const match = key.match(/unit(\d+)/);
                if (match) {
                  const unitNum = parseInt(match[1], 10);
                  completedUnits.push(unitNum);
                  const legacyScore = typeof val === 'number' ? val : 0;
                  // Scale from 100-pt to 10-pt system (e.g. 100 -> 10, 80 -> 8)
                  unitHighScores[unitNum] = Math.round(legacyScore / 10);
                }
              });
            }
            
            const unlockedCardIds: string[] = [];
            const LEGACY_ID_TO_NAME: Record<number, string> = {
              74: "꼬마돌", 95: "롱스톤", 139: "암스타", 141: "투구푸스", 142: "프테라",
              58: "가디", 171: "랜턴", 25: "피카츄", 181: "전룡", 145: "썬더",
              7: "꼬부기", 54: "고라파덕", 86: "쥬쥬", 131: "라프라스", 382: "가이오가",
              113: "럭키", 63: "캐이시", 64: "윤겔라", 196: "에브이", 150: "뮤츠",
              10: "캐터피", 43: "뚜벅초", 1: "이상해씨", 127: "쁘사이저", 251: "세레비",
              16: "구구", 351: "캐스퐁", 144: "프리져", 148: "신용", 384: "레쿠쟈",
              66: "알통몬", 81: "코일", 106: "시라소몬", 448: "루카리오", 376: "메타그로스",
              23: "아보", 109: "또가스", 88: "질퍽이", 71: "우츠보트", 94: "팬텀"
            };
            
            if (Array.isArray(parsedLegacy.caughtPokemon)) {
              parsedLegacy.caughtPokemon.forEach((legacyId: any) => {
                const name = LEGACY_ID_TO_NAME[Number(legacyId)];
                if (name) {
                  const card = cards.find(c => c.name === name);
                  if (card) {
                    unlockedCardIds.push(card.id);
                  }
                }
              });
            }
            
            this.state.progress = {
              unlockedCardIds,
              completedUnits,
              unitHighScores,
              items: { potion: 3, magnifier: 3, watch: 3 }
            };
            
            if (parsedLegacy.soundEnabled !== undefined) {
              this.state.soundOn = !!parsedLegacy.soundEnabled;
            } else if (parsedLegacy.audioEnabled !== undefined) {
              this.state.soundOn = !!parsedLegacy.audioEnabled;
            }
            
            shouldSaveAfterLoad = true;
            console.log('Successfully migrated legacy game state from v1 to Metaverse progress:', this.state.progress);
          } catch (e) {
            console.error('Failed to migrate legacy state:', e);
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
            items: {
              potion: 3,
              magnifier: 3,
              watch: 3
            }
          };
        }
      }
      if (savedSound !== null) {
        this.state.soundOn = savedSound === 'true';
      }
      if (savedRole !== null) {
        this.state.role = savedRole as any;
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
    if (score >= 8) { // 80점 이상 획득 시 해금
      const cosmeticMap: Record<number, string> = {
        1: 'outfit_explorer',
        2: 'accessory_magnifier',
        3: 'accessory_beaker',
        4: 'outfit_gown',
        5: 'accessory_aura',
        6: 'expression_fire',
        7: 'outfit_spacesuit',
        8: 'outfit_crown',
      };
      const unlockable = cosmeticMap[unitId];
      if (unlockable) {
        this.unlockCosmetic(unlockable);
      }
    }
  }

  unlockCard(cardId: string): boolean {
    const progress = this.state.progress;
    if (!progress.unlockedCardIds.includes(cardId)) {
      progress.unlockedCardIds = [...progress.unlockedCardIds, cardId];
      progress.coins = (progress.coins !== undefined ? progress.coins : (progress.unlockedCardIds.length - 1) * 10) + 30;
      this.save();
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  }

  completeUnit(unitId: number, score: number) {
    const progress = this.state.progress;
    
    if (!progress.completedUnits.includes(unitId)) {
      progress.completedUnits = [...progress.completedUnits, unitId];
    }
    
    const currentHighScore = progress.unitHighScores[unitId] || 0;
    if (score > currentHighScore) {
      progress.unitHighScores = {
        ...progress.unitHighScores,
        [unitId]: score,
      };
    }
    
    progress.coins = (progress.coins !== undefined ? progress.coins : progress.unlockedCardIds.length * 10) + (score * 10);
    this.checkMilestones(unitId, score);
    this.save();
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
    const currentCoins = progress.coins !== undefined ? progress.coins : progress.unlockedCardIds.length * 10;
    
    if (currentCoins >= cost) {
      progress.coins = currentCoins - cost;
      
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

      // Trigger quest update check if necessary
      return true;
    }
    return false;
  }

  claimQuestReward(questId: string, coinReward: number) {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.claimedQuestIds) {
      progress.claimedQuestIds = [];
    }
    if (!progress.claimedQuestIds.includes(questId)) {
      progress.claimedQuestIds = [...progress.claimedQuestIds, questId];
      progress.coins = (progress.coins !== undefined ? progress.coins : progress.unlockedCardIds.length * 10) + coinReward;
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
    
    // Attempt load from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('science_pokedex_player');
      if (saved) {
        try {
          return JSON.parse(saved);
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
      xp: this.state.progress.completedUnits.length * 100,
      level: Math.max(1, Math.floor((this.state.progress.completedUnits.length * 100) / 100) + 1),
      coins: this.state.progress.coins !== undefined ? this.state.progress.coins : this.state.progress.unlockedCardIds.length * 10,
      unlockedCards: this.state.progress.unlockedCardIds,
      unlockedCostumes: this.state.unlockedCosmetics as CostumeId[],
      achievements: []
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

  getCurrentQuizSession(): any {
    return this.localQuizSession;
  }

  setCurrentQuizSession(session: any) {
    this.localQuizSession = session;
  }

  getCostumeInventory(player: Player): CostumeItem[] {
    return costumeCatalog.filter(item => player.unlockedCostumes.includes(item.id));
  }

  checkAchievements(player: Player, event: { type: string; val: number }): Achievement[] {
    const newlyEarned: Achievement[] = [];
    const unlockedCards = this.state.progress.unlockedCardIds;
    const completedUnits = this.state.progress.completedUnits;

    ACHIEVEMENTS_LIST.forEach(ach => {
      if (player.achievements.includes(ach.id)) return;

      let met = false;
      const cond = ach.condition;

      if (cond.type === 'streak' && event.type === 'streak') {
        met = event.val >= cond.count;
      } else if (cond.type === 'unit_complete' && event.type === 'unit_complete') {
        if (cond.unitId === 0) {
          // 특별: 모든 8단원 완료
          met = completedUnits.length >= 8;
        } else {
          met = event.val === cond.unitId;
        }
      } else if (cond.type === 'level' && event.type === 'level') {
        met = event.val >= cond.level;
      } else if (cond.type === 'questions_correct') {
        // 카드 수집 마일스톤 — 해금된 카드 수로 판단
        met = unlockedCards.length >= cond.count;
      } else if (cond.type === 'boss_damage' && event.type === 'boss_damage') {
        met = event.val >= cond.total;
      }

      if (met) {
        newlyEarned.push(ach);

        // 코스튬/타이틀 보상 즉시 지급
        if (ach.reward.type === 'costume') {
          this.unlockCosmetic(ach.reward.costumeId);
        } else if (ach.reward.type === 'coins') {
          const progress = this.state.progress;
          progress.coins = (progress.coins ?? 0) + ach.reward.amount;
        }
      }
    });

    return newlyEarned;
  }

  getCardPower(cardId: string): number {
    const card = cards.find(c => c.id === cardId);
    const basePower = card?.power || card?.attack || 20;
    const level = this.state.progress.cardLevels?.[cardId] || 1;
    return basePower + (level - 1) * 10;
  }

  getCardEvolution(cardId: string, level: number) {
    const card = cards.find(c => c.id === cardId);
    if (!card) {
      return {
        name: '알 수 없음',
        emoji: '❓',
        stage: 1,
        skills: ['몸통박치기']
      };
    }

    const attribute = getCardAttribute(card.unitId);
    
    // Skills mapping based on attribute
    const attributeSkills: Record<string, string[]> = {
      '땅': ['몸통박치기', '모래뿌리기', '지진 🪨'],
      '전기': ['전기자석파', '10만볼트', '번개 ⚡'],
      '물': ['거품', '물대포', '하이드로펌프 💧'],
      '에스퍼': ['명상', '환상빔', '사이코키네시스 🔮'],
      '풀': ['잎날여르기', '덩굴채찍', '솔라빔 🍃'],
      '비행': ['바람일으키기', '에어슬래시', '폭풍 🌪️'],
      '노말': ['몸통박치기', '헤드버트', '기가임팩트 ⚪'],
      '불꽃': ['불꽃세례', '화염방사', '오버히트 🔥']
    };

    const allSkills = attributeSkills[attribute] || attributeSkills['노말'];
    const activeSkills = [allSkills[0]];
    if (level >= 4) activeSkills.push(allSkills[1]);
    if (level >= 8) activeSkills.push(allSkills[2]);

    let evolvedName = card.name;
    let evolvedEmoji = card.image || card.emoji || '❓';
    let stage = 1;

    if (level >= 8) {
      evolvedName = `초강력 ${card.name}`;
      evolvedEmoji = `👑${card.image || card.emoji || '❓'}`;
      stage = 3;
    } else if (level >= 4) {
      evolvedName = `진화한 ${card.name}`;
      evolvedEmoji = `${card.image || card.emoji || '❓'}✨`;
      stage = 2;
    }

    return {
      name: evolvedName,
      emoji: evolvedEmoji,
      stage,
      skills: activeSkills
    };
  }

  gainCardXp(cardIds: string[], amount: number) {
    this.ensureInitialized();
    const progress = this.state.progress;
    if (!progress.cardLevels) progress.cardLevels = {};
    if (!progress.cardXps) progress.cardXps = {};

    let hasLevelUp = false;
    const levelUpCards: string[] = [];

    cardIds.forEach(cardId => {
      if (!progress.unlockedCardIds.includes(cardId)) return;

      const currentXp = progress.cardXps![cardId] || 0;
      const currentLevel = progress.cardLevels![cardId] || 1;

      if (currentLevel >= 10) return;

      const nextXp = currentXp + amount;
      if (nextXp >= 100) {
        progress.cardLevels![cardId] = currentLevel + 1;
        progress.cardXps![cardId] = nextXp - 100;
        hasLevelUp = true;
        levelUpCards.push(cardId);
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
  }

  getTrainerInfo() {
    this.ensureInitialized();
    const progress = this.state.progress;
    
    const cardCount = progress.unlockedCardIds.length;
    let cardLevelsSum = 0;
    if (progress.cardLevels) {
      Object.values(progress.cardLevels).forEach(lvl => {
        cardLevelsSum += (lvl - 1);
      });
    }

    const completedCount = progress.completedUnits.length;
    const trainerXp = (cardCount * 100) + (cardLevelsSum * 50) + (completedCount * 100);
    
    let trainerLevel = 1;
    let rank = '초보 과학 트레이너 ⚪';
    let nextThreshold = 300;
    let prevThreshold = 0;

    if (trainerXp >= 4000) {
      trainerLevel = 6;
      rank = '과학 마스터 챔피언 🏆';
      nextThreshold = 999999;
      prevThreshold = 4000;
    } else if (trainerXp >= 2500) {
      trainerLevel = 5;
      rank = '체육관 관장 트레이너 👑';
      nextThreshold = 4000;
      prevThreshold = 2500;
    } else if (trainerXp >= 1500) {
      trainerLevel = 4;
      rank = '베테랑 과학 트레이너 🔮';
      nextThreshold = 2500;
      prevThreshold = 1500;
    } else if (trainerXp >= 800) {
      trainerLevel = 3;
      rank = '엘리트 과학 트레이너 ⚡';
      nextThreshold = 1500;
      prevThreshold = 800;
    } else if (trainerXp >= 300) {
      trainerLevel = 2;
      rank = '견습 과학 트레이너 🌱';
      nextThreshold = 800;
      prevThreshold = 300;
    }

    progress.trainerLevel = trainerLevel;
    progress.trainerXp = trainerXp;

    return {
      level: trainerLevel,
      xp: trainerXp,
      rank,
      prevThreshold,
      nextThreshold
    };
  }

  calculateCP(
    unlockedCardIds: string[], 
    equippedCosmetics: { outfit: string; expression: string; accessory: string; mount: string; hat?: string; badge?: string; title?: string; petId?: string }
  ): number {
    const PokedexCount = unlockedCardIds.length;
    const unlockedCardsData = cards.filter(c => unlockedCardIds.includes(c.id));
    const sortedPowers = unlockedCardsData
      .map(c => c.power || c.attack || 20)
      .sort((a, b) => b - a);
    const top2Sum = (sortedPowers[0] || 0) + (sortedPowers[1] || 0);

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

    let cardLevelsBonus = 0;
    const progress = this.getProgress();
    if (progress.cardLevels) {
      Object.values(progress.cardLevels).forEach(lvl => {
        cardLevelsBonus += (lvl - 1) * 20;
      });
    }

    return (PokedexCount * 50) + top2Sum + (equippedStatsSum * 10) + cardLevelsBonus;
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
    calculateCP: (
      unlockedCardIds: string[], 
      equippedCosmetics: { outfit: string; expression: string; accessory: string; mount: string; hat?: string; badge?: string; title?: string; petId?: string }
    ) => gameStateManager.calculateCP(unlockedCardIds, equippedCosmetics),
    
    // ── TASK 1D: expose new methods in hook ──
    getLocalPlayer: () => gameStateManager.getLocalPlayer(),
    setLocalPlayer: (player: Player) => gameStateManager.setLocalPlayer(player),
    getCurrentQuizSession: () => gameStateManager.getCurrentQuizSession(),
    setCurrentQuizSession: (session: any) => gameStateManager.setCurrentQuizSession(session),
    getCostumeInventory: (player: Player) => gameStateManager.getCostumeInventory(player),
    checkAchievements: (player: Player, event: { type: string; val: number }) => gameStateManager.checkAchievements(player, event),
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
