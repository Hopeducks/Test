'use client';

import React, { useState } from 'react';
import { useGameState } from '../../lib/game-state';
import { MCQuestion } from '../../types';
import { questions } from '../../data/questions';
import { cards } from '../../data/cards';
import { gameAudio } from '../../lib/audio';
import { Heart, Sparkles, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface PokemonCenterProps {
  onClose: () => void;
}

export default function PokemonCenter({ onClose }: PokemonCenterProps) {
  const { 
    progress, 
    removeWrongAnswer, 
    gainCardXp
  } = useGameState();

  const wrongAnswerIds = progress.wrongAnswers || [];
  
  // Resolve actual question objects
  const wrongQuestions = wrongAnswerIds
    .map(id => questions.find(q => q.id === id))
    .filter((q): q is typeof questions[number] => q !== undefined);

  // States
  const [selectedQuestion, setSelectedQuestion] = useState<typeof questions[number] | null>(null);
  const [chosenOption, setChosenOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHealSuccess, setShowHealSuccess] = useState(false);
  const [healedCardName, setHealedCardName] = useState('');
  const [healedCardEmoji, setHealedCardEmoji] = useState('❤️');

  const handleHealStart = (q: typeof questions[number]) => {
    gameAudio.playClick();
    setSelectedQuestion(q);
    setChosenOption(null);
    setIsSubmitted(false);
  };

  const handleOptionSelect = (idx: number) => {
    if (isSubmitted) return;
    setChosenOption(idx);
  };

  const handleSubmit = () => {
    if (chosenOption === null || !selectedQuestion) return;
    setIsSubmitted(true);

    const isCorrect = chosenOption === (selectedQuestion as MCQuestion).correctIndex;
    if (isCorrect) {
      gameAudio.playCorrect();
      
      // Heal operation (오답 복습 성공 = 치료). 코인 대신 카드 경험치로 보상. (PRD EPIC A/D)
      removeWrongAnswer(selectedQuestion.id);

      // Find pokemon card linked to this question reward
      const matchingCard = cards.find(c => c.id === selectedQuestion.cardReward) || cards[0];
      gainCardXp([matchingCard.id], 20);
      setHealedCardName(matchingCard.name);
      setHealedCardEmoji(matchingCard.emoji || matchingCard.image || '🧬');

      // Success animation
      setShowHealSuccess(true);
      setTimeout(() => {
        setShowHealSuccess(false);
        setSelectedQuestion(null);
      }, 2500);

    } else {
      gameAudio.playWrong();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-4xl p-6 border-pink-500/30 bg-gradient-to-b from-[#1c0f13] to-[#0a0507] text-gray-100 shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-pink-500/20 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500 fill-current animate-pulse" />
            <h2 className="text-xl md:text-2xl font-black text-pink-400">포켓몬 센터 & 복습소 (Pokemon Center)</h2>
          </div>
          <button 
            onClick={() => { gameAudio.playClick(); onClose(); }}
            className="p-1 rounded bg-gray-900 border border-gray-800 hover:border-pink-500 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner layout split */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto flex-1 pr-1">
          
          {/* Left panel: Nurse Joy & Status */}
          <div className="glass-panel p-5 border-pink-500/10 bg-pink-950/5 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-pink-500/10 border-2 border-pink-500/40 flex items-center justify-center text-5xl mb-4 relative">
              👩‍⚕️
              <span className="absolute bottom-0 right-0 text-xl animate-bounce">💖</span>
            </div>
            <h3 className="text-base font-black text-pink-400 mb-2">간호사 조이 (Joy)</h3>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              “안녕하세요! 과학 마스터 포켓몬 센터입니다. 문제를 틀려 상처 입은 포켓몬들이 보조 치료를 기다리고 있어요. 오답 문제를 올바르게 다시 풀어 치료해 주세요!”
            </p>
            <div className="mt-6 w-full p-3 bg-pink-950/20 border border-pink-500/20 rounded-xl text-xs flex justify-between font-mono">
              <span>치료 대기 중:</span>
              <span className="font-bold text-pink-400">{wrongQuestions.length} 마리</span>
            </div>
          </div>

          {/* Right panel: Wrong questions list */}
          <div className="md:col-span-2 space-y-3 flex flex-col justify-start">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">// 오답 복습 및 치료 리스트</h3>
            
            {wrongQuestions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-2xl p-12 text-center">
                <span className="text-5xl mb-4">✨</span>
                <h4 className="text-base font-bold text-emerald-400">모든 포켓몬이 건강합니다!</h4>
                <p className="text-xs text-gray-500 mt-1 font-sans">다친 포켓몬이 없어요. 퀴즈를 열심히 복습하신 결과물입니다!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {wrongQuestions.map((q) => {
                  const unitNames = [
                    '지층과 화석', '빛의 성질', '용해와 용액', '우리 몸의 구조',
                    '생물과 환경', '날씨와 생활', '물체의 운동', '산과 염기'
                  ];
                  const linkedCard = cards.find(c => c.id === q.cardReward) || cards[0];

                  return (
                    <div 
                      key={q.id}
                      className="p-3 border border-pink-500/10 bg-pink-950/5 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl shrink-0 filter grayscale opacity-45">{linkedCard.emoji || linkedCard.image}</span>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-pink-400 uppercase tracking-widest block">
                            UNIT {q.unitId} · {unitNames[q.unitId - 1]}
                          </span>
                          <p className="text-xs text-gray-200 font-bold truncate mt-0.5">
                            {q.question}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleHealStart(q)}
                        className="shrink-0 text-xs font-black bg-pink-500 hover:bg-pink-400 text-black px-4 py-2 rounded-lg shadow-md transition-all active:scale-95"
                      >
                        치료하기
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Healer Question Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 border-pink-500/30 bg-gradient-to-b from-[#1b0d10] to-[#070304] text-center shadow-2xl relative">
            
            {showHealSuccess ? (
              <div className="py-8 space-y-4 animate-scale-up">
                <div className="text-6xl animate-bounce">{healedCardEmoji}</div>
                <h3 className="text-xl font-black text-green-400">포켓몬 치료 완료!</h3>
                <p className="text-sm text-gray-300">
                  [{healedCardName}] 포켓몬이 활기차게 기운을 찾았습니다!
                </p>
                <div className="inline-flex items-center gap-1 bg-amber-400 text-black text-xs font-black px-3 py-1 rounded-full">
                  🪙 +10 코인 획득!
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold text-pink-400 mb-4 border-b border-pink-950 pb-2">🩺 오답 집중 치료</h3>
                <p className="text-white text-lg font-bold leading-relaxed mb-6">
                  {selectedQuestion.question}
                </p>

                <div className="space-y-3 mb-6">
                  {(selectedQuestion as MCQuestion).options.map((opt, idx) => {
                    let btnStyle = 'border-pink-500/10 hover:border-pink-400/40 bg-gray-950/30 text-gray-200';
                    if (isSubmitted) {
                      if (idx === (selectedQuestion as MCQuestion).correctIndex) {
                        btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-extrabold';
                      } else if (idx === chosenOption) {
                        btnStyle = 'border-red-500 bg-red-950/40 text-red-300';
                      } else {
                        btnStyle = 'border-gray-900 bg-gray-950/20 text-gray-600 opacity-40';
                      }
                    } else if (idx === chosenOption) {
                      btnStyle = 'border-pink-500 bg-pink-950/30 text-pink-400';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isSubmitted}
                        onClick={() => handleOptionSelect(idx)}
                        className={`w-full p-4 text-left border rounded-xl transition-all duration-200 flex items-center gap-3 ${btnStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          chosenOption === idx ? 'border-pink-500 bg-pink-500 text-black' : 'border-gray-800'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {isSubmitted && chosenOption !== (selectedQuestion as MCQuestion).correctIndex && (
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-left text-xs mb-6 font-sans">
                    <span className="text-red-400 font-bold block mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      치료 실패 (오답 설명)
                    </span>
                    <p className="text-gray-300">{selectedQuestion.explanation}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedQuestion(null)}
                    className="flex-1 py-3.5 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white border border-gray-850 rounded-xl transition-all"
                  >
                    {isSubmitted && chosenOption !== (selectedQuestion as MCQuestion).correctIndex ? '다시 고민해보기' : '닫기'}
                  </button>

                  {!isSubmitted && (
                    <button
                      disabled={chosenOption === null}
                      onClick={handleSubmit}
                      className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${
                        chosenOption !== null 
                          ? 'bg-pink-500 text-black hover:bg-pink-400 shadow-md' 
                          : 'bg-gray-900 text-gray-600 border border-gray-950 cursor-not-allowed'
                      }`}
                    >
                      제출하기 (치료 시도)
                    </button>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
