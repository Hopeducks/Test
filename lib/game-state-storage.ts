import type { GameState } from './game-state';
import { normalizeLoadedCoins } from './economy';
import { migrateLegacyState } from './legacy-migration';

export function loadGameStateFromStorage(state: GameState): boolean {
  if (typeof window === 'undefined') return false;
  let shouldSave = false;
  try {
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
      state.progress = {
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
      const legacyData = localStorage.getItem('sci_pokedex_game_state_v1');
      if (legacyData) {
        const migrated = migrateLegacyState(legacyData);
        if (migrated) {
          state.progress = { ...migrated.progress } as typeof state.progress;
          if (migrated.soundOn !== undefined) state.soundOn = migrated.soundOn;
          shouldSave = true;
        } else {
          state.progress = { unlockedCardIds: [], completedUnits: [], unitHighScores: {}, items: { potion: 3, magnifier: 3, watch: 3 } };
        }
      } else {
        state.progress = { unlockedCardIds: [], completedUnits: [], unitHighScores: {}, items: { potion: 3, magnifier: 3, watch: 3 } };
      }
    }

    if (savedSound !== null) state.soundOn = savedSound === 'true';
    state.role = savedRole !== null ? (savedRole as typeof state.role) : 'none';
    state.studentName = savedStudentName !== null ? savedStudentName : '';
    state.studentAvatar = savedStudentAvatar !== null ? savedStudentAvatar : '⚡';
    state.classroomStudents = savedClassroomStudents ? JSON.parse(savedClassroomStudents) : [];
    state.classroomSession = savedClassroomSession ? JSON.parse(savedClassroomSession) : null;
    state.unlockedCosmetics = savedUnlockedCosmetics
      ? JSON.parse(savedUnlockedCosmetics)
      : ['outfit_none', 'expression_none', 'accessory_none', 'mount_none'];

    if (savedEquippedCosmetics) {
      const parsed = JSON.parse(savedEquippedCosmetics);
      state.equippedCosmetics = {
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
      state.equippedCosmetics = { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none', hat: 'none', badge: 'none', title: 'none', petId: 'none' };
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
  return shouldSave;
}

export function saveGameStateToStorage(state: GameState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('science_pokedex_progress', JSON.stringify(state.progress));
    localStorage.setItem('science_pokedex_sound', String(state.soundOn));
    localStorage.setItem('science_pokedex_role', state.role);
    localStorage.setItem('science_pokedex_student_name', state.studentName);
    localStorage.setItem('science_pokedex_student_avatar', state.studentAvatar);
    localStorage.setItem('science_pokedex_classroom_students', JSON.stringify(state.classroomStudents));
    localStorage.setItem('science_pokedex_unlocked_cosmetics', JSON.stringify(state.unlockedCosmetics));
    localStorage.setItem('science_pokedex_equipped_cosmetics', JSON.stringify(state.equippedCosmetics));
    if (state.classroomSession) {
      localStorage.setItem('science_pokedex_classroom_session', JSON.stringify(state.classroomSession));
    } else {
      localStorage.removeItem('science_pokedex_classroom_session');
    }
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}
