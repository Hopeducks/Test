'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Player, Question, Card, GameSession, MCQuestion } from '../../types';
import { useGameState, getCardAttribute, getAttackMultiplier, ATTRIBUTE_EMOJIS } from '../../lib/game-state';
import { supabase } from '../../lib/supabase-client';
import { submitQuizAnswer } from '../../lib/supabase/edge-functions';
import { gameAudio } from '../../lib/audio';
import { cards } from '../../data/cards';
import { getUnitQuestions } from '../../data/questions';
import { Swords, Timer, Trophy, ShieldAlert, Zap, HelpCircle } from 'lucide-react';

interface BossRaidScreenProps {
  sessionCode: string;
  player: Player;
  onRaidComplete: (legendaryCardId: string) => void;
  onCancel: () => void;
}

interface DamagePopup {
  id: number;
  text: string;
  x: number;
  y: number;
  isMiss: boolean;
}

interface Contribution {
  nickname: string;
  damage: number;
}

export default function BossRaidScreen({ sessionCode, player, onRaidComplete, onCancel }: BossRaidScreenProps) {
  const { unlockCard, gainItem, getLocalPlayer, setLocalPlayer, equippedCosmetics, progress } = useGameState();

  const partnerCard = useMemo(() => {
    const petId = equippedCosmetics.petId;
    if (petId && petId !== 'none') {
      const card = cards.find(c => c.id === petId);
      if (card) return card;
    }
    const unlocked = cards.filter(c => progress.unlockedCardIds.includes(c.id));
    if (unlocked.length > 0) {
      const sorted = [...unlocked].sort((a, b) => (b.power || b.attack || 20) - (a.power || a.attack || 20));
      return sorted[0];
    }
    return cards[0];
  }, [equippedCosmetics.petId, progress.unlockedCardIds]);

  const partnerLevel = progress.cardLevels?.[partnerCard.id] || 1;
  const partnerType = getCardAttribute(partnerCard.unitId);
  const partnerTypeEmoji = ATTRIBUTE_EMOJIS[partnerType];

  const [questionsPool, setQuestionsPool] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);

  // Boss HP and Rarity details (Max HP 1000)
  const [bossHp, setBossHp] = useState(1000);
  const [bossMaxHp] = useState(1000);
  const [bossCard, setBossCard] = useState<Card | null>(null);

  // Raid Timer (20 Seconds)
  const [timeLeft, setTimeLeft] = useState(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Contributions List
  const [contributions, setContributions] = useState<Record<string, Contribution>>({});
  
  // Floating Damage numbers React overlay
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const popupIdCounter = useRef(0);

  // Screen Shake/Flash/Explosion
  const [screenShake, setScreenShake] = useState(false);
  const [bossExploding, setBossExploding] = useState(false);
  const [showVictoryScreen, setShowVictoryScreen] = useState(false);

  // Leaderboard final bonus coins check
  const [bonusAwarded, setBonusAwarded] = useState(false);

  // Load questions and find unit boss card
  useEffect(() => {
    // Detect active unit from session code or use Unit 1 as fallback
    let unitId = 1;
    if (sessionCode.includes('UNIT-')) {
      const match = sessionCode.match(/UNIT-(\d+)/);
      if (match) unitId = parseInt(match[1], 10);
    }
    
    // Find legendary card for this unit
    const legendary = cards.find(c => c.unitId === unitId && c.rarity === 'legendary') as unknown as Card;
    setBossCard(legendary || (cards.find(c => c.rarity === 'legendary') as unknown as Card) || null);

    const questions = getUnitQuestions(unitId);
    // Shuffle and pick
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestionsPool(shuffled);

    // Initial player contribution
    setContributions({
      [player.id]: { nickname: player.nickname, damage: 0 }
    });
  }, [sessionCode]);

  // Realtime Subscriptions (HP change sync + damage broadcasts)
  useEffect(() => {
    if (!sessionCode) return;

    // 1. Listen to PG update on boss_hp in game_sessions
    const sessionChannel = supabase
      .channel(`session_hp_sync_${sessionCode}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `code=eq.${sessionCode}`
      }, (payload: { new: { boss_hp?: number | null } }) => {
        const nextHp = payload.new.boss_hp ?? 0;
        setBossHp(nextHp);
        
        // Notify Phaser via React Bridge
        window.dispatchEvent(new CustomEvent('react:bossHpUpdate', { detail: { hp: nextHp } }));
      })
      .subscribe();

    // 2. Broadcast Channel for player damage popups & leaderboard sync
    const broadcastChannel = supabase.channel(`session_boss_raid_${sessionCode}`);
    
    broadcastChannel
      .on('broadcast', { event: 'boss_damage' }, ({ payload }: { payload: { playerId: string; nickname: string; damage: number; isMiss: boolean } }) => {
        const { playerId, nickname, damage, isMiss } = payload;
        
        // Add Contribution
        setContributions(prev => {
          const current = prev[playerId] || { nickname, damage: 0 };
          return {
            ...prev,
            [playerId]: { nickname, damage: current.damage + damage }
          };
        });

        // Trigger damage float popup in React
        spawnPopup(damage, isMiss, nickname);
      })
      .subscribe();

    return () => {
      sessionChannel.unsubscribe();
      broadcastChannel.unsubscribe();
    };
  }, [sessionCode]);

  // Check Boss HP to trigger death explosion sequence
  useEffect(() => {
    if (bossHp <= 0 && bossCard && !bossExploding && !showVictoryScreen) {
      triggerBossDeathSequence();
    }
  }, [bossHp, bossCard]);

  // Boss Attack Timer logic
  useEffect(() => {
    if (isAnswered || bossExploding || showVictoryScreen || questionsPool.length === 0) return;

    setTimeLeft(20);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, questionsPool, isAnswered, bossExploding, showVictoryScreen]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOption(-1);
    
    // Broadcast attack miss
    broadcastAttack(0, true);

    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
  };

  const spawnPopup = (dmg: number, isMiss: boolean, label: string) => {
    const id = popupIdCounter.current++;
    const popupText = isMiss ? `${label}: 빗나감!` : `${label}: −${dmg}`;
    
    // Spawn at semi-random coordinate around boss zone
    const x = 30 + Math.random() * 40; // % range
    const y = 30 + Math.random() * 20; // % range
    
    setPopups(prev => [...prev, { id, text: popupText, x, y, isMiss }]);
    
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 1200);
  };

  const broadcastAttack = (dmg: number, isMiss: boolean, multiplier: number = 1.0) => {
    let effectSuffix = '';
    if (multiplier >= 2.0) effectSuffix = ' (효과만점!)';
    else if (multiplier <= 0.0) effectSuffix = ' (효과없음!)';
    else if (multiplier < 1.0) effectSuffix = ' (효과별로...)';

    const senderLabel = `나 (${partnerCard.name}${effectSuffix})`;

    const channel = supabase.channel(`session_boss_raid_${sessionCode}`);
    channel.send({
      type: 'broadcast',
      event: 'boss_damage',
      payload: {
        playerId: player.id,
        nickname: `${player.nickname} (${partnerCard.name}${effectSuffix})`,
        damage: dmg,
        isMiss
      }
    });

    // Update locally
    setContributions(prev => {
      const current = prev[player.id] || { nickname: player.nickname, damage: 0 };
      return {
        ...prev,
        [player.id]: { nickname: player.nickname, damage: current.damage + dmg }
      };
    });

    spawnPopup(dmg, isMiss, senderLabel);
  };

  const handleOptionClick = async (optionIndex: number) => {
    if (isAnswered || loading || !player || bossExploding) return;

    if (timerRef.current) clearInterval(timerRef.current);
    
    setSelectedOption(optionIndex);
    setLoading(true);

    const question = questionsPool[currentIndex];

    try {
      // Call edge function to submit and fetch damage calculations
      const response = await submitQuizAnswer(player.id, question.id, optionIndex);
      
      setLoading(false);
      setIsAnswered(true);

      if (response.correct) {
        gameAudio.playCorrect();
        const baseDmg = response.damage || 35; // Default 35 damage if missing
        const bossUnitId = bossCard?.unitId || 1;
        const multiplier = getAttackMultiplier(partnerCard.unitId, bossUnitId);
        const damageDealt = Math.round(baseDmg * multiplier);
        
        // Broadcast to other students
        broadcastAttack(damageDealt, false, multiplier);
        if (damageDealt > 0) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 300);
        }
      } else {
        gameAudio.playWrong();
        broadcastAttack(0, true);
      }

      setTimeout(() => {
        handleNextQuestion();
      }, 1500);

    } catch (e) {
      console.error('Raid answer submission failed:', e);
      setLoading(false);
      setIsAnswered(true);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex(prev => (prev + 1) % questionsPool.length);
  };

  const triggerBossDeathSequence = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setBossExploding(true);
    gameAudio.playCatchSuccess(); // Play epic catch success fanfare

    // Dispatch victory raid end to Phaser
    window.dispatchEvent(new CustomEvent('react:raidEnd', { detail: { victory: true } }));

    // 1. Massive explosion animation shaking screen for 2.5s
    setTimeout(() => {
      setBossExploding(false);
      setShowVictoryScreen(true);
      
      // Unlock Legendary Card to player inventory automatically
      if (bossCard) {
        unlockCard(bossCard.id);
      }

      // 2. Award bonus coins to top 3 contributors
      awardBonusCoins();
    }, 2500);
  };

  const awardBonusCoins = async () => {
    if (bonusAwarded) return;
    setBonusAwarded(true);

    const sortedLeaderboard = Object.entries(contributions)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.damage - a.damage);
    
    // Find my index
    const myRankIdx = sortedLeaderboard.findIndex(item => item.id === player.id);
    if (myRankIdx !== -1 && myRankIdx < 3) {
      // Top 3 bonus: 1st = 100, 2nd = 60, 3rd = 30 coins
      const bonus = myRankIdx === 0 ? 100 : myRankIdx === 1 ? 60 : 30;
      
      try {
        const { data: currentDbPlayer } = await supabase.from('players').select('coins').eq('id', player.id).single();
        const prevCoins = currentDbPlayer?.coins ?? player.coins;
        await supabase.from('players').update({ coins: prevCoins + bonus }).eq('id', player.id);
        
        // Update local context
        const local = getLocalPlayer();
        if (local) {
          local.coins += bonus;
          setLocalPlayer(local);
        }
      } catch (err) {
        console.error('Failed to reward leaderboard bonus coins:', err);
      }
    }
  };

  // Boss Phase & Color Logic
  const getBossPhaseInfo = () => {
    if (bossHp > 600) return { phase: 1, label: '페이즈 1', colorClass: 'text-green-400 bg-green-950/40 border-green-500/30', filter: 'hue-rotate-0 scale-100' };
    if (bossHp > 300) return { phase: 2, label: '페이즈 2', colorClass: 'text-amber-400 bg-amber-950/40 border-amber-500/30', filter: 'hue-rotate-90 saturate-150 scale-105' };
    return { phase: 3, label: '페이즈 3 (광폭화)', colorClass: 'text-red-500 bg-red-950/40 border-red-500/30 animate-pulse', filter: 'hue-rotate-180 saturate-200 scale-110' };
  };

  // HP Bar color class
  const getHpColorClass = () => {
    if (bossHp > 600) return 'bg-green-500 shadow-[0_0_10px_#10b981]';
    if (bossHp > 300) return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
    return 'bg-red-600 shadow-[0_0_12px_#ef4448] animate-pulse';
  };

  const phaseInfo = getBossPhaseInfo();
  const sortedLeaderboard = Object.entries(contributions)
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.damage - a.damage);

  if (questionsPool.length === 0) {
    return (
      <div className="absolute inset-0 bg-[#030712]/90 flex items-center justify-center text-red-500 font-mono text-sm z-50">
        LOADING BOSS RAID ENVIRONMENT...
      </div>
    );
  }

  const currentQuestion = questionsPool[currentIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className={`absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 ${
      screenShake ? 'animate-shake' : ''
    }`}>
      
      {/* Damage numbers float overlays */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {popups.map(popup => (
          <div 
            key={popup.id}
            style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
            className={`absolute font-black text-2xl filter drop-shadow-[0_0_5px_rgba(0,0,0,1)] uppercase tracking-wider animate-float-up shrink-0 select-none ${
              popup.isMiss ? 'text-gray-400' : 'text-red-500 scale-110'
            }`}
          >
            {popup.text}
          </div>
        ))}
      </div>

      {/* Top half: Boss display status & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 w-full pointer-events-auto items-start">
        
        {/* Boss HP HUD (Col-span 3) */}
        <div className="lg:col-span-3 glass-panel p-5 border-red-500/20 bg-black/80 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row gap-5 items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          {/* Ambient red neon top stripe */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-red-600 to-transparent" />
          
          <div className="flex items-center gap-4 flex-1 w-full min-w-0">
            {/* Boss Art Avatar Floating */}
            <div className={`w-24 h-24 rounded-2xl border bg-black/60 border-red-500/20 flex items-center justify-center text-6xl relative select-none shrink-0 ${
              bossExploding ? 'animate-ping border-yellow-500 bg-yellow-500/20' : 'animate-float'
            } ${phaseInfo.filter}`}>
              {bossCard?.emoji || '👹'}
              {bossExploding && (
                <div className="absolute inset-0 bg-yellow-400/30 rounded-2xl animate-ping" />
              )}
            </div>

            {/* HP segments details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-red-500 tracking-wide uppercase">{bossCard?.name || '전설 보스'}</h2>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-black uppercase tracking-widest ${phaseInfo.colorClass}`}>
                  {phaseInfo.label}
                </span>
              </div>

              <div className="flex justify-between text-xs font-mono font-bold text-gray-500 mt-2">
                <span>BOSS HP:</span>
                <span className="text-red-500">{bossHp} / {bossMaxHp} HP</span>
              </div>

              {/* Segmented HP bar every 200 HP */}
              <div className="w-full h-4 bg-gray-950/80 border border-gray-800 rounded-lg p-[2px] mt-1 relative overflow-hidden">
                <div 
                  className={`h-full rounded-md transition-all duration-300 ease-out ${getHpColorClass()}`}
                  style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
                />
                
                {/* 200 HP Segment lines (at 20%, 40%, 60%, 80%) */}
                <div className="absolute inset-y-0 left-[20%] w-[1.5px] bg-black/80" />
                <div className="absolute inset-y-0 left-[40%] w-[1.5px] bg-black/80" />
                <div className="absolute inset-y-0 left-[60%] w-[1.5px] bg-black/80" />
                <div className="absolute inset-y-0 left-[80%] w-[1.5px] bg-black/80" />
              </div>
            </div>
          </div>

          {/* Partner Pokemon HUD */}
          {partnerCard && (
            <div className="flex items-center gap-2.5 bg-cyan-950/20 border border-cyan-500/10 px-4 py-2.5 rounded-xl text-xs shrink-0 self-stretch md:self-auto justify-center">
              <div className="text-2xl animate-bounce">{partnerCard.image}</div>
              <div className="text-left leading-tight">
                <span className="text-[9px] text-gray-500 block uppercase font-mono tracking-wider">// PARTNER PET</span>
                <span className="text-xs font-black text-cyan-400 block">{partnerCard.name}</span>
                <span className="text-[9px] font-bold text-amber-400 font-mono block">
                  LV.{partnerLevel} · {partnerTypeEmoji} {partnerType}
                </span>
              </div>
            </div>
          )}

          {/* fast Timer clock */}
          {!isAnswered && !bossExploding && !showVictoryScreen && (
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-20 h-20 rounded-xl border flex flex-col items-center justify-center ${
                timeLeft <= 5 
                  ? 'border-red-500/50 bg-red-950/20 text-red-500 animate-pulse'
                  : 'border-gray-800 bg-gray-950 text-cyan-400'
              }`}>
                <Timer className="w-5 h-5 mb-0.5 animate-spin" />
                <span className="text-xl font-black font-mono">{timeLeft}s</span>
                <span className="text-[7px] font-mono text-gray-500 mt-0.5">ATTACK WINDOW</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Contribution Leaderboard (Col-span 1) */}
        <div className="lg:col-span-1 glass-panel p-4 border-red-500/10 bg-black/80 backdrop-blur-md max-h-[140px] lg:max-h-[160px] overflow-y-auto flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <h3 className="text-[10px] font-mono font-bold text-gray-500 border-b border-gray-900 pb-1.5 mb-2 uppercase flex items-center gap-1 shrink-0">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> 누적 기여도 랭킹
          </h3>
          <div className="space-y-1 overflow-y-auto pr-0.5 flex-1">
            {sortedLeaderboard.slice(0, 5).map((item, idx) => (
              <div key={item.id} className="flex justify-between items-center text-[10px] font-mono border-b border-gray-900/30 pb-0.5">
                <span className="truncate max-w-[90px] text-gray-300">
                  {idx + 1}. {item.nickname}
                </span>
                <span className="text-red-500 font-bold">-{item.damage} HP</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom half: Quiz attack panel */}
      <div className="w-full flex justify-center pointer-events-auto mt-4">
        {bossExploding ? (
          /* Explosive death overlay panel */
          <div className="glass-panel w-full max-w-4xl p-8 border-yellow-500 bg-yellow-950/20 text-center animate-shake">
            <h2 className="text-3xl font-black text-yellow-400 mb-2 animate-ping">💥 보스 대폭발 시퀀스 가동! 💥</h2>
            <p className="text-sm text-gray-300">전설 보스의 생명력이 0에 도달해 파괴되고 있습니다!</p>
          </div>
        ) : showVictoryScreen ? (
          /* Victory Details Screen */
          <div className="glass-panel w-full max-w-3xl p-6 border-amber-500/30 bg-[#070e1a]/95 text-center flex flex-col items-center gap-4 animate-scale-up">
            <h2 className="text-3xl font-black text-amber-400 tracking-wide">🏆 전설 보스 격퇴 완료 🏆</h2>
            <p className="text-xs text-gray-400 font-mono">// RAID CONQUERED // FINAL REWARDS DEPLOYED</p>
            
            <div className="w-20 h-20 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-5xl my-2">
              {bossCard?.emoji}
            </div>

            <div className="text-sm text-white font-bold">
              전설 등급 카드 <span className="text-amber-400 font-black">[{bossCard?.name}]</span>을(를) 전원 획득했습니다!
            </div>

            {/* Leaderboard Final results & coin bonus notifications */}
            <div className="w-full max-w-md bg-gray-950/80 border border-gray-900 rounded-xl p-3 text-xs space-y-1.5 font-mono">
              <span className="text-gray-500 text-[10px] block uppercase">// TOP CONTRIBUTORS (BONUS COINS)</span>
              {sortedLeaderboard.slice(0, 3).map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center text-[11px] pb-1 border-b border-gray-900 last:border-0">
                  <span className="text-amber-400 font-bold">{idx + 1}위: {item.nickname}</span>
                  <span className="text-emerald-400 font-black">+{idx === 0 ? '100' : idx === 1 ? '60' : '30'} 코인 보너스</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                gameAudio.playClick();
                // Return to StudentLobby screen routing
                onRaidComplete(bossCard?.id || 'legendary');
              }}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black text-sm font-black rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all hover:scale-105 active:scale-95 touch-target"
            >
              대기실로 돌아가기 (Close)
            </button>
          </div>
        ) : (
          /* Active Quiz Attack Panel (Large buttons, 64px min-height, letters A/B/C/D) */
          <div className="w-full max-w-4xl glass-panel p-5 border-red-500/20 bg-black/85 backdrop-blur-md shadow-2xl relative flex flex-col gap-4">
            
            {/* Question title */}
            <div className="flex justify-between items-center text-[10px] font-mono text-red-500 tracking-widest border-b border-gray-900 pb-2 mb-1">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-red-500" />
                RAID QUESTION ATTACK
              </span>
              <span>TIME LEFT: {timeLeft}s</span>
            </div>

            <p className="text-white text-base md:text-lg font-black leading-relaxed text-center mb-1">
              {currentQuestion.question}
            </p>

            {/* 4 Choices Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(currentQuestion as MCQuestion).options.map((option, idx) => {
                let btnStyle = 'border-red-500/10 hover:border-red-500/40 bg-gray-950/40 hover:bg-red-950/10 text-gray-200';
                
                if (isAnswered) {
                  if (idx === (currentQuestion as MCQuestion).correctIndex) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                  } else if (idx === selectedOption) {
                    btnStyle = 'border-red-500 bg-red-950/40 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
                  } else {
                    btnStyle = 'border-gray-950 bg-gray-950/20 text-gray-700 cursor-not-allowed opacity-30';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered || loading}
                    onClick={() => handleOptionClick(idx)}
                    className={`min-h-[64px] px-5 py-3 text-left rounded-xl border transition-all duration-200 flex items-center justify-start gap-4 touch-target ${btnStyle}`}
                  >
                    <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                      isAnswered
                        ? idx === (currentQuestion as MCQuestion).correctIndex
                          ? 'border-emerald-500 bg-emerald-500 text-black'
                          : idx === selectedOption
                            ? 'border-red-500 bg-red-500 text-black'
                            : 'border-gray-900 text-gray-700 bg-transparent'
                        : 'border-red-500/20 text-red-500 bg-transparent'
                    }`}>
                      {optionLetters[idx]}
                    </span>
                    <span className="text-[15px] md:text-[17px] font-bold leading-snug">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        )}
      </div>

      {/* Styled Animations for Boss raid */}
      <style jsx global>{`
        @keyframes float-up {
          0% {
            transform: translate(-50%, 0) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -150px) scale(1.1);
            opacity: 0;
          }
        }
        
        .animate-float-up {
          animation: float-up 1.2s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .animate-float {
          animation: float 2.5s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}
