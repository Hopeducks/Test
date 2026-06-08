'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameState, getAttackMultiplier } from '../../lib/game-state';
import { cards } from '../../data/cards';
import { questions, getUnitQuestions } from '../../data/questions';
import { costumeCatalog } from '../../data/costume-catalog';
import { gameAudio } from '../../lib/audio';
import { supabase } from '../../lib/supabase-client';
import { Question, MCQuestion } from '../../types';
import { BattleCard, mapToBattleCard } from './battle/battle-card';
import MatchmakingScreen from './battle/MatchmakingScreen';
import DeckSelectScreen from './battle/DeckSelectScreen';
import BattleCombatScreen from './battle/BattleCombatScreen';
import BattleResultScreen from './battle/BattleResultScreen';

interface CardBattleArenaProps {
  onBack: () => void;
}

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
    useItem
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

  // Compute AI opponent stats scaled by level
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

  // Battle states
  const [playerHp, setPlayerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [round, setRound] = useState(1);
  const [roundsHistory, setRoundsHistory] = useState<Array<{ winner: 'player' | 'opponent' | 'draw'; pCard: BattleCard; oCard: BattleCard }>>([]);

  // Round flow phases: 'card_select' | 'quiz' | 'resolve'
  const [roundPhase, setRoundPhase] = useState<'card_select' | 'quiz' | 'resolve'>('card_select');
  const [roundTimer, setRoundTimer] = useState(5); // 5s for card selection, 10s for quiz

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
  const [awardedCoins, setAwardedCoins] = useState(0);

  // ── 배틀 Supabase 채널 ref ─────────────────────────────
  const battleChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 10 strongest cards unlocked by player
  const top10UnlockedCards = useMemo(() => {
    const unlocked = cards.filter(c => progress.unlockedCardIds.includes(c.id));
    const fallbackIds = ['u1_c1', 'u1_c3', 'u2_c2', 'u3_c1', 'u4_c3', 'u5_c2', 'u6_c1', 'u7_c2', 'u8_c3'];
    const available = unlocked.length > 0 ? unlocked : cards.filter(c => fallbackIds.includes(c.id));

    // Map to BattleCard and sort by power descending
    return available
      .map(c => mapToBattleCard(c, progress.cardLevels))
      .sort((a, b) => b.power - a.power)
      .slice(0, 10);
  }, [progress.unlockedCardIds, progress.cardLevels]);

  // Lock behind deck requirements
  const hasEnoughCards = top10UnlockedCards.length >= 3;

  // Active battles checking
  const activeClassroomMatch = useMemo(() => {
    if (!classroomSession) return null;
    return classroomSession.activeBattles?.find(
      b => (b.player1 === studentName || b.player2 === studentName) && b.status === 'fighting'
    );
  }, [classroomSession, studentName]);

  // ── 배틀 채널 구독 / 해제 ─────────────────────────────
  useEffect(() => {
    const sessionCode = classroomSession?.code;
    if (!sessionCode || isAI) return; // AI 배틀에는 채널 불필요

    const channelId = `battle_session_${sessionCode}`;
    const channel = supabase.channel(channelId);
    battleChannelRef.current = channel;

    channel
      .on('broadcast', { event: 'battle_card_selected' }, ({ payload }: { payload: { playerId: string; cardId?: string | null } }) => {
        // 상대방이 카드를 선택했을 때 반영
        if (payload.playerId !== studentName) {
          setOpponentSelectedCardId(payload.cardId ?? null);
        }
      })
      .on('broadcast', { event: 'battle_round_result' }, ({ payload }: { payload: Record<string, unknown> }) => {
        // 상대방 퀴즈 결과 반영 (옵션)
        console.log('[Battle] round result received:', payload);
      })
      .on('broadcast', { event: 'battle_end' }, ({ payload }: { payload: Record<string, unknown> }) => {
        console.log('[Battle] battle end event received:', payload);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      battleChannelRef.current = null;
    };
  }, [classroomSession?.code, isAI, studentName]);

  // ── Broadcast 헬퍼: 카드 선택 송신 ────────────────────
  const broadcastCardSelected = (cardId: string) => {
    const ch = battleChannelRef.current;
    if (!ch || isAI) return;
    ch.send({
      type: 'broadcast',
      event: 'battle_card_selected',
      payload: { playerId: studentName, cardId, round, timestamp: Date.now() },
    });
  };

  // ── Broadcast 헬퍼: 라운드 결과 송신 ──────────────────
  const broadcastRoundResult = (
    pCardId: string,
    oCardId: string,
    nextPlayerHp: number,
    nextOpponentHp: number,
    roundWinner: 'player' | 'opponent' | 'draw'
  ) => {
    const ch = battleChannelRef.current;
    if (!ch || isAI) return;
    ch.send({
      type: 'broadcast',
      event: 'battle_round_result',
      payload: {
        playerId: studentName,
        round,
        playerCard: pCardId,
        opponentCard: oCardId,
        playerHp: nextPlayerHp,
        opponentHp: nextOpponentHp,
        roundWinner,
        timestamp: Date.now(),
      },
    });
  };

  // ── Broadcast 헬퍼: 배틀 종료 송신 ───────────────────
  const broadcastBattleEnd = (outcome: 'victory' | 'defeat' | 'draw') => {
    const ch = battleChannelRef.current;
    if (!ch || isAI) return;
    ch.send({
      type: 'broadcast',
      event: 'battle_end',
      payload: { playerId: studentName, outcome, timestamp: Date.now() },
    });
  };

  // Matchmaking setup
  useEffect(() => {
    if (phase !== 'matchmaking') return;

    gameAudio.playClick();

    // If online classroom, check if teacher paired us
    if (activeClassroomMatch) {
      const oppName = activeClassroomMatch.player1 === studentName ? activeClassroomMatch.player2 : activeClassroomMatch.player1;
      const oppInfo = classroomSession?.students.find(s => s.name === oppName);

      setOpponent({
        name: oppName,
        avatar: oppInfo?.avatar || '👾',
        level: Math.max(1, Math.floor((oppInfo?.currentScore || 0) / 2) + 1)
      });
      setIsAI(false);
      triggerCountdown();
      return;
    }

    // Otherwise, simulate finding an AI opponent after 2.5 seconds
    const aiTimer = setTimeout(() => {
      const botNames = ['아인슈타인 꿈나무', '마리 퀴리 주니어', '리틀 뉴턴', '갈릴레이 워너비', '코페르니쿠스 키드'];
      const botAvatars = ['🧑‍🔬', '👩‍🔬', '🧙‍♂️', '🧑‍🚀', '🦖', '🦁'];
      const botName = botNames[Math.floor(Math.random() * botNames.length)];
      const botAvatar = botAvatars[Math.floor(Math.random() * botAvatars.length)];

      setOpponent({
        name: botName,
        avatar: botAvatar,
        level: Math.floor(Math.random() * 4) + 1
      });
      setIsAI(true);
      triggerCountdown();
    }, 2500);

    return () => clearTimeout(aiTimer);
  }, [phase, activeClassroomMatch]);

  const triggerCountdown = () => {
    setCountdown(3);
  };

  // Countdown timer loop
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Pre-battle card selection
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

    // Match up the opponent deck (AI chooses 3 random cards matching player level)
    setSelectedCardId(null);
    setOpponentSelectedCardId(null);

    // Switch to Battle Phase
    setPhase('battle');
    startRoundSelection();
  };

  const handleUseHealItem = (itemType: 'potion' | 'potionHyper' | 'potionMax' | 'revive') => {
    const maxPlayerHp = 100 + playerStats.hp;
    if (playerHp >= maxPlayerHp && itemType !== 'revive') {
      alert('체력이 이미 가득 차 있습니다!');
      return;
    }

    if (itemType === 'revive' && playerHp > 30) {
      alert('기력의조각은 체력이 30 이하일 때만 사용할 수 있습니다!');
      return;
    }

    // Consume item
    const success = useItem(itemType);
    if (!success) {
      alert('치료제 아이템이 부족합니다!');
      return;
    }

    gameAudio.playCatchSuccess(); // Play a nice success audio

    // Apply heal
    let healAmount = 0;
    if (itemType === 'potion') healAmount = 30;
    else if (itemType === 'potionHyper') healAmount = 60;
    else if (itemType === 'potionMax') healAmount = maxPlayerHp; // Full heal
    else if (itemType === 'revive') healAmount = 50;

    setPlayerHp(prev => {
      const nextHp = prev + healAmount;
      return Math.min(maxPlayerHp, nextHp);
    });
  };

  // Round loops
  const startRoundSelection = () => {
    setRoundPhase('card_select');
    setSelectedCardId(null);
    setOpponentSelectedCardId(null);
    setRoundTimer(5);
    setPlayerCorrect(null);
    setOpponentCorrect(null);
    setSelectedOption(null);
    setIsQuizAnswered(false);
    setDamagePopup({ player: null, opponent: null });
  };

  // Main battle timers
  useEffect(() => {
    if (phase !== 'battle') return;

    if (roundTimer <= 0) {
      if (roundPhase === 'card_select') {
        // Auto select a random card if player didn't pick
        const available = deck.filter(c => !usedPlayerCardIds.includes(c.id));
        const autoCard = selectedCardId || available[0]?.id || null;
        if (autoCard) {
          setSelectedCardId(autoCard);
        }

        // Opponent picks a card
        const oppAvailable = cards
          .map(c => mapToBattleCard(c, {}))
          .filter(c => !usedOpponentCardIds.includes(c.id));
        const oppCard = oppAvailable[Math.floor(Math.random() * oppAvailable.length)] || oppAvailable[0];
        setOpponentSelectedCardId(oppCard.id);

        // Transition to Quiz Phase
        setRoundPhase('quiz');
        setRoundTimer(10);

        // Setup quiz question
        const unitQuestions = getUnitQuestions(1); // Fallback to Unit 1 questions
        const randomQ = unitQuestions[Math.floor(Math.random() * unitQuestions.length)] || questions[0];
        setQuizQuestion(randomQ);
      } else if (roundPhase === 'quiz') {
        // Time out quiz answer
        if (!isQuizAnswered) {
          handleQuizAnswerSubmit(-1);
        }
      }
      return;
    }

    const t = setTimeout(() => {
      setRoundTimer(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [roundTimer, roundPhase, phase]);

  // secret card pick
  const handleSelectRoundCard = (cardId: string) => {
    if (roundPhase !== 'card_select' || usedPlayerCardIds.includes(cardId)) return;
    setSelectedCardId(cardId);
    gameAudio.playClick();
    // ── 카드 선택 Broadcast ──
    broadcastCardSelected(cardId);
  };

  const handleQuizAnswerSubmit = (optionIndex: number) => {
    if (isQuizAnswered || !quizQuestion) return;

    setSelectedOption(optionIndex);
    setIsQuizAnswered(true);

    const correct = optionIndex === (quizQuestion as MCQuestion).correctIndex;
    setPlayerCorrect(correct);

    if (correct) {
      gameAudio.playCorrect();
    } else {
      gameAudio.playWrong();
    }

    // Opponent also answers (AI has 75% accuracy)
    const oppCorrect = Math.random() < 0.75;
    setOpponentCorrect(oppCorrect);

    // Resolve Phase
    setTimeout(() => {
      resolveRoundCombat(correct, oppCorrect);
    }, 1500);
  };

  const resolveRoundCombat = (pCorrect: boolean, oCorrect: boolean) => {
    setRoundPhase('resolve');

    // Locate active cards
    const pCard = deck.find(c => c.id === selectedCardId)!;

    // Build opponent levels mapping
    const oppLevels = cards.reduce((acc, curr) => {
      acc[curr.id] = opponent?.level || 1;
      return acc;
    }, {} as Record<string, number>);
    const allAvailableOpp = cards.map(c => mapToBattleCard(c, oppLevels));
    const oCard = allAvailableOpp.find(c => c.id === opponentSelectedCardId) || allAvailableOpp[0];

    // Mark as used
    setUsedPlayerCardIds(prev => [...prev, pCard.id]);
    setUsedOpponentCardIds(prev => [...prev, oCard.id]);

    // Apply 50% power increase if correct
    let pPower = pCard.power;
    if (pCorrect) pPower = Math.round(pPower * 1.5);

    let oPower = oCard.power;
    if (oCorrect) oPower = Math.round(oPower * 1.5);

    // Calculate Type Multipliers
    const pMultiplier = getAttackMultiplier(pCard.unitId, oCard.unitId);
    const oMultiplier = getAttackMultiplier(oCard.unitId, pCard.unitId);

    // Apply Type Multipliers
    pPower = Math.round(pPower * pMultiplier);
    oPower = Math.round(oPower * oMultiplier);

    // Trigger visual legendary effects if any
    let effectDelay = 0;
    if (pCard.rarity === 'legendary') {
      effectDelay = 1500;
      triggerSpecialEffect(pCard.specialEffect || 'DNA 소용돌이!');
    }
    if (oCard.rarity === 'legendary') {
      effectDelay = Math.max(effectDelay, 1500);
      triggerSpecialEffect(oCard.specialEffect || 'DNA 소용돌이!');
    }

    setTimeout(() => {
      // Calculate damage with cosmetic bonuses
      // If immune (0.0x multiplier), damage is 0 (MISS). Else minimum damage is 5.
      const pDmg = pMultiplier === 0
        ? 0
        : Math.max(5, Math.round(pPower + playerStats.attack - (oCard.defense + opponentStats.defense)));
      const oDmg = oMultiplier === 0
        ? 0
        : Math.max(5, Math.round(oPower + opponentStats.attack - (pCard.defense + playerStats.defense)));

      // Shake screen unless both immune/0 damage
      if (pDmg > 0 || oDmg > 0) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);
      }

      // Flash numbers
      setDamagePopup({ player: oDmg, opponent: pDmg });

      // Animate HP
      const nextPlayerHp = Math.max(0, playerHp - oDmg);
      const nextOpponentHp = Math.max(0, opponentHp - pDmg);
      setPlayerHp(nextPlayerHp);
      setOpponentHp(nextOpponentHp);

      // Record round history
      const roundWinner = pDmg > oDmg ? 'player' : oDmg > pDmg ? 'opponent' : 'draw';
      setRoundsHistory(prev => [...prev, { winner: roundWinner, pCard, oCard }]);

      // ── 라운드 결과 Broadcast ──
      broadcastRoundResult(pCard.id, oCard.id, nextPlayerHp, nextOpponentHp, roundWinner);

      // Transition to next round or end
      setTimeout(() => {
        if (round >= 3 || nextPlayerHp <= 0 || nextOpponentHp <= 0) {
          endBattle(nextPlayerHp, nextOpponentHp);
        } else {
          setRound(round + 1);
          startRoundSelection();
        }
      }, 3000);

    }, effectDelay);
  };

  const triggerSpecialEffect = (effect: string) => {
    setSpecialEffectText(effect);
    gameAudio.playCatchSuccess();

    if (effect === '번개 섬광!') {
      setFlashScreen(true);
      setTimeout(() => setFlashScreen(false), 1000);
    } else if (effect === '화석 폭발!') {
      setShowFossilParticles(true);
      setTimeout(() => setShowFossilParticles(false), 1200);
    } else {
      setShowDnaVortex(true);
      setTimeout(() => setShowDnaVortex(false), 1200);
    }

    setTimeout(() => {
      setSpecialEffectText(null);
    }, 1500);
  };

  const endBattle = async (finalPlayerHp: number, finalOppHp: number) => {
    let outcome: 'victory' | 'defeat' | 'draw' = 'draw';
    // 전투 보상은 코인이 아니라 카드 경험치(레벨 연동). 코인은 마일스톤에서만 지급. (PRD EPIC A/D)
    let xpGain = 20;

    if (finalPlayerHp > finalOppHp) {
      outcome = 'victory';
      xpGain = 45;
      gameAudio.playCatchSuccess();
    } else if (finalOppHp > finalPlayerHp) {
      outcome = 'defeat';
      xpGain = 15;
      gameAudio.playWrong();
    } else {
      outcome = 'draw';
      xpGain = 25;
    }

    setBattleOutcome(outcome);
    setAwardedCoins(xpGain);

    // ── 배틀 종료 Broadcast ──
    broadcastBattleEnd(outcome);

    // 사용한 덱 카드에 경험치 지급 (코인 미지급)
    const deckCardIds = deck.map(c => c.id);
    if (deckCardIds.length > 0) {
      gainCardXp(deckCardIds, xpGain);
    }

    // Write battle results to Supabase game_sessions list
    try {
      const { data } = await supabase.from('battle_results').insert({
        player_name: studentName,
        opponent_name: opponent?.name || 'AI 상대',
        outcome,
        rounds_won: roundsHistory.filter(r => r.winner === 'player').length,
        rounds_lost: roundsHistory.filter(r => r.winner === 'opponent').length,
        awarded_coins: xpGain
      });
      console.log('Battle results saved:', data);
    } catch (e) {
      console.error('Failed to log battle result to Supabase:', e);
    }

    setPhase('results');
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 py-4 relative font-sans text-gray-100 ${screenShake ? 'animate-shake' : ''}`}>

      {/* ⚡ lightning Flash Overlay */}
      {flashScreen && (
        <div className="fixed inset-0 bg-white z-50 animate-flash-overlay pointer-events-none" />
      )}

      {/* ☄️ Fossil Particle Explosion Overlay */}
      {showFossilParticles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => {
            const rx = (Math.random() - 0.5) * 400;
            const ry = (Math.random() - 0.5) * 400;
            return (
              <div
                key={i}
                className="absolute w-4 h-4 bg-amber-500 rounded-full animate-particle"
                style={{
                  ['--tx' as string]: `${rx}px`,
                  ['--ty' as string]: `${ry}px`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* 🧬 DNA Vortex Spiral Ring Overlay */}
      {showDnaVortex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-80 h-80 rounded-full border-4 border-dashed border-cyan-400 animate-spin" />
          <div className="absolute w-60 h-60 rounded-full border-4 border-dashed border-purple-500 animate-spin-reverse" />
        </div>
      )}

      {/* Special effect text banner */}
      {specialEffectText && (
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 bg-yellow-500 text-black font-black text-3xl border border-white shadow-2xl rounded-2xl animate-bounce">
          ⚡ {specialEffectText} ⚡
        </div>
      )}

      {/* MATCHMAKING */}
      {phase === 'matchmaking' && (
        <MatchmakingScreen opponent={opponent} countdown={countdown} />
      )}

      {/* DECK BUILDING */}
      {phase === 'deck_select' && (
        <DeckSelectScreen
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

      {/* COMBAT */}
      {phase === 'battle' && quizQuestion && (
        <BattleCombatScreen
          studentName={studentName}
          studentAvatar={studentAvatar}
          equippedCosmetics={{
            outfit: equippedCosmetics.outfit,
            expression: equippedCosmetics.expression,
            accessory: equippedCosmetics.accessory,
            mount: equippedCosmetics.mount,
          }}
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

      {/* RESULTS */}
      {phase === 'results' && (
        <BattleResultScreen
          battleOutcome={battleOutcome}
          awardedCoins={awardedCoins}
          roundsHistory={roundsHistory}
          onBack={onBack}
        />
      )}

    </div>
  );
}
