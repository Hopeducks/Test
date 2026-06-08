'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useGameState } from '../../lib/game-state';
import { MCQuestion } from '../../types';
import { getUnitQuestions } from '../../data/questions';
import { cards } from '../../data/cards';
import { gameAudio } from '../../lib/audio';
import { Trophy, ShieldAlert, CheckCircle, AlertTriangle, ArrowRight, Heart } from 'lucide-react';

interface GymLeaderBattleProps {
  unitId: number;
  onClose: () => void;
  onDefeated: () => void;
  onGoToCenter: () => void;
}

const GYM_LEADERS = [
  { unitId: 1, name: '웅이 (Stone)', title: '회색체육관 관장', emoji: '🪨', badgeName: '지층 배지', badgeEmoji: '🪨', bossPokemon: '롱스톤', intro: '바위처럼 단단한 내 지적 방어벽을 뚫을 수 있겠나! 지층과 화석의 신비를 말해봐라!' },
  { unitId: 2, name: '이슬이 (Misty)', title: '블루시티체육관 관장', emoji: '🌟', badgeName: '빛의 배지', badgeEmoji: '🌟', bossPokemon: '아쿠스타', intro: '빛은 굴절하고 반사되지! 내 물의 투명함과 빛의 성질을 완벽히 이해했는지 시험하겠다!' },
  { unitId: 3, name: '마티스 (Lt. Surge)', title: '갈색체육관 관장', emoji: '⚡', badgeName: '용해 배지', badgeEmoji: '💧', bossPokemon: '라이츄', intro: '용해와 용액의 평형 상태를 과학적으로 증명해라! 번개처럼 퀴즈를 풀어보라고!' },
  { unitId: 4, name: '민화 (Erika)', title: '무지개체육관 관장', emoji: '🌸', badgeName: '우리몸 배지', badgeEmoji: '❤️', bossPokemon: '우츠보트', intro: '우리 몸의 정교한 구조와 기능에 대해 깊이 탐구하셨나요? 부드럽지만 강하게 시험하겠습니다.' },
  { unitId: 5, name: '독수 (Koga)', title: '연분홍체육관 관장', emoji: '🦎', badgeName: '생물환경 배지', badgeEmoji: '🌿', bossPokemon: '또도가스', intro: '생물과 환경은 끊임없이 상호작용한다! 그 균형을 꿰뚫는 자만이 배지를 가져갈 수 있지!' },
  { unitId: 6, name: '초련 (Sabrina)', title: '노란시티체육관 관장', emoji: '🔮', badgeName: '날씨 배지', badgeEmoji: '🌀', bossPokemon: '윤겔라', intro: '날씨의 변화는 공기의 흐름과 기압의 영향... 당신의 지식이 흐린 날씨를 걷어낼 수 있을까요?' },
  { unitId: 7, name: '강재 (Blaine)', title: '홍련섬체육관 관장', emoji: '🏃', badgeName: '운동 배지', badgeEmoji: '👟', bossPokemon: '날쌩마', intro: '물체의 속력과 운동 법칙은 아주 뜨거운 주제지! 달리는 속도만큼 빠르게 정답을 맞춰봐라!' },
  { unitId: 8, name: '비주기 (Giovanni)', title: '상록체육관 관장', emoji: '🦁', badgeName: '산염기 배지', badgeEmoji: '🧪', bossPokemon: '니드킹', intro: '마지막 관문이다! 산성과 염기성의 중화 반응, 그 완벽한 과학적 역학을 보여주거라!' }
];

export default function GymLeaderBattle({ unitId, onClose, onDefeated, onGoToCenter }: GymLeaderBattleProps) {
  const {
    unlockBadge,
    equippedCosmetics
  } = useGameState();

  const leader = useMemo(() => GYM_LEADERS.find(g => g.unitId === unitId) || GYM_LEADERS[0], [unitId]);

  // Pull comprehensive questions from unit questions
  const battleQuestions = useMemo(() => {
    const pool = getUnitQuestions(unitId);
    // Shuffle and pick 5 questions for Gym Battle
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  }, [unitId]);

  // States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chosenOpt, setChosenOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [playerHp, setPlayerHp] = useState(3); // 3 Hearts
  const [leaderHp, setLeaderHp] = useState(3); // 3 HP/Corrects needed to win
  const [battleStatus, setBattleStatus] = useState<'intro' | 'fighting' | 'won' | 'lost'>('intro');

  const activeQuestion = battleQuestions[currentIdx];

  const handleStartFight = () => {
    gameAudio.playClick();
    setBattleStatus('fighting');
  };

  const handleOptionSelect = (idx: number) => {
    if (isAnswered) return;
    setChosenOpt(idx);
  };

  const handleSubmit = () => {
    if (chosenOpt === null || !activeQuestion) return;
    setIsAnswered(true);

    const isCorrect = chosenOpt === (activeQuestion as MCQuestion).correctIndex;
    if (isCorrect) {
      gameAudio.playCorrect();
      setLeaderHp(prev => Math.max(0, prev - 1));
    } else {
      gameAudio.playWrong();
      setPlayerHp(prev => Math.max(0, prev - 1));
    }
  };

  // Evaluate hp updates after each answer resolves
  const handleNext = () => {
    setIsAnswered(false);
    setChosenOpt(null);

    if (leaderHp <= 0) {
      // Victory! 배지 해금 + 최초 격파 시 마일스톤 코인은 unlockBadge 내부에서 지급(Phase 1.3).
      gameAudio.playCatchSuccess();
      unlockBadge(unitId);

      setBattleStatus('won');
      onDefeated();
    } else if (playerHp <= 0) {
      // Defeated!
      setBattleStatus('lost');
    } else if (currentIdx < battleQuestions.length - 1) {
      // Go to next question
      setCurrentIdx(prev => prev + 1);
    } else {
      // Solved all 5 questions but leaderHp still > 0
      setBattleStatus('lost');
    }
  };

  const partnerCard = useMemo(() => {
    const petId = equippedCosmetics?.petId;
    if (petId && petId !== 'none') {
      return cards.find(c => c.id === petId) || cards[0];
    }
    return cards[0];
  }, [equippedCosmetics?.petId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-4xl p-6 border-red-500/30 bg-gradient-to-b from-[#170a0a] to-[#040101] text-gray-100 shadow-2xl relative flex flex-col max-h-[95vh] overflow-y-auto">
        
        {/* Title bar */}
        <div className="flex justify-between items-center border-b border-red-500/20 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500 fill-current animate-bounce" />
            <h2 className="text-xl md:text-2xl font-black text-amber-400">대단원 평가 — 체육관 관장 배틀 (Gym Leader Battle)</h2>
          </div>
          {battleStatus !== 'fighting' && (
            <button 
              onClick={() => { gameAudio.playClick(); onClose(); }}
              className="px-3.5 py-1.5 border border-red-500/20 bg-red-950/20 hover:border-red-400 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all"
            >
              도망치기
            </button>
          )}
        </div>

        {/* BATTLE SCREEN: INTRO DIALOGUE */}
        {battleStatus === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12 space-y-8 animate-scale-up">
            <div className="flex items-center justify-center gap-8">
              <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-5xl animate-pulse select-none font-emoji">
                {leader.emoji}
              </div>
              <div className="text-4xl text-gray-500 font-bold select-none">VS</div>
              <div className="w-24 h-24 rounded-full bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-5xl animate-pulse select-none font-emoji">
                {partnerCard.emoji || partnerCard.image}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-red-500 uppercase tracking-widest block">// {leader.title} //</span>
              <h3 className="text-2xl font-black text-red-400">{leader.name}</h3>
              <div className="glass-panel p-5 border-red-500/10 bg-red-950/5 relative rounded-2xl mt-4">
                <p className="text-base text-gray-200 leading-relaxed font-semibold italic">
                  &ldquo;{leader.intro}&rdquo;
                </p>
              </div>
            </div>

            <button
              onClick={handleStartFight}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all hover:scale-102 active:scale-98"
            >
              관장에게 도전하기! (Battle Start)
            </button>
          </div>
        )}

        {/* BATTLE SCREEN: ENGAGED FIGHTING */}
        {battleStatus === 'fighting' && activeQuestion && (
          <div className="flex-1 flex flex-col gap-6 animate-slide-up">
            
            {/* HUD: Boss Leader vs Player Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-900 pb-4">
              {/* Leader Status */}
              <div className="p-3 bg-red-950/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-emoji">{leader.emoji}</span>
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono block">GYM LEADER</span>
                    <span className="text-sm font-bold text-red-400">{leader.name}</span>
                  </div>
                </div>
                {/* Boss Shield/HP Icons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3.5 h-3.5 rounded-full border border-red-500 ${
                        i < leaderHp ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' : 'bg-transparent border-red-950'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {/* Player Status */}
              <div className="p-3 bg-cyan-950/10 border border-cyan-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-emoji">{partnerCard.emoji || partnerCard.image}</span>
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono block">CHALLENGER PET</span>
                    <span className="text-sm font-bold text-cyan-400">{partnerCard.name}</span>
                  </div>
                </div>
                {/* Player Hearts */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart 
                      key={i} 
                      className={`w-5 h-5 ${
                        i < playerHp ? 'text-red-500 fill-current animate-pulse' : 'text-gray-800'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Question Screen */}
            <div className="glass-panel p-6 border-red-500/10 bg-[#0e0708] shadow-lg min-h-[120px] flex flex-col justify-center relative overflow-hidden">
              <span className="absolute top-3 left-4 text-[10px] font-mono text-red-500/50 uppercase tracking-widest">
                GYM EVALUATION QUESTION {currentIdx + 1} / 5
              </span>
              <p className="text-white text-lg md:text-xl font-black leading-relaxed mt-4">
                {activeQuestion.question}
              </p>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeQuestion as MCQuestion).options.map((opt, idx) => {
                let btnStyle = 'border-red-500/10 hover:border-red-500/40 hover:bg-red-950/10 text-gray-200';
                
                if (isAnswered) {
                  if (idx === (activeQuestion as MCQuestion).correctIndex) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-extrabold';
                  } else if (idx === chosenOpt) {
                    btnStyle = 'border-red-500 bg-red-950/40 text-red-300';
                  } else {
                    btnStyle = 'border-gray-950 bg-gray-950/20 text-gray-650 opacity-40';
                  }
                } else if (idx === chosenOpt) {
                  btnStyle = 'border-amber-400 bg-amber-950/20 text-amber-300';
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleOptionSelect(idx)}
                    className={`p-4 text-left border rounded-xl transition-all duration-200 flex items-center gap-3 ${btnStyle}`}
                  >
                    <span className={`w-7 h-7 rounded-full border flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                      chosenOpt === idx ? 'border-amber-400 bg-amber-400 text-black' : 'border-red-500/20'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-[15px] md:text-[16px] font-bold">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Answer feedback banner */}
            {isAnswered && (
              <div className="glass-panel p-5 border-red-500/20 bg-[#120708] relative overflow-hidden animate-slide-up flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1">
                  <h4 className={`text-base font-black ${chosenOpt === (activeQuestion as MCQuestion).correctIndex ? 'text-green-400' : 'text-red-500'}`}>
                    {chosenOpt === (activeQuestion as MCQuestion).correctIndex 
                      ? '💥 정확한 대답이다! 관장의 보스 포켓몬에게 큰 데미지를 주었습니다.' 
                      : '❌ 틀린 대답이다! 관장의 반격에 피해를 입었습니다.'}
                  </h4>
                  <p className="text-gray-300 font-sans text-xs mt-1 leading-relaxed text-justify">
                    {activeQuestion.explanation}
                  </p>
                </div>
                
                <button
                  onClick={handleNext}
                  className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md self-center md:self-end"
                >
                  계속 진행하기
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Action Submit */}
            {!isAnswered && (
              <button
                disabled={chosenOpt === null}
                onClick={handleSubmit}
                className={`w-full py-3.5 rounded-xl font-bold tracking-widest text-sm transition-all ${
                  chosenOpt !== null
                    ? 'bg-amber-500 text-black hover:bg-amber-450 hover:shadow-md'
                    : 'bg-gray-900 text-gray-600 border border-gray-950 cursor-not-allowed'
                }`}
              >
                답안 제출하기
              </button>
            )}

          </div>
        )}

        {/* BATTLE SCREEN: WON */}
        {battleStatus === 'won' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12 space-y-6 animate-scale-up">
            <span className="text-8xl animate-bounce">🏆</span>
            <div className="space-y-1">
              <span className="text-xs font-mono text-green-400 tracking-widest block">// BATTLE VICTORY //</span>
              <h3 className="text-2xl font-black text-emerald-400">체육관 도장깨기 성공!</h3>
              <p className="text-sm text-gray-300 font-medium font-sans">
                관장 {leader.name}을 물리치고 정식으로 자격을 인정받았습니다!
              </p>
            </div>

            {/* Unlocked Badge presentation card */}
            <div className="w-full p-6 border-2 border-amber-400 bg-gradient-to-b from-[#1b1912] to-[#0a0805] rounded-2xl flex flex-col items-center shadow-xl">
              <span className="text-6xl mb-3 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse font-emoji">{leader.badgeEmoji}</span>
              <h4 className="text-base font-black text-amber-400">{leader.badgeName} 획득!</h4>
              <p className="text-[10px] text-gray-500 font-sans mt-0.5">아바타 의상 커스터마이즈 탭에 배지가 해금되었습니다.</p>
              <div className="mt-4 inline-flex items-center gap-1 bg-amber-400 text-black text-xs font-black px-4 py-1.5 rounded-full">
                🪙 +150 코인 보상 획득!
              </div>
            </div>

            <button
              onClick={() => { gameAudio.playClick(); onClose(); }}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-450 text-black font-black text-sm rounded-xl transition-all"
            >
              대기실로 돌아가기
            </button>
          </div>
        )}

        {/* BATTLE SCREEN: LOST */}
        {battleStatus === 'lost' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12 space-y-6 animate-scale-up">
            <span className="text-7xl filter grayscale opacity-60">💀</span>
            <div className="space-y-1">
              <span className="text-xs font-mono text-red-500 tracking-widest block">// BATTLE DEFEAT //</span>
              <h3 className="text-2xl font-black text-red-400">눈앞이 캄캄해졌다...</h3>
              <p className="text-sm text-gray-350 leading-relaxed font-sans mt-2">
                “아쉽구나! 아직 단원 핵심 지식이 완전하지 않은 듯하다. 포켓몬 센터에서 복습(오답 치료)을 하여 상처받은 포켓몬들을 치료하고 다시 찾아오도록 해라!”
              </p>
            </div>

            <div className="flex gap-4 w-full mt-4">
              <button
                onClick={() => { gameAudio.playClick(); onClose(); }}
                className="flex-1 py-3.5 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-xl transition-all font-bold"
              >
                닫기
              </button>
              <button
                onClick={() => { gameAudio.playClick(); onGoToCenter(); }}
                className="flex-1 py-3.5 bg-pink-500 hover:bg-pink-400 text-black font-black rounded-xl transition-all hover:shadow-[0_0_10px_rgba(236,72,153,0.3)]"
              >
                🩺 포켓몬 센터로 이동
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
