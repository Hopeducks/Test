'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameState, getCardAttribute, getAttackMultiplier, getEffectivenessLabel, ATTRIBUTE_EMOJIS } from '../../lib/game-state';
import { cards } from '../../data/cards';
import { questions, getUnitQuestions, getUnitTitle } from '../../data/questions';
import { costumeCatalog } from '../../data/costume-catalog';
import { gameAudio } from '../../lib/audio';
import { RenderAvatarPreview } from './AvatarPreview';
import { supabase } from '../../lib/supabase-client';

const IS_SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
import { 
  Swords, 
  Shield, 
  Zap, 
  Heart, 
  Award, 
  Sparkles, 
  Timer, 
  ChevronRight, 
  RotateCcw, 
  User, 
  Bot, 
  Trophy, 
  HelpCircle,
  AlertTriangle,
  Flame,
  Crown
} from 'lucide-react';
import { Question, CollectibleCard, Card, Player, MCQuestion } from '../../types';

interface CardBattleArenaProps {
  onBack: () => void;
}

interface BattleCard extends Card {
  defense: number;
}

// Map CollectibleCard database to BattleCard
function mapToBattleCard(card: CollectibleCard, cardLevels?: Record<string, number>): BattleCard {
  const isLegendary = card.rarity === 'legendary';
  const isRare = card.rarity === 'rare';
  
  // Power mapping
  let power = 30;
  if (isLegendary) power = 85;
  else if (isRare) power = 55;

  // Level bonus
  const level = cardLevels?.[card.id] || 1;
  power = power + (level - 1) * 6;

  // Type mapping
  let type: 'attack' | 'defense' | 'special' = 'attack';
  if (isLegendary) {
    type = 'special';
  } else if ((card.unitId) % 2 === 0) {
    type = 'defense';
  }

  // Defense mapping
  let defense = 0;
  if (type === 'defense') {
    defense = isRare ? 18 : 10;
  } else if (type === 'special') {
    defense = 5;
  }

  // Special effect description
  let specialEffect = '';
  if (isLegendary) {
    if ([1, 4].includes(card.unitId)) {
      specialEffect = '화석 폭발!';
    } else if ([2, 7].includes(card.unitId)) {
      specialEffect = '번개 섬광!';
    } else {
      specialEffect = 'DNA 소용돌이!';
    }
  }

  return {
    id: card.id,
    name: card.name,
    emoji: card.image || '❓',
    rarity: (card.rarity || 'common') as 'common' | 'rare' | 'legendary',
    unitId: card.unitId,
    description: card.description,
    power,
    type,
    defense,
    specialEffect
  };
}

export default function CardBattleArena({ onBack }: CardBattleArenaProps) {
  const { 
    progress, 
    studentName, 
    studentAvatar, 
    equippedCosmetics, 
    classroomSession, 
    setClassroomSession,
    getLocalPlayer,
    setLocalPlayer,
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
    let coins = 10;
    
    if (finalPlayerHp > finalOppHp) {
      outcome = 'victory';
      coins = 35;
      gameAudio.playCatchSuccess();
    } else if (finalOppHp > finalPlayerHp) {
      outcome = 'defeat';
      coins = 15;
      gameAudio.playWrong();
    } else {
      outcome = 'draw';
      coins = 20;
    }

    setBattleOutcome(outcome);
    setAwardedCoins(coins);

    // ── 배틀 종료 Broadcast ──
    broadcastBattleEnd(outcome);

    // Save coins to Player Inventory
    const local = getLocalPlayer();
    if (local) {
      local.coins += coins;
      setLocalPlayer(local);
    }

    // Write battle results to Supabase game_sessions list
    try {
      const { data } = await supabase.from('battle_results').insert({
        player_name: studentName,
        opponent_name: opponent?.name || 'AI 상대',
        outcome,
        rounds_won: roundsHistory.filter(r => r.winner === 'player').length,
        rounds_lost: roundsHistory.filter(r => r.winner === 'opponent').length,
        awarded_coins: coins
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
                  ['--tx' as any]: `${rx}px`,
                  ['--ty' as any]: `${ry}px`,
                }}
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

      {/* MATCHMAKING LOADER */}
      {phase === 'matchmaking' && (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-8 glass-panel border-cyan-500/10 p-12 bg-cyan-950/5">
          <div className="relative">
            <Swords className="w-20 h-20 text-cyan-400 animate-spin-slow" />
            <span className="absolute inset-0 flex items-center justify-center text-xs">🎮</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-black text-gray-100 animate-pulse">배틀 상대 찾는 중...</h2>
            <p className="text-sm text-cyan-400/60 font-mono tracking-wider">// CONNECTING TO MATCHMAKING STADIUM // WAIT FOR OPPONENT</p>
          </div>

          {opponent && (
            <div className="p-5 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl max-w-sm w-full space-y-3 animate-scale-up">
              <span className="text-[10px] text-cyan-400 font-mono font-bold block uppercase tracking-widest">// MATCH FOUND!</span>
              <div className="flex items-center justify-between border-t border-gray-900 pt-3">
                <div className="text-left">
                  <span className="text-[9px] text-gray-500 block">NICKNAME</span>
                  <span className="text-base font-extrabold text-white">{opponent.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-500 block">LEVEL</span>
                  <span className="text-sm font-black text-cyan-400 font-mono">LV. {opponent.level}</span>
                </div>
              </div>
            </div>
          )}

          {countdown !== null && (
            <div className="text-6xl font-black text-yellow-400 font-mono animate-ping pt-4">
              {countdown === 0 ? 'START!' : countdown}
            </div>
          )}
        </div>
      )}

      {/* DECK BUILDING SCREEN */}
      {phase === 'deck_select' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-900 pb-4">
            <div>
              <h2 className="text-2xl font-black text-cyan-400 flex items-center gap-2">
                <Swords className="w-7 h-7" /> 출전 카드 덱 편성 (Select Deck)
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">// SELECT EXACTLY 3 SCI-CARDS TO START BATTLE</p>
            </div>
            <div className="flex gap-4 p-3 bg-cyan-950/20 border border-cyan-500/15 rounded-xl text-xs font-mono text-cyan-400">
              <span>장비 버프 효과:</span>
              <span>❤️ 체력 +{playerStats.hp}</span>
              <span>🗡️ 공격력 +{playerStats.attack}</span>
              <span>🛡️ 방어력 +{playerStats.defense}</span>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-800 bg-gray-950 hover:text-cyan-400 rounded-lg text-xs font-bold btn-cyber transition-all font-mono"
            >
              대기실 탈출 (QUIT)
            </button>
          </div>

          {!hasEnoughCards ? (
            <div className="p-12 glass-panel border-red-500/20 bg-red-950/5 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
              <h3 className="text-xl font-bold text-gray-200">배틀 카드 부족</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                출전하려면 3장 이상의 카드가 해금되어 있어야 합니다. 단원 복습 퀴즈를 풀어 신규 카드를 수집한 후 다시 도전해보세요!
              </p>
              <button 
                onClick={onBack}
                className="px-6 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs font-black rounded-lg"
              >
                로비로 돌아가기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Card List (Col-span 2) */}
              <div className="lg:col-span-2 glass-panel p-6 border-cyan-500/10 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                  <h3 className="text-sm font-extrabold text-gray-200">나의 전투 카드 가용 리스트 (최대 10개)</h3>
                  <span className="text-xs font-mono text-cyan-400 font-bold">선택됨: {tempSelectedCards.length} / 3</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[350px] overflow-y-auto pr-1">
                  {top10UnlockedCards.map((card) => {
                    const isSelected = tempSelectedCards.includes(card.id);
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleToggleCardSelection(card.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between h-36 card-cyber transition-all hover:scale-[1.02] ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                            : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                            card.rarity === 'legendary' ? 'bg-amber-500 text-black' : card.rarity === 'rare' ? 'bg-purple-950 text-purple-300' : 'bg-gray-800 text-gray-300'
                          }`}>
                            {card.rarity} {ATTRIBUTE_EMOJIS[getCardAttribute(card.unitId)]}
                          </span>
                          <span className="text-xl">{card.emoji}</span>
                        </div>

                        <div className="mt-4">
                          <span className="text-xs font-extrabold text-gray-100 block truncate">{card.name}</span>
                          <span className="text-[9px] text-gray-500 block font-mono mt-0.5">
                            {card.type === 'attack' ? '🗡️ 공격' : card.type === 'defense' ? '🛡️ 방어' : '✨ 특수'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-gray-900/60 text-[9px] font-mono text-gray-400">
                          <span>ATK {card.power}</span>
                          <span className="text-cyan-400 font-bold">LV. {progress.cardLevels?.[card.id] || 1}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirm panel (Col-span 1) */}
              <div className="lg:col-span-1 glass-panel p-6 border-cyan-500/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-3 mb-4">선택된 대진표 덱</h3>
                  
                  {tempSelectedCards.length === 0 ? (
                    <div className="p-8 border border-dashed border-gray-800 rounded-xl text-center text-xs text-gray-500 font-mono">
                      DECK IS EMPTY // CHOOSE 3 CARDS
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {top10UnlockedCards.filter(c => tempSelectedCards.includes(c.id)).map((card, idx) => (
                        <div key={card.id} className="p-2.5 border border-gray-850 bg-gray-950/50 rounded-lg flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono">#{idx+1}</span>
                            <span className="text-base">{card.emoji}</span>
                            <span className="text-xs font-bold text-gray-200">{card.name} {ATTRIBUTE_EMOJIS[getCardAttribute(card.unitId)]}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-cyan-400">LV. {progress.cardLevels?.[card.id] || 1} · ATK {card.power}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  disabled={tempSelectedCards.length !== 3}
                  onClick={handleConfirmDeck}
                  className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-black text-base rounded-xl btn-cyber transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-8"
                >
                  출전 확인 (Confirm Deck)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMBAT SCREEN */}
      {phase === 'battle' && quizQuestion && (
        <div className="space-y-6">
          
          {/* Top Panel: Player & Opponent stats layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Player Side */}
            <div className="glass-panel p-4 border-cyan-500/20 bg-black/60 relative flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <RenderAvatarPreview
                    baseAvatar={studentAvatar}
                    outfit={equippedCosmetics.outfit}
                    expression={equippedCosmetics.expression}
                    accessory={equippedCosmetics.accessory}
                    mount={equippedCosmetics.mount}
                    size="md"
                  />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-cyan-400 flex items-center gap-1.5">
                    {studentName}
                    <span className="px-1 py-0.2 bg-cyan-950 text-cyan-400 text-[8px] font-mono rounded">대원</span>
                  </h3>
                  <span className="text-[10px] text-cyan-400/80 font-mono block mt-0.5">
                    버프: ❤️+{playerStats.hp} 🗡️+{playerStats.attack} 🛡️+{playerStats.defense}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-1">
                    <span>ROUND CARD:</span>
                    {selectedCardId ? (
                      <span className="text-white font-bold">{deck.find(c => c.id === selectedCardId)?.emoji} {deck.find(c => c.id === selectedCardId)?.name}</span>
                    ) : (
                      <span className="text-red-500 font-bold">미선택</span>
                    )}
                  </div>
                </div>
              </div>

              {/* HP Bar */}
              <div className="mt-4">
                <div className="flex justify-between items-baseline text-xs font-mono mb-1">
                  <span>HP Gauge</span>
                  <span className="font-bold text-gray-200">{playerHp} / {100 + playerStats.hp}</span>
                </div>
                <div className="w-full h-3 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-500" 
                    style={{ width: `${Math.max(0, (playerHp / (100 + playerStats.hp)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Floating Damage Popup overlay */}
              {damagePopup.player !== null && (
                <div className="absolute top-4 right-4 text-red-500 text-3xl font-black animate-float-up pointer-events-none select-none drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
                  -{damagePopup.player}
                </div>
              )}
            </div>

            {/* Right Opponent Side */}
            <div className="glass-panel p-4 border-red-500/20 bg-black/60 relative flex flex-col justify-between min-h-[160px]">
              <div className="flex items-center gap-3 md:flex-row-reverse md:text-right">
                <div className="relative transform scale-x-[-1]">
                  <RenderAvatarPreview
                    baseAvatar={opponent?.avatar || '👾'}
                    outfit="none"
                    expression="none"
                    accessory="none"
                    mount="none"
                    size="md"
                  />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-red-400 flex items-center gap-1.5 md:flex-row-reverse">
                    {opponent?.name}
                    <span className="px-1 py-0.2 bg-red-950 text-red-400 text-[8px] font-mono rounded">{isAI ? 'AI' : '원격'}</span>
                  </h3>
                  <span className="text-[10px] text-red-400/80 font-mono block mt-0.5 md:text-right">
                    버프: ❤️+{opponentStats.hp} 🗡️+{opponentStats.attack} 🛡️+{opponentStats.defense}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-1 md:flex-row-reverse">
                    <span>ROUND CARD:</span>
                    {opponentSelectedCardId ? (
                      <span className="text-white font-bold">❓ 페이스다운</span>
                    ) : (
                      <span className="text-red-500 font-bold">미선택</span>
                    )}
                  </div>
                </div>
              </div>

              {/* HP Bar */}
              <div className="mt-4">
                <div className="flex justify-between items-baseline text-xs font-mono mb-1">
                  <span>HP Gauge</span>
                  <span className="font-bold text-gray-200">{opponentHp} / {100 + opponentStats.hp}</span>
                </div>
                <div className="w-full h-3 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-500" 
                    style={{ width: `${Math.max(0, (opponentHp / (100 + opponentStats.hp)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Floating Damage Popup overlay */}
              {damagePopup.opponent !== null && (
                <div className="absolute top-4 left-4 text-red-500 text-3xl font-black animate-float-up pointer-events-none select-none drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
                  -{damagePopup.opponent}
                </div>
              )}
            </div>
          </div>

          {/* Core Interactive Center Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Card Selection Slots */}
            <div className="lg:col-span-1 glass-panel p-5 border-cyan-500/10 space-y-4">
              <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-2 flex items-center justify-between">
                <span>내 출전 카드 3장</span>
                <span className="text-[10px] text-gray-500 font-mono">ROUND {round} / 3</span>
              </h3>

              <div className="flex flex-col gap-3">
                {deck.map((card, idx) => {
                  const isUsed = usedPlayerCardIds.includes(card.id);
                  const isSelected = selectedCardId === card.id;
                  const cardLvl = progress.cardLevels?.[card.id] || 1;

                  return (
                    <button
                      key={card.id}
                      disabled={roundPhase !== 'card_select' || isUsed}
                      onClick={() => handleSelectRoundCard(card.id)}
                      className={`p-3 border rounded-xl flex items-center justify-between btn-cyber transition-all ${
                        isUsed 
                          ? 'border-gray-950 bg-gray-950/20 opacity-30 cursor-not-allowed'
                          : isSelected
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                            : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{card.emoji}</span>
                        <span className="text-xs font-bold text-gray-200">
                          {card.name} {ATTRIBUTE_EMOJIS[getCardAttribute(card.unitId)]}
                        </span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">
                        LV.{cardLvl} · ATK {card.power}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Round Flow Console and Questions (Col-span 2) */}
            <div className="lg:col-span-2 glass-panel p-6 border-cyan-500/15 bg-black/40 min-h-[300px] flex flex-col justify-between">
              
              {/* CARD SELECT PHASE */}
              {roundPhase === 'card_select' && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 py-4">
                  <Timer className="w-12 h-12 text-yellow-500 animate-pulse" />
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-black text-yellow-400">전투 카드를 제시하세요!</h3>
                    <p className="text-sm text-gray-400">좌측 카드 중 이번 라운드에 비밀리에 출전시킬 카드를 탭하세요.</p>
                  </div>
                  <div className="text-4xl font-black text-white font-mono-numbers">
                    {roundTimer}s
                  </div>

                  {/* Potion/Heal items bag panel */}
                  <div className="w-full max-w-md p-3 border border-cyan-500/10 bg-cyan-950/5 rounded-xl flex flex-col gap-2 mt-4">
                    <span className="text-[10px] font-bold text-gray-455 text-left block">// 치료제 사용 (물약 복용)</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'potion', name: '상처약', emoji: '🧪', desc: '+30 HP' },
                        { key: 'potionHyper', name: '좋은상처약', emoji: '🔋', desc: '+60 HP' },
                        { key: 'potionMax', name: '풀회복약', emoji: '🌟', desc: 'HP 전부 회복' },
                        { key: 'revive', name: '기력의조각', emoji: '💊', desc: '+50 HP (HP 30 이하만 가능)' }
                      ].map(item => {
                        const count = progress.items?.[item.key as keyof typeof progress.items] || 0;
                        return (
                          <button
                            key={item.key}
                            disabled={count <= 0}
                            onClick={() => handleUseHealItem(item.key as 'potion' | 'potionHyper' | 'potionMax' | 'revive')}
                            className={`p-2 border rounded-lg flex items-center justify-between text-left transition-all ${
                              count > 0 
                                ? 'bg-gray-900/60 border-cyan-500/20 hover:border-cyan-400 hover:scale-102 active:scale-98' 
                                : 'bg-gray-950/20 border-gray-950 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xl shrink-0">{item.emoji}</span>
                              <div className="truncate text-left leading-none">
                                <span className="text-[10px] font-bold block text-gray-200">{item.name}</span>
                                <span className="text-[8px] text-gray-500 block mt-0.5">{item.desc}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/30 px-1 py-0.5 rounded shrink-0">
                              {count}개
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* QUIZ ANSWER PHASE */}
              {roundPhase === 'quiz' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      💡 정답 시 데미지 버프 +50% 적용!
                    </span>
                    <div className="flex items-center gap-1 text-yellow-500 font-mono text-sm">
                      <Timer className="w-4 h-4" />
                      <span>{roundTimer}초 남음</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold leading-relaxed text-gray-100">
                    {quizQuestion.question}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(quizQuestion as MCQuestion).options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === (quizQuestion as MCQuestion).correctIndex;
                      
                      let btnStyle = 'border-gray-800 bg-gray-950 hover:border-cyan-500/50 text-gray-300';
                      if (isQuizAnswered) {
                        if (isSelected) {
                          btnStyle = isCorrect
                            ? 'border-green-500 bg-green-950/30 text-green-400 font-black'
                            : 'border-red-500 bg-red-950/30 text-red-400';
                        } else if (isCorrect) {
                          btnStyle = 'border-green-500 bg-green-950/10 text-green-400';
                        } else {
                          btnStyle = 'border-gray-950 bg-gray-950/20 text-gray-600 opacity-40';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isQuizAnswered}
                          onClick={() => handleQuizAnswerSubmit(idx)}
                          className={`p-3.5 border rounded-xl text-left text-xs font-bold leading-relaxed btn-cyber transition-all touch-target ${btnStyle}`}
                        >
                          <span className="font-mono text-gray-500 mr-2">{idx + 1}.</span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RESOLVING / CARD FLIPPING PHASE */}
              {roundPhase === 'resolve' && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 py-4">
                  <h3 className="text-xl font-black text-cyan-400 animate-pulse">// 카드 플립 및 데미지 계산 //</h3>
                  
                  {/* Card Flip Presentation Section */}
                  <div className="flex items-center gap-12 select-none">
                    {/* Player Card (Flipped) */}
                    <div className="w-36 h-48 perspective-1000">
                      <div className="w-full h-full duration-700 preserve-3d rotate-y-180 absolute">
                        <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-b from-[#1b1e2a] to-[#090b11] border-2 border-cyan-400 rounded-xl p-3 flex flex-col justify-between">
                          <span className="text-[8px] font-mono text-cyan-400 uppercase font-bold tracking-widest">{deck.find(c => c.id === selectedCardId)?.rarity}</span>
                          <span className="text-4xl text-center">{deck.find(c => c.id === selectedCardId)?.emoji}</span>
                          <div className="text-center">
                            <span className="text-[10px] font-black text-white">
                              {deck.find(c => c.id === selectedCardId)?.name} {selectedCardId && ATTRIBUTE_EMOJIS[getCardAttribute(deck.find(c => c.id === selectedCardId)!.unitId)]}
                            </span>
                            <span className="text-[9px] text-gray-500 block font-mono">POWER: {deck.find(c => c.id === selectedCardId)?.power}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <span className="text-3xl font-black text-red-500 animate-pulse">VS</span>

                    {/* Opponent Card (Flipped) */}
                    <div className="w-36 h-48 perspective-1000">
                      <div className="w-full h-full duration-700 preserve-3d rotate-y-180 absolute">
                        <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-b from-[#2a1b1b] to-[#110909] border-2 border-red-500 rounded-xl p-3 flex flex-col justify-between">
                          <span className="text-[8px] font-mono text-red-500 uppercase font-bold tracking-widest">{cards.find(c => c.id === opponentSelectedCardId)?.rarity || 'common'}</span>
                          <span className="text-4xl text-center">{cards.find(c => c.id === opponentSelectedCardId)?.image || '❓'}</span>
                          <div className="text-center">
                            <span className="text-[10px] font-black text-white">
                              {cards.find(c => c.id === opponentSelectedCardId)?.name || '상대 카드'} {opponentSelectedCardId && ATTRIBUTE_EMOJIS[getCardAttribute(cards.find(c => c.id === opponentSelectedCardId)!.unitId)]}
                            </span>
                            <span className="text-[9px] text-gray-500 block font-mono">
                              POWER: {opponentSelectedCardId ? mapToBattleCard(cards.find(c => c.id === opponentSelectedCardId)!, { [opponentSelectedCardId]: opponent?.level || 1 }).power : 20}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-8 text-center text-xs font-mono">
                    <div>
                      <span className="text-gray-500 block">내 퀴즈 보너스</span>
                      <span className={playerCorrect ? 'text-green-400 font-bold' : 'text-red-500'}>
                        {playerCorrect ? '+50% 공격력 증가 (1.5x)' : '보너스 없음 (1.0x)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">상대 퀴즈 보너스</span>
                      <span className={opponentCorrect ? 'text-green-400 font-bold' : 'text-red-500'}>
                        {opponentCorrect ? '+50% 공격력 증가 (1.5x)' : '보너스 없음 (1.0x)'}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const pCard = deck.find(c => c.id === selectedCardId);
                    const oCard = cards.find(c => c.id === opponentSelectedCardId);
                    if (!pCard || !oCard) return null;
                    const pMult = getAttackMultiplier(pCard.unitId, oCard.unitId);
                    const oMult = getAttackMultiplier(oCard.unitId, pCard.unitId);
                    
                    const pLabel = getEffectivenessLabel(pMult);
                    const oLabel = getEffectivenessLabel(oMult);

                    return (
                      <div className="flex flex-col items-center gap-2 mt-2 max-w-md w-full p-3 bg-gray-950/60 border border-gray-900 rounded-xl">
                        <div className="text-xs font-bold text-cyan-400 tracking-wide flex items-center gap-1">
                          ⚔️ 속성 상성 전투 결과 (Type Matchup)
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full text-[11px] font-mono mt-1 pt-1.5 border-t border-gray-900 text-left">
                          <div>
                            <span className="text-gray-500 block">내 공격 효과 ({ATTRIBUTE_EMOJIS[getCardAttribute(pCard.unitId)]} → {ATTRIBUTE_EMOJIS[getCardAttribute(oCard.unitId)]})</span>
                            <span className={`font-black ${pMult >= 2.0 ? 'text-green-400' : pMult <= 0 ? 'text-red-500' : pMult < 1.0 ? 'text-orange-400' : 'text-gray-300'}`}>
                              {pMult}배 {pLabel ? `(${pLabel.replace(/ \(.*배\)/, '')})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">상대 공격 효과 ({ATTRIBUTE_EMOJIS[getCardAttribute(oCard.unitId)]} → {ATTRIBUTE_EMOJIS[getCardAttribute(pCard.unitId)]})</span>
                            <span className={`font-black ${oMult >= 2.0 ? 'text-green-400' : oMult <= 0 ? 'text-red-500' : oMult < 1.0 ? 'text-orange-400' : 'text-gray-300'}`}>
                              {oMult}배 {oLabel ? `(${oLabel.replace(/ \(.*배\)/, '')})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* RESULTS DISPLAY PANEL */}
      {phase === 'results' && (
        <div className="max-w-2xl mx-auto text-center py-12 px-6 glass-panel border-cyan-500/20 bg-gradient-to-b from-[#09101d] to-[#04060b] shadow-2xl relative animate-scale-up">
          
          {battleOutcome === 'victory' ? (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full border border-amber-400 bg-amber-950/20 flex items-center justify-center text-amber-400 mx-auto mb-4 animate-bounce">
                <Crown className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-amber-400 tracking-wider">VICTORY! 최종 배틀 승리</h2>
              <p className="text-sm text-gray-300">훌륭합니다! 상대방의 세련된 전술을 격파하고 스타디움 챔피언에 올랐습니다!</p>
            </div>
          ) : battleOutcome === 'defeat' ? (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full border border-red-500 bg-red-950/20 flex items-center justify-center text-red-500 mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-red-500 tracking-wider">DEFEAT. 최종 배틀 패배</h2>
              <p className="text-sm text-gray-300">아쉽지만 상대방 카드 덱 파워에 패배했습니다. 다음 퀴즈 복습으로 실력을 다져보세요!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full border border-gray-500 bg-gray-950/20 flex items-center justify-center text-gray-400 mx-auto mb-4">
                <Swords className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-gray-300 tracking-wider">DRAW. 무승부 대결</h2>
              <p className="text-sm text-gray-300">양 플레이어가 팽팽한 호각세의 명승부를 벌였습니다!</p>
            </div>
          )}

          {/* Reward block */}
          <div className="p-4 bg-gray-950 border border-gray-900 rounded-xl max-w-sm mx-auto my-6 text-sm text-gray-400">
            획득 보상 코인: <span className="text-yellow-400 font-extrabold">+{awardedCoins} 코인 🪙</span>
          </div>

          {/* Rounds details summary */}
          <div className="max-w-md mx-auto space-y-2 text-xs font-mono mb-8">
            <span className="text-gray-500 text-[10px] block uppercase tracking-widest">// ROUNDS SUMMARY</span>
            {roundsHistory.map((r, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 border border-gray-900/60 bg-gray-950/20 rounded-lg">
                <span className="text-gray-400">Round {idx+1}: {r.pCard.emoji} vs {r.oCard.emoji}</span>
                <span className={`font-bold ${r.winner === 'player' ? 'text-green-400' : r.winner === 'opponent' ? 'text-red-500' : 'text-gray-500'}`}>
                  {r.winner === 'player' ? '정답 승리' : r.winner === 'opponent' ? '오답 패배' : '무승부'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 max-w-sm mx-auto">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] btn-cyber transition-all"
            >
              대기실로 돌아가기 (Close)
            </button>
          </div>
        </div>
      )}

      {/* Embedded CSS for particles and flips */}
      <style jsx global>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        @keyframes animate-flash {
          0%, 100% { opacity: 0; }
          30%, 70% { opacity: 0.8; }
        }
        .animate-flash-overlay {
          animation: animate-flash 1s ease-out forwards;
        }
        @keyframes scatter-particles {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.1); opacity: 0; }
        }
        .animate-particle {
          animation: scatter-particles 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
        .animate-spin-reverse {
          animation: spin 3s linear infinite reverse;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>

    </div>
  );
}
