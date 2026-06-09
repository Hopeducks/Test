'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameState, getAttackMultiplier } from '../../lib/game-state';
import { cards } from '../../data/cards';
import { questions } from '../../data/questions';
import { selectQuestions } from '../../lib/question-pool';
import { costumeCatalog } from '../../data/costume-catalog';
import { gameAudio } from '../../lib/audio';
import { supabase } from '../../lib/supabase-client';
import { Question, MCQuestion } from '../../types';
import {
  BattleMode,
  RoundWins,
  determineBattleOutcome,
  shouldEndBattle,
  updateRoundWins,
} from '../../lib/battle-engine';
import { BattleCard, mapToBattleCard } from './battle/battle-card';
import MatchmakingScreen from './battle/MatchmakingScreen';
import DeckSelectScreen from './battle/DeckSelectScreen';
import BattleCombatScreen from './battle/BattleCombatScreen';
import BattleResultScreen from './battle/BattleResultScreen';

interface CardBattleArenaProps {
  onBack: () => void;
}

// Detect E2E mode once (URL param ?e2e=battle accelerates all timers)
const isE2EMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('e2e') === 'battle';

const TIMINGS = {
  cardSelect: isE2EMode ? 3 : 5,     // seconds for card select phase (3 ticks × 100ms = 300ms in E2E)
  quiz: isE2EMode ? 3 : 10,          // seconds for quiz phase (3 ticks × 100ms = 300ms in E2E)
  resolve: isE2EMode ? 300 : 3000,   // ms delay between rounds
  ai: isE2EMode ? 100 : 2500,        // ms for AI opponent to appear
  countdown: isE2EMode ? 200 : 1000, // ms per countdown tick
  special: isE2EMode ? 150 : 1500,   // ms for special effect + quiz→resolve
  tick: isE2EMode ? 100 : 1000,      // ms per timer decrement tick
} as const;

export default function CardBattleArena({ onBack }: CardBattleArenaProps) {
  const {
    progress,
    studentName,
    studentAvatar,
    equippedCosmetics,
    classroomSession,
    getLocalPlayer,
    setLocalPlayer,
    gainCardXp,
    useItem,
    incrementDailyStat,
  } = useGameState();

  // Sum stats of equipped items
  const playerStats = useMemo(() => {
    let hp = 0;
    let attack = 0;
    let defense = 0;

    const itemsToSum = [
      equippedCosmetics.outfit,
      equippedCosmetics.accessory,
      equippedCosmetics.mount,
      equippedCosmetics.hat,
    ];

    itemsToSum.forEach(itemId => {
      if (!itemId || itemId === 'none') return;
      const item = costumeCatalog.find(c => c.id === itemId);
      if (item && item.stats) {
        hp += item.stats.hp || 0;
        attack += item.stats.attack || 0;
        defense += item.stats.defense || 0;
      }
    });

    return { hp, attack, defense };
  }, [equippedCosmetics]);

  // Phase of screen routing: 'matchmaking' | 'deck_select' | 'battle' | 'results'
  const [phase, setPhase] = useState<'matchmaking' | 'deck_select' | 'battle' | 'results'>('matchmaking');

  // Matchmaking states
  const [opponent, setOpponent] = useState<{ name: string; avatar: string; level: number } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAI, setIsAI] = useState(false);

  const opponentStats = useMemo(() => {
    if (!opponent) return { hp: 0, attack: 0, defense: 0 };
    const lvl = opponent.level || 1;
    return {
      hp: (lvl - 1) * 15,
      attack: (lvl - 1) * 3,
      defense: (lvl - 1) * 2,
    };
  }, [opponent]);

  // Deck Selection states
  const [deck, setDeck] = useState<BattleCard[]>([]);
  const [tempSelectedCards, setTempSelectedCards] = useState<string[]>([]);

  // Battle mode
  const [battleMode, setBattleMode] = useState<BattleMode>('standard');
  const [roundWins, setRoundWins] = useState<RoundWins>({ player: 0, opponent: 0 });

  // Battle states
  const [playerHp, setPlayerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [round, setRound] = useState(1);
  const [roundsHistory, setRoundsHistory] = useState<Array<{ winner: 'player' | 'opponent' | 'draw'; pCard: BattleCard; oCard: BattleCard }>>([]);

  // Round flow phases: 'card_select' | 'quiz' | 'resolve'
  const [roundPhase, setRoundPhase] = useState<'card_select' | 'quiz' | 'resolve'>('card_select');
  const [roundTimer, setRoundTimer] = useState<number>(TIMINGS.cardSelect);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [opponentSelectedCardId, setOpponentSelectedCardId] = useState<string | null>(null);
  const [usedPlayerCardIds, setUsedPlayerCardIds] = useState<string[]>([]);
  const [usedOpponentCardIds, setUsedOpponentCardIds] = useState<string[]>([]);

  // Quiz states in battle
  const [quizQuestion, setQuizQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);
  const [playerCorrect, setPlayerCorrect] = useState<boolean | null>(null);
  const [opponentCorrect, setOpponentCorrect] = useState<boolean | null>(null);

  // Visual animation effects
  const [specialEffectText, setSpecialEffectText] = useState<string | null>(null);
  const [flashScreen, setFlashScreen] = useState(false);
  const [showFossilParticles, setShowFossilParticles] = useState(false);
  const [showDnaVortex, setShowDnaVortex] = useState(false);
  const [damagePopup, setDamagePopup] = useState<{ player: number | null; opponent: number | null }>({ player: null, opponent: null });
  const [screenShake, setScreenShake] = useState(false);

  // End outcome
  const [battleOutcome, setBattleOutcome] = useState<'victory' | 'defeat' | 'draw'>('victory');
  const [awardedXp, setAwardedXp] = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const battleChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Guards against double-firing endBattle (e.g., opponent forfeit arriving during normal end)
  const battleEndedRef = useRef(false);
  // Current HP readable inside setTimeout callbacks without stale closure
  const playerHpRef = useRef(100);
  const opponentHpRef = useRef(100);
  // Current round wins / mode readable inside callbacks
  const roundWinsRef = useRef<RoundWins>({ player: 0, opponent: 0 });
  const battleModeRef = useRef<BattleMode>('standard');
  // Tracked timeouts for cleanup on unmount
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep refs in sync with state
  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { opponentHpRef.current = opponentHp; }, [opponentHp]);
  useEffect(() => { roundWinsRef.current = roundWins; }, [roundWins]);
  useEffect(() => { battleModeRef.current = battleMode; }, [battleMode]);

  // Clear all pending timers on unmount
  useEffect(() => () => { pendingTimers.current.forEach(clearTimeout); }, []);

  // Helper: tracked setTimeout (auto-removes itself from list on fire)
  const addTimer = (fn: () => void, delay: number): ReturnType<typeof setTimeout> => {
    const id = setTimeout(() => {
      pendingTimers.current = pendingTimers.current.filter(t => t !== id);
      fn();
    }, delay);
    pendingTimers.current.push(id);
    return id;
  };

  // 10 strongest cards unlocked by player
  const top10UnlockedCards = useMemo(() => {
    const unlocked = cards.filter(c => progress.unlockedCardIds.includes(c.id));
    const fallbackIds = ['u1_c1', 'u1_c3', 'u2_c2', 'u3_c1', 'u4_c3', 'u5_c2', 'u6_c1', 'u7_c2', 'u8_c3'];
    const available = unlocked.length > 0 ? unlocked : cards.filter(c => fallbackIds.includes(c.id));
    return available
      .map(c => mapToBattleCard(c, progress.cardLevels))
      .sort((a, b) => b.power - a.power)
      .slice(0, 10);
  }, [progress.unlockedCardIds, progress.cardLevels]);

  const hasEnoughCards = top10UnlockedCards.length >= 3;

  const activeClassroomMatch = useMemo(() => {
    if (!classroomSession) return null;
    return classroomSession.activeBattles?.find(
      b => (b.player1 === studentName || b.player2 === studentName) && b.status === 'fighting'
    );
  }, [classroomSession, studentName]);

  // ── Supabase battle channel ──────────────────────────────────────────────
  useEffect(() => {
    const sessionCode = classroomSession?.code;
    if (!sessionCode || isAI) return;

    const channelId = `battle_session_${sessionCode}`;
    const channel = supabase.channel(channelId);
    battleChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'battle_card_selected' }, ({ payload }: { payload: { playerId: string; cardId?: string | null } }) => {
        if (payload.playerId !== studentName) {
          setOpponentSelectedCardId(payload.cardId ?? null);
        }
      })
      .on('broadcast', { event: 'battle_round_result' }, ({ payload }: { payload: Record<string, unknown> }) => {
        void payload; // acknowledged
      })
      .on('broadcast', { event: 'battle_end' }, ({ payload }: { payload: { playerId: string; outcome?: string } }) => {
        // Opponent disconnected or forfeited — award forfeit win
        if (payload.playerId !== studentName && !battleEndedRef.current) {
          endBattle(playerHpRef.current, 0);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      battleChannelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomSession?.code, isAI, studentName]);

  // ── Broadcast helpers ────────────────────────────────────────────────────
  const broadcastCardSelected = (cardId: string) => {
    const ch = battleChannelRef.current;
    if (!ch || isAI) return;
    ch.send({ type: 'broadcast', event: 'battle_card_selected', payload: { playerId: studentName, cardId, round, timestamp: Date.now() } });
  };

  const broadcastRoundResult = (
    pCardId: string, oCardId: string,
    nextPlayerHp: number, nextOpponentHp: number,
    roundWinner: 'player' | 'opponent' | 'draw'
  ) => {
    const ch = battleChannelRef.current;
    if (!ch || isAI) return;
    ch.send({ type: 'broadcast', event: 'battle_round_result', payload: { playerId: studentName, round, playerCard: pCardId, opponentCard: oCardId, playerHp: nextPlayerHp, opponentHp: nextOpponentHp, roundWinner, timestamp: Date.now() } });
  };

  const broadcastBattleEnd = (outcome: 'victory' | 'defeat' | 'draw') => {
    const ch = battleChannelRef.current;
    if (!ch || isAI) return;
    ch.send({ type: 'broadcast', event: 'battle_end', payload: { playerId: studentName, outcome, timestamp: Date.now() } });
  };

  // ── Matchmaking ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'matchmaking') return;
    gameAudio.playClick();

    if (activeClassroomMatch) {
      const oppName = activeClassroomMatch.player1 === studentName ? activeClassroomMatch.player2 : activeClassroomMatch.player1;
      const oppInfo = classroomSession?.students.find(s => s.name === oppName);
      setOpponent({ name: oppName, avatar: oppInfo?.avatar || '👾', level: Math.max(1, Math.floor((oppInfo?.currentScore || 0) / 2) + 1) });
      setIsAI(false);
      triggerCountdown();
      return;
    }

    const aiTimer = setTimeout(() => {
      const botNames = ['아인슈타인 꿈나무', '마리 퀴리 주니어', '리틀 뉴턴', '갈릴레이 워너비', '코페르니쿠스 키드'];
      const botAvatars = ['🧑‍🔬', '👩‍🔬', '🧙‍♂️', '🧑‍🚀', '🦖', '🦁'];
      setOpponent({ name: botNames[Math.floor(Math.random() * botNames.length)], avatar: botAvatars[Math.floor(Math.random() * botAvatars.length)], level: Math.floor(Math.random() * 4) + 1 });
      setIsAI(true);
      triggerCountdown();
    }, TIMINGS.ai);

    return () => clearTimeout(aiTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeClassroomMatch]);

  const triggerCountdown = () => setCountdown(3);

  // Countdown loop
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setPhase('deck_select');
      return;
    }
    const timer = setTimeout(() => {
      gameAudio.playClick();
      setCountdown(countdown - 1);
    }, TIMINGS.countdown);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── E2E auto-deck: select first 3 cards and confirm immediately ──────────
  useEffect(() => {
    if (!isE2EMode || phase !== 'deck_select') return;
    if (tempSelectedCards.length === 0 && top10UnlockedCards.length >= 3) {
      setTempSelectedCards(top10UnlockedCards.slice(0, 3).map(c => c.id));
    }
  }, [phase, top10UnlockedCards, tempSelectedCards.length]);

  useEffect(() => {
    if (!isE2EMode || phase !== 'deck_select' || tempSelectedCards.length !== 3) return;
    const id = addTimer(() => {
      const chosen = top10UnlockedCards.filter(c => tempSelectedCards.includes(c.id));
      if (chosen.length < 3) return;
      setDeck(chosen);
      setPlayerHp(100 + playerStats.hp);
      setOpponentHp(100 + opponentStats.hp);
      setRound(1);
      setRoundsHistory([]);
      setUsedPlayerCardIds([]);
      setUsedOpponentCardIds([]);
      setSelectedCardId(null);
      setOpponentSelectedCardId(null);
      battleEndedRef.current = false;
      roundWinsRef.current = { player: 0, opponent: 0 };
      setRoundWins({ player: 0, opponent: 0 });
      setPhase('battle');
      startRoundSelection();
    }, 600);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tempSelectedCards.length]);

  // ── Deck selection ───────────────────────────────────────────────────────
  const handleToggleCardSelection = (cardId: string) => {
    if (tempSelectedCards.includes(cardId)) {
      setTempSelectedCards(prev => prev.filter(id => id !== cardId));
    } else {
      if (tempSelectedCards.length >= 3) return;
      setTempSelectedCards(prev => [...prev, cardId]);
    }
    gameAudio.playClick();
  };

  const handleConfirmDeck = () => {
    if (tempSelectedCards.length !== 3) return;
    const chosen = top10UnlockedCards.filter(c => tempSelectedCards.includes(c.id));
    setDeck(chosen);
    setPlayerHp(100 + playerStats.hp);
    setOpponentHp(100 + opponentStats.hp);
    setRound(1);
    setRoundsHistory([]);
    setUsedPlayerCardIds([]);
    setUsedOpponentCardIds([]);
    setSelectedCardId(null);
    setOpponentSelectedCardId(null);
    battleEndedRef.current = false;
    roundWinsRef.current = { player: 0, opponent: 0 };
    setRoundWins({ player: 0, opponent: 0 });
    setPhase('battle');
    startRoundSelection();
  };

  const handleUseHealItem = (itemType: 'potion' | 'potionHyper' | 'potionMax' | 'revive') => {
    const maxPlayerHp = 100 + playerStats.hp;
    if (playerHp >= maxPlayerHp && itemType !== 'revive') { alert('체력이 이미 가득 차 있습니다!'); return; }
    if (itemType === 'revive' && playerHp > 30) { alert('기력의조각은 체력이 30 이하일 때만 사용할 수 있습니다!'); return; }
    const success = useItem(itemType);
    if (!success) { alert('치료제 아이템이 부족합니다!'); return; }
    gameAudio.playCatchSuccess();
    let healAmount = 0;
    if (itemType === 'potion') healAmount = 30;
    else if (itemType === 'potionHyper') healAmount = 60;
    else if (itemType === 'potionMax') healAmount = maxPlayerHp;
    else if (itemType === 'revive') healAmount = 50;
    setPlayerHp(prev => Math.min(maxPlayerHp, prev + healAmount));
  };

  // ── Round loop ───────────────────────────────────────────────────────────
  const startRoundSelection = () => {
    setRoundPhase('card_select');
    setSelectedCardId(null);
    setOpponentSelectedCardId(null);
    setRoundTimer(TIMINGS.cardSelect);
    setPlayerCorrect(null);
    setOpponentCorrect(null);
    setSelectedOption(null);
    setIsQuizAnswered(false);
    setDamagePopup({ player: null, opponent: null });
  };

  // Main battle timer tick
  useEffect(() => {
    if (phase !== 'battle') return;

    if (roundTimer <= 0) {
      if (roundPhase === 'card_select') {
        // Auto-select if player didn't pick
        const available = deck.filter(c => !usedPlayerCardIds.includes(c.id));
        const autoCard = selectedCardId || available[0]?.id || null;
        if (autoCard) setSelectedCardId(autoCard);

        // Opponent picks
        const oppAvailable = cards.map(c => mapToBattleCard(c, {})).filter(c => !usedOpponentCardIds.includes(c.id));
        const oppCard = oppAvailable[Math.floor(Math.random() * oppAvailable.length)] || oppAvailable[0];
        setOpponentSelectedCardId(oppCard.id);

        // Move to quiz
        setRoundPhase('quiz');
        setRoundTimer(TIMINGS.quiz);

        // Setup quiz question using active session filter (no hardcoded fallback)
        const unitId = classroomSession?.activeUnitId ?? 1;
        const { questions: battlePool } = selectQuestions({
          unitIds: [unitId],
          standardCodes: classroomSession?.selectedStandardCodes,
          gradeLevels: classroomSession?.gradeFilter,
          difficulties: classroomSession?.difficultyFilter,
          count: 20,
        });
        const pool = battlePool.length > 0 ? battlePool : questions;
        setQuizQuestion(pool[Math.floor(Math.random() * pool.length)]);

      } else if (roundPhase === 'quiz') {
        if (!isQuizAnswered) handleQuizAnswerSubmit(-1);
      }
      return;
    }

    const t = setTimeout(() => setRoundTimer(prev => prev - 1), TIMINGS.tick);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundTimer, roundPhase, phase]);

  const handleSelectRoundCard = (cardId: string) => {
    if (roundPhase !== 'card_select' || usedPlayerCardIds.includes(cardId)) return;
    setSelectedCardId(cardId);
    gameAudio.playClick();
    broadcastCardSelected(cardId);
  };

  const handleQuizAnswerSubmit = (optionIndex: number) => {
    if (isQuizAnswered || !quizQuestion) return;
    setSelectedOption(optionIndex);
    setIsQuizAnswered(true);
    const correct = optionIndex === (quizQuestion as MCQuestion).correctIndex;
    setPlayerCorrect(correct);
    if (correct) gameAudio.playCorrect(); else gameAudio.playWrong();
    const oppCorrect = Math.random() < 0.75;
    setOpponentCorrect(oppCorrect);
    addTimer(() => resolveRoundCombat(correct, oppCorrect), TIMINGS.special);
  };

  const resolveRoundCombat = (pCorrect: boolean, oCorrect: boolean) => {
    setRoundPhase('resolve');

    const pCard = deck.find(c => c.id === selectedCardId)!;
    const oppLevels = cards.reduce((acc, curr) => { acc[curr.id] = opponent?.level || 1; return acc; }, {} as Record<string, number>);
    const allAvailableOpp = cards.map(c => mapToBattleCard(c, oppLevels));
    const oCard = allAvailableOpp.find(c => c.id === opponentSelectedCardId) || allAvailableOpp[0];

    setUsedPlayerCardIds(prev => [...prev, pCard.id]);
    setUsedOpponentCardIds(prev => [...prev, oCard.id]);

    let pPower = pCard.power;
    if (pCorrect) pPower = Math.round(pPower * 1.5);
    let oPower = oCard.power;
    if (oCorrect) oPower = Math.round(oPower * 1.5);

    const pMultiplier = getAttackMultiplier(pCard.unitId, oCard.unitId);
    const oMultiplier = getAttackMultiplier(oCard.unitId, pCard.unitId);
    pPower = Math.round(pPower * pMultiplier);
    oPower = Math.round(oPower * oMultiplier);

    let effectDelay = 0;
    if (pCard.rarity === 'legendary') {
      effectDelay = isE2EMode ? 50 : 1500;
      triggerSpecialEffect(pCard.specialEffect || 'DNA 소용돌이!');
    }
    if (oCard.rarity === 'legendary') {
      effectDelay = Math.max(effectDelay, isE2EMode ? 50 : 1500);
      triggerSpecialEffect(oCard.specialEffect || 'DNA 소용돌이!');
    }

    addTimer(() => {
      const pDmg = pMultiplier === 0 ? 0 : Math.max(5, Math.round(pPower + playerStats.attack - (oCard.defense + opponentStats.defense)));
      const oDmg = oMultiplier === 0 ? 0 : Math.max(5, Math.round(oPower + opponentStats.attack - (pCard.defense + playerStats.defense)));

      if (pDmg > 0 || oDmg > 0) {
        setScreenShake(true);
        gameAudio.playBattleHit();
        addTimer(() => setScreenShake(false), 500);
      }

      setDamagePopup({ player: oDmg, opponent: pDmg });

      const nextPlayerHp = Math.max(0, playerHpRef.current - oDmg);
      const nextOpponentHp = Math.max(0, opponentHpRef.current - pDmg);
      setPlayerHp(nextPlayerHp);
      setOpponentHp(nextOpponentHp);

      const roundWinner: 'player' | 'opponent' | 'draw' =
        pDmg > oDmg ? 'player' : oDmg > pDmg ? 'opponent' : 'draw';

      setRoundsHistory(prev => [...prev, { winner: roundWinner, pCard, oCard }]);
      broadcastRoundResult(pCard.id, oCard.id, nextPlayerHp, nextOpponentHp, roundWinner);

      // Update round wins for bestof3
      const newRoundWins = updateRoundWins(roundWinsRef.current, roundWinner);
      if (battleModeRef.current === 'bestof3') {
        roundWinsRef.current = newRoundWins;
        setRoundWins(newRoundWins);
      }

      addTimer(() => {
        // Use `round` captured at resolveRoundCombat call time (current round number, not stale)
        if (shouldEndBattle(battleModeRef.current, newRoundWins, round, nextPlayerHp, nextOpponentHp)) {
          endBattle(nextPlayerHp, nextOpponentHp);
        } else {
          setRound(r => r + 1);
          startRoundSelection();
        }
      }, TIMINGS.resolve);

    }, effectDelay);
  };

  const triggerSpecialEffect = (effect: string) => {
    setSpecialEffectText(effect);
    gameAudio.playCatchSuccess();
    if (effect === '번개 섬광!') {
      setFlashScreen(true);
      addTimer(() => setFlashScreen(false), isE2EMode ? 100 : 1000);
    } else if (effect === '화석 폭발!') {
      setShowFossilParticles(true);
      addTimer(() => setShowFossilParticles(false), isE2EMode ? 100 : 1200);
    } else {
      setShowDnaVortex(true);
      addTimer(() => setShowDnaVortex(false), isE2EMode ? 100 : 1200);
    }
    addTimer(() => setSpecialEffectText(null), TIMINGS.special);
  };

  const endBattle = async (finalPlayerHp: number, finalOppHp: number) => {
    if (battleEndedRef.current) return;
    battleEndedRef.current = true;

    const outcome = determineBattleOutcome(
      battleModeRef.current,
      finalPlayerHp,
      finalOppHp,
      roundWinsRef.current
    );

    const xpGain = outcome === 'victory' ? 45 : outcome === 'draw' ? 25 : 15;
    setBattleOutcome(outcome);
    setAwardedXp(xpGain);

    if (outcome === 'victory') gameAudio.playBattleWin();
    else if (outcome === 'defeat') gameAudio.playWrong();

    broadcastBattleEnd(outcome);

    const deckCardIds = deck.map(c => c.id);
    if (deckCardIds.length > 0) gainCardXp(deckCardIds, xpGain);
    incrementDailyStat('battlesPlayed');

    try {
      await supabase.from('battle_results').insert({
        player_name: studentName,
        opponent_name: opponent?.name || 'AI 상대',
        outcome,
        rounds_won: roundsHistory.filter(r => r.winner === 'player').length,
        rounds_lost: roundsHistory.filter(r => r.winner === 'opponent').length,
        awarded_coins: xpGain,
      });
    } catch {
      // Supabase offline — non-fatal
    }

    setPhase('results');
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 py-4 relative font-sans text-gray-100 ${screenShake ? 'animate-shake' : ''}`}>

      {flashScreen && <div className="fixed inset-0 bg-white z-50 animate-flash-overlay pointer-events-none" />}

      {showFossilParticles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => {
            const rx = (Math.random() - 0.5) * 400;
            const ry = (Math.random() - 0.5) * 400;
            return (
              <div key={i} className="absolute w-4 h-4 bg-amber-500 rounded-full animate-particle"
                style={{ ['--tx' as string]: `${rx}px`, ['--ty' as string]: `${ry}px` } as React.CSSProperties} />
            );
          })}
        </div>
      )}

      {showDnaVortex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-80 h-80 rounded-full border-4 border-dashed border-cyan-400 animate-spin" />
          <div className="absolute w-60 h-60 rounded-full border-4 border-dashed border-purple-500 animate-spin-reverse" />
        </div>
      )}

      {specialEffectText && (
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 bg-yellow-500 text-black font-black text-3xl border border-white shadow-2xl rounded-2xl animate-bounce">
          ⚡ {specialEffectText} ⚡
        </div>
      )}

      {phase === 'matchmaking' && (
        <MatchmakingScreen opponent={opponent} countdown={countdown} />
      )}

      {phase === 'deck_select' && (
        <DeckSelectScreen
          battleMode={battleMode}
          onSetBattleMode={setBattleMode}
          playerStats={playerStats}
          hasEnoughCards={hasEnoughCards}
          top10UnlockedCards={top10UnlockedCards}
          tempSelectedCards={tempSelectedCards}
          cardLevels={progress.cardLevels}
          onToggleCard={handleToggleCardSelection}
          onConfirmDeck={handleConfirmDeck}
          onBack={onBack}
        />
      )}

      {phase === 'battle' && (
        <BattleCombatScreen
          battleMode={battleMode}
          roundWins={roundWins}
          studentName={studentName}
          studentAvatar={studentAvatar}
          equippedCosmetics={{ outfit: equippedCosmetics.outfit, expression: equippedCosmetics.expression, accessory: equippedCosmetics.accessory, mount: equippedCosmetics.mount }}
          playerStats={playerStats}
          opponent={opponent}
          opponentStats={opponentStats}
          isAI={isAI}
          deck={deck}
          playerHp={playerHp}
          opponentHp={opponentHp}
          round={round}
          roundPhase={roundPhase}
          roundTimer={roundTimer}
          selectedCardId={selectedCardId}
          opponentSelectedCardId={opponentSelectedCardId}
          usedPlayerCardIds={usedPlayerCardIds}
          damagePopup={damagePopup}
          cardLevels={progress.cardLevels}
          items={progress.items}
          quizQuestion={quizQuestion}
          selectedOption={selectedOption}
          isQuizAnswered={isQuizAnswered}
          playerCorrect={playerCorrect}
          opponentCorrect={opponentCorrect}
          onSelectRoundCard={handleSelectRoundCard}
          onUseHealItem={handleUseHealItem}
          onQuizAnswerSubmit={handleQuizAnswerSubmit}
        />
      )}

      {phase === 'results' && (
        <BattleResultScreen
          battleMode={battleMode}
          roundWins={roundWins}
          battleOutcome={battleOutcome}
          awardedXp={awardedXp}
          roundsHistory={roundsHistory}
          onBack={onBack}
        />
      )}
    </div>
  );
}
