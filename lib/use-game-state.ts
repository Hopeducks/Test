import { useState, useEffect } from 'react';
import { gameStateManager } from './game-state';
import type { GameState } from './game-state';
import type { CoinSource } from './economy';
import type { Player, ItemInventory, ClassroomSession, Achievement, StudentResponse } from '../types';

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
    return gameStateManager.subscribe(() => {
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
      studentName: string, unitId: number, score: number, answersCount: number,
      unlockedCards: string[], detailedAnswers: StudentResponse['answers']
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
