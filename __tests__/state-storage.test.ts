import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GameState } from '../lib/game-state';
import { loadGameStateFromStorage, saveGameStateToStorage } from '../lib/game-state-storage';
import { migrateLegacyState } from '../lib/legacy-migration';
import { buildLocalPlayer, applyLocalPlayer } from '../lib/player-state';
import { cards } from '../data/cards';
import type { Player } from '../types';

// ── in-memory localStorage mock (vitest env is 'node') ─────────────────────
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string): string | null => (k in store ? store[k] : null),
    setItem: (k: string, v: string): void => { store[k] = String(v); },
    removeItem: (k: string): void => { delete store[k]; },
    clear: (): void => { store = {}; },
    _dump: (): Record<string, string> => ({ ...store }),
  };
}

let ls: ReturnType<typeof createLocalStorageMock>;
const dispatchSpy = vi.fn();

beforeEach(() => {
  ls = createLocalStorageMock();
  (globalThis as Record<string, unknown>).localStorage = ls;
  (globalThis as Record<string, unknown>).window = { dispatchEvent: dispatchSpy, localStorage: ls };
  if (typeof (globalThis as Record<string, unknown>).CustomEvent === 'undefined') {
    (globalThis as Record<string, unknown>).CustomEvent = class {
      type: string;
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) { this.type = type; this.detail = init?.detail; }
    };
  }
  dispatchSpy.mockClear();
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).localStorage;
  delete (globalThis as Record<string, unknown>).window;
});

function makeState(): GameState {
  return {
    progress: { unlockedCardIds: [], completedUnits: [], unitHighScores: {}, items: { potion: 3, magnifier: 3, watch: 3 } },
    soundOn: true,
    role: 'none',
    studentName: '',
    studentAvatar: '⚡',
    classroomStudents: [],
    classroomSession: null,
    unlockedCosmetics: [],
    equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none', hat: 'none', badge: 'none', title: 'none', petId: 'none' },
  };
}

// ── migrateLegacyState (pure) ──────────────────────────────────────────────
describe('migrateLegacyState', () => {
  it('잘못된 JSON 문자열 → null 반환', () => {
    expect(migrateLegacyState('{not valid json')).toBeNull();
  });

  it('빈 객체 → 빈 진행도 반환', () => {
    const result = migrateLegacyState(JSON.stringify({}));
    expect(result).not.toBeNull();
    expect(result!.progress.completedUnits).toEqual([]);
    expect(result!.progress.unlockedCardIds).toEqual([]);
    expect(result!.progress.items).toEqual({ potion: 3, magnifier: 3, watch: 3 });
  });

  it('completedQuizzes → completedUnits + unitHighScores(점수/10 반올림)', () => {
    const result = migrateLegacyState(JSON.stringify({ completedQuizzes: { unit1: 80, unit3: 95 } }));
    expect(result!.progress.completedUnits.sort()).toEqual([1, 3]);
    expect(result!.progress.unitHighScores[1]).toBe(8);
    expect(result!.progress.unitHighScores[3]).toBe(10); // round(95/10)=10
  });

  it('숫자가 아닌 점수 → 0점 처리', () => {
    const result = migrateLegacyState(JSON.stringify({ completedQuizzes: { unit2: 'oops' } }));
    expect(result!.progress.unitHighScores[2]).toBe(0);
  });

  it('caughtPokemon 레거시 ID → 매핑되는 카드 ID 잠금해제', () => {
    // 25=피카츄가 카탈로그에 존재한다면 카드 ID로 변환됨
    const pikachu = cards.find(c => c.name === '피카츄');
    const result = migrateLegacyState(JSON.stringify({ caughtPokemon: [25] }));
    if (pikachu) {
      expect(result!.progress.unlockedCardIds).toContain(pikachu.id);
    } else {
      expect(result!.progress.unlockedCardIds).toEqual([]);
    }
  });

  it('매핑 테이블에 없는 레거시 ID → 무시', () => {
    const result = migrateLegacyState(JSON.stringify({ caughtPokemon: [999999] }));
    expect(result!.progress.unlockedCardIds).toEqual([]);
  });

  it('soundEnabled → soundOn 변환', () => {
    expect(migrateLegacyState(JSON.stringify({ soundEnabled: false }))!.soundOn).toBe(false);
    expect(migrateLegacyState(JSON.stringify({ soundEnabled: true }))!.soundOn).toBe(true);
  });

  it('audioEnabled 폴백 → soundOn 변환', () => {
    expect(migrateLegacyState(JSON.stringify({ audioEnabled: 1 }))!.soundOn).toBe(true);
  });

  it('사운드 필드 없으면 soundOn undefined', () => {
    expect(migrateLegacyState(JSON.stringify({}))!.soundOn).toBeUndefined();
  });
});

// ── saveGameStateToStorage / loadGameStateFromStorage ──────────────────────
describe('saveGameStateToStorage', () => {
  it('주요 상태를 localStorage에 직렬화한다', () => {
    const state = makeState();
    state.studentName = '홍길동';
    state.role = 'student';
    state.progress.coins = 42;
    saveGameStateToStorage(state);
    expect(ls.getItem('science_pokedex_student_name')).toBe('홍길동');
    expect(ls.getItem('science_pokedex_role')).toBe('student');
    expect(JSON.parse(ls.getItem('science_pokedex_progress')!).coins).toBe(42);
  });

  it('classroomSession이 null이면 키를 제거한다', () => {
    const state = makeState();
    ls.setItem('science_pokedex_classroom_session', '{"old":true}');
    saveGameStateToStorage(state);
    expect(ls.getItem('science_pokedex_classroom_session')).toBeNull();
  });

  it('classroomSession이 있으면 직렬화한다', () => {
    const state = makeState();
    state.classroomSession = { code: 'ABC' } as GameState['classroomSession'];
    saveGameStateToStorage(state);
    expect(JSON.parse(ls.getItem('science_pokedex_classroom_session')!).code).toBe('ABC');
  });
});

describe('loadGameStateFromStorage', () => {
  it('저장된 진행도가 없으면 기본 진행도로 초기화하고 shouldSave=false', () => {
    const state = makeState();
    const shouldSave = loadGameStateFromStorage(state);
    expect(shouldSave).toBe(false);
    expect(state.progress.unlockedCardIds).toEqual([]);
    expect(state.role).toBe('none');
    expect(state.unlockedCosmetics).toContain('outfit_none');
  });

  it('save → load 라운드트립으로 진행도가 복원된다', () => {
    const saved = makeState();
    saved.studentName = '학생A';
    saved.studentAvatar = '🔥';
    saved.role = 'student';
    saved.progress.unlockedCardIds = ['u1_c1'];
    saved.progress.completedUnits = [1, 2];
    saved.progress.coins = 100;
    saveGameStateToStorage(saved);

    const loaded = makeState();
    loadGameStateFromStorage(loaded);
    expect(loaded.studentName).toBe('학생A');
    expect(loaded.studentAvatar).toBe('🔥');
    expect(loaded.role).toBe('student');
    expect(loaded.progress.unlockedCardIds).toEqual(['u1_c1']);
    expect(loaded.progress.completedUnits).toEqual([1, 2]);
    expect(loaded.progress.coins).toBe(100);
  });

  it('items 기본값(potion/magnifier/watch=3)을 채운다', () => {
    ls.setItem('science_pokedex_progress', JSON.stringify({ unlockedCardIds: [] }));
    const state = makeState();
    loadGameStateFromStorage(state);
    expect(state.progress.items!.potion).toBe(3);
    expect(state.progress.items!.magnifier).toBe(3);
    expect(state.progress.items!.watch).toBe(3);
    expect(state.progress.items!.superBall).toBe(0);
  });

  it('레거시 데이터만 있으면 마이그레이션하고 shouldSave=true', () => {
    ls.setItem('sci_pokedex_game_state_v1', JSON.stringify({ completedQuizzes: { unit1: 90 } }));
    const state = makeState();
    const shouldSave = loadGameStateFromStorage(state);
    expect(shouldSave).toBe(true);
    expect(state.progress.completedUnits).toEqual([1]);
  });

  it('손상된 레거시 데이터 → 기본 진행도 폴백, shouldSave=false', () => {
    ls.setItem('sci_pokedex_game_state_v1', '{broken');
    const state = makeState();
    const shouldSave = loadGameStateFromStorage(state);
    expect(shouldSave).toBe(false);
    expect(state.progress.completedUnits).toEqual([]);
  });

  it('저장된 장착 코스튬을 복원한다', () => {
    ls.setItem('science_pokedex_equipped_cosmetics', JSON.stringify({ outfit: 'spacesuit', hat: 'crown' }));
    const state = makeState();
    loadGameStateFromStorage(state);
    expect(state.equippedCosmetics.outfit).toBe('spacesuit');
    expect(state.equippedCosmetics.hat).toBe('crown');
    expect(state.equippedCosmetics.badge).toBe('none'); // 누락 필드 기본값
  });

  it('sound 키가 "false"면 soundOn=false', () => {
    ls.setItem('science_pokedex_sound', 'false');
    const state = makeState();
    loadGameStateFromStorage(state);
    expect(state.soundOn).toBe(false);
  });
});

// ── buildLocalPlayer / applyLocalPlayer ────────────────────────────────────
describe('buildLocalPlayer', () => {
  const getCoins = () => 77;

  it('저장된 플레이어가 없으면 기본 플레이어를 생성한다', () => {
    const state = makeState();
    state.studentName = '챔피언';
    const player = buildLocalPlayer(state, getCoins);
    expect(player.nickname).toBe('챔피언');
    expect(player.coins).toBe(77);
    expect(player.position).toEqual({ x: 400, y: 300 });
    expect(typeof player.level).toBe('number');
  });

  it('이름이 비어있으면 기본 닉네임 "학생"', () => {
    const player = buildLocalPlayer(makeState(), getCoins);
    expect(player.nickname).toBe('학생');
  });

  it('저장된 플레이어가 있으면 level/xp/coins를 파생값으로 덮어쓴다', () => {
    ls.setItem('science_pokedex_player', JSON.stringify({
      id: 'saved-id', nickname: '복귀학생', sessionCode: 'ZZ',
      avatar: { bodyColor: '#000', outfit: null, accessory: null, vehicle: null, hat: null, badge: null, title: null, emote: null, petId: null },
      position: { x: 1, y: 1 }, xp: 99999, level: 999, coins: 0,
      unlockedCards: [], unlockedCostumes: [], achievements: [],
    }));
    const state = makeState();
    const player = buildLocalPlayer(state, getCoins);
    expect(player.id).toBe('saved-id');
    expect(player.coins).toBe(77);       // getCoins()로 덮어씀
    expect(player.level).not.toBe(999);  // 파생값으로 덮어씀
  });

  it('손상된 저장 플레이어 → 기본 플레이어 폴백', () => {
    ls.setItem('science_pokedex_player', '{corrupt');
    const player = buildLocalPlayer(makeState(), getCoins);
    expect(player.coins).toBe(77);
    expect(player.position).toEqual({ x: 400, y: 300 });
  });
});

describe('applyLocalPlayer', () => {
  it('플레이어를 저장하고 상태/코스튬을 반영하며 save+이벤트를 호출한다', () => {
    const state = makeState();
    const save = vi.fn();
    const player: Player = {
      id: 'p1', nickname: '새이름', sessionCode: 'SC1',
      avatar: { bodyColor: '#fff', outfit: 'spacesuit', accessory: 'glasses', vehicle: 'board', hat: 'cap', badge: 'star', title: 'master', emote: 'wave', petId: 'pet1' },
      position: { x: 0, y: 0 }, xp: 10, level: 2, coins: 50,
      unlockedCards: ['u1_c1'], unlockedCostumes: ['spacesuit'], achievements: [],
    };
    applyLocalPlayer(state, player, save);

    expect(state.studentName).toBe('새이름');
    expect(state.equippedCosmetics.outfit).toBe('spacesuit');
    expect(state.equippedCosmetics.expression).toBe('wave'); // emote → expression
    expect(state.equippedCosmetics.petId).toBe('pet1');
    expect(state.progress.unlockedCardIds).toEqual(['u1_c1']);
    expect(state.progress.coins).toBe(50);
    expect(ls.getItem('app.player_id')).toBe('p1');
    expect(ls.getItem('app.session_code')).toBe('SC1');
    expect(save).toHaveBeenCalledOnce();
    expect(dispatchSpy).toHaveBeenCalledOnce();
  });

  it('null 코스튬 필드는 "none"으로 정규화된다', () => {
    const state = makeState();
    const player: Player = {
      id: 'p2', nickname: 'x', sessionCode: '',
      avatar: { bodyColor: '#fff', outfit: null, accessory: null, vehicle: null, hat: null, badge: null, title: null, emote: null, petId: null },
      position: { x: 0, y: 0 }, xp: 0, level: 1, coins: 0,
      unlockedCards: [], unlockedCostumes: [], achievements: [],
    };
    applyLocalPlayer(state, player, vi.fn());
    expect(state.equippedCosmetics.outfit).toBe('none');
    expect(state.equippedCosmetics.mount).toBe('none');
    expect(state.equippedCosmetics.title).toBe('none');
  });
});
