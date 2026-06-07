'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Player, Question, MCQuestion, OXQuestion, isMCQuestion, isOXQuestion, isMatchingQuestion, isShortQuestion } from '../../types';
import { OXRenderer, MatchingRenderer, ShortAnswerRenderer } from './quiz';
import { getUnitTheme } from './quiz/unit-theme';
import CaptureMinigame, { ConsumableBall } from './quiz/CaptureMinigame';
import QuizQuitModal from './quiz/QuizQuitModal';
import { useGameState } from '../../lib/game-state';
import { supabase } from '../../lib/supabase-client';
import { submitQuizAnswer } from '../../lib/supabase/edge-functions';
import { gameAudio } from '../../lib/audio';
import { cards } from '../../data/cards';
import { getUnitQuestions } from '../../data/questions';
import { Sparkles, Flame, CheckCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

interface QuizScreenProps {
  unitId: number;
  onQuizComplete: (score: number, newlyUnlockedCardIds: string[]) => void;
  onCancel: () => void;
  questionIds?: string[]; // review mode: only quiz these specific question IDs
}

export default function QuizScreen({ unitId, onQuizComplete, onCancel, questionIds }: QuizScreenProps) {
  const isReviewMode = !!(questionIds && questionIds.length > 0);

  const {
    progress,
    getLocalPlayer,
    setLocalPlayer,
    classroomSession,
    setClassroomSession,
    unlockCard,
    useItem,
    gainCardXp,
    addWrongAnswer,
    removeWrongAnswer,
  } = useGameState();

  const [player, setPlayer] = useState<Player | null>(null);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stats
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [xpToasts, setXpToasts] = useState<Array<{ id: number; xp: number }>>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const [levelUpToast, setLevelUpToast] = useState<string | null>(null);

  useEffect(() => {
    const handleLevelUp = (e: Event) => {
      const customEvent = e as CustomEvent<{ cardId: string; name: string }>;
      const { name } = customEvent.detail;

      setLevelUpToast(`🎉 [${name}] 레벨 업!`);

      setTimeout(() => {
        setLevelUpToast(null);
      }, 3000);
    };

    window.addEventListener('react:cardLevelUp', handleLevelUp);
    return () => window.removeEventListener('react:cardLevelUp', handleLevelUp);
  }, []);

  // Standard Quiz Timer — 교사 설정값 우선, 기본 30초
  const configuredTimer = classroomSession?.settings?.timerSeconds ?? 30;
  const [timeLeft, setTimeLeft] = useState(configuredTimer);
  const [totalTime, setTotalTime] = React.useState(configuredTimer);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 교사가 settings_update 브로드캐스트로 타이머 변경 시 다음 문제부터 반영
  useEffect(() => {
    const sessionCode = classroomSession?.code;
    if (!sessionCode) return;
    const ch = supabase.channel(`settings_listen_${sessionCode}`);
    ch.on('broadcast', { event: 'settings_update' }, ({ payload }: { payload: { timerSeconds?: number } }) => {
      if (typeof payload?.timerSeconds === 'number') {
        setTotalTime(payload.timerSeconds);
        setClassroomSession({
          ...classroomSession,
          settings: { ...(classroomSession?.settings ?? { timer: true, timerSeconds: 30, battleModeEnabled: false, raidEnabled: false, allowChat: true }), timerSeconds: payload.timerSeconds }
        });
      }
    }).subscribe();
    return () => { ch.unsubscribe(); };
  }, [classroomSession?.code]);

  // Screen Flash Feedback
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);

  // Explanation display timer state
  const [explanationVisible, setExplanationVisible] = useState(false);

  // Self-directed learning: learner controls when to advance
  const [isReadyToAdvance, setIsReadyToAdvance] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Newly Unlocked Cards list
  const [newlyUnlockedCardIds, setNewlyUnlockedCardIds] = useState<string[]>([]);

  // Quit Modal State
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Rare Card Capture Minigame — 포획 대상 카드 ID (미니게임은 CaptureMinigame가 자체 관리)
  const [captureCardId, setCaptureCardId] = useState<string | null>(null);

  // Load local player and unit questions
  useEffect(() => {
    const localPlayer = getLocalPlayer();
    setPlayer(localPlayer);

    const unitQuestions = getUnitQuestions(unitId);
    let shuffled: Question[];
    if (isReviewMode && questionIds) {
      // Review mode: load only the wrong-answer questions for this unit
      const reviewSet = new Set(questionIds);
      shuffled = unitQuestions.filter(q => reviewSet.has(q.id));
    } else {
      shuffled = [...unitQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
    }
    setQuestionsList(shuffled);
  }, [unitId]);

  // Handle countdown timer
  useEffect(() => {
    if (isAnswered || captureCardId || loading || questionsList.length === 0) return;

    setTimeLeft(totalTime);
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
  }, [currentIndex, questionsList, isAnswered, captureCardId]);

  const resumeTimer = () => {
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
  };

  const handleTimeOut = () => {
    const currentQ = questionsList[currentIndex];
    if (currentQ) {
      addWrongAnswer(currentQ.id);
    }
    setSelectedOption(-1); // Timed out
    setIsAnswered(true);
    setStreak(0);
    setFlashType('wrong');
    gameAudio.playWrong();
    setExplanationVisible(true);

    setTimeout(() => {
      setFlashType(null);
      setIsReadyToAdvance(true);
    }, 800);
  };

  // ── 교사 대시보드 실시간 이벤트 송신 헬퍼 ──────────────────
  const broadcastQuizAnswer = (
    questionId: string,
    isCorrect: boolean,
    cardUnlocked?: string
  ) => {
    const sessionCode = classroomSession?.code;
    if (!sessionCode || !player) return;
    const channel = supabase.channel(`dashboard_events_${sessionCode}`);
    channel.send({
      type: 'broadcast',
      event: 'dashboard_log',
      payload: {
        type: 'quiz_answer',
        playerId: player.id,
        nickname: player.nickname,
        isCorrect,
        detail: isCorrect
          ? `정답! ${cardUnlocked ? `[${cards.find(c => c.id === cardUnlocked)?.name ?? cardUnlocked}] 카드 획득!` : ''}`
          : '오답',
        cardUnlocked: cardUnlocked ?? null,
        timestamp: Date.now(),
      },
    });
  };

  const handleOptionClick = async (optionIndex: number) => {
    if (isAnswered || loading || !player) return;

    // Stop Timer
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    setLoading(true);

    const currentQuestion = questionsList[currentIndex];

    try {
      // Call submitQuizAnswer Edge Function via Supabase Mock client
      const response = await submitQuizAnswer(player.id, currentQuestion.id, optionIndex);

      setIsAnswered(true);
      setLoading(false);

      // ── 교사 대시보드로 퀴즈 정답 이벤트 Broadcast ──
      broadcastQuizAnswer(currentQuestion.id, response.correct, response.cardUnlocked);

      if (response.correct) {
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
        setFlashType('correct');
        gameAudio.playCorrect();
        if (isReviewMode) removeWrongAnswer(currentQuestion.id);

        // ── AWARD XP ON CORRECT ANSWER ──
        // 1. All unlocked cards of this unitId get 30 XP
        const unitCardIds = cards
          .filter(c => c.unitId === unitId && progress.unlockedCardIds.includes(c.id))
          .map(c => c.id);

        // 2. Top 3 strongest cards (representing active deck) get 15 XP
        const top3Cards = cards
          .filter(c => progress.unlockedCardIds.includes(c.id))
          .sort((a, b) => (b.power || 20) - (a.power || 20))
          .slice(0, 3)
          .map(c => c.id);

        // Call gainCardXp
        if (unitCardIds.length > 0) gainCardXp(unitCardIds, 30);
        if (top3Cards.length > 0) gainCardXp(top3Cards, 15);

        // Spawn XP Toast
        const newToastId = toastIdCounter;
        setToastIdCounter(prev => prev + 1);
        setXpToasts(prev => [...prev, { id: newToastId, xp: 10 }]);
        setTimeout(() => {
          setXpToasts(prev => prev.filter(t => t.id !== newToastId));
        }, 1500);

        // Check Card Reward Unlock
        if (response.cardUnlocked) {
          const matchingCard = cards.find(c => c.id === response.cardUnlocked);
          if (matchingCard && matchingCard.rarity === 'rare') {
            // Trigger Rare Card Capture Minigame (CaptureMinigame가 조준/판정 담당)
            setCaptureCardId(response.cardUnlocked);
          } else if (response.cardUnlocked) {
            // Standard Card Unlock immediately
            unlockCard(response.cardUnlocked);
            setNewlyUnlockedCardIds(prev => [...prev, response.cardUnlocked!]);
          }
        }
      } else {
        setStreak(0);
        setFlashType('wrong');
        gameAudio.playWrong();
        addWrongAnswer(currentQuestion.id);
      }

      setExplanationVisible(true);

      // Flash effect duration: 800ms
      setTimeout(() => {
        setFlashType(null);
        // If capture game was triggered, do NOT show advance button yet
        if (response.correct && response.cardUnlocked && cards.find(c => c.id === response.cardUnlocked)?.rarity === 'rare') {
          return;
        }
        setIsReadyToAdvance(true);
      }, 800);

    } catch (error) {
      console.error('Quiz submission error:', error);
      setLoading(false);
      setIsAnswered(true);
    }
  };

  // Handler for OX/Matching/Short question types (client-side scoring)
  const handleNewTypeAnswer = (isCorrect: boolean) => {
    if (isAnswered || !player) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questionsList[currentIndex];
    setIsAnswered(true);
    broadcastQuizAnswer(q.id, isCorrect, isCorrect && q.cardReward ? q.cardReward : undefined);
    if (isCorrect) {
      setScore(prev => prev + 1); setStreak(prev => prev + 1);
      setFlashType('correct'); gameAudio.playCorrect();
      if (isReviewMode) removeWrongAnswer(q.id);
      if (q.cardReward) { unlockCard(q.cardReward); setNewlyUnlockedCardIds(prev => [...prev, q.cardReward!]); }
    } else {
      setStreak(0); setFlashType('wrong'); gameAudio.playWrong(); addWrongAnswer(q.id);
    }
    setExplanationVisible(true);
    setTimeout(() => { setFlashType(null); setIsReadyToAdvance(true); }, 800);
  };

  const handleOXAnswer = (selectedIndex: 0 | 1) => {
    const q = questionsList[currentIndex];
    if (!isOXQuestion(q)) return;
    handleNewTypeAnswer(selectedIndex === (q as OXQuestion).correctIndex);
  };

  const handleNext = () => {
    setIsReadyToAdvance(false);
    setShowHint(false);
    setExplanationVisible(false);
    if (currentIndex < questionsList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      onQuizComplete(score, newlyUnlockedCardIds);
    }
  };

  // ── 희귀 카드 포획 결과 처리 (CaptureMinigame 콜백) ────────────────
  const handleCaptureSuccess = (cid: string) => {
    unlockCard(cid);
    setNewlyUnlockedCardIds(prev => [...prev, cid]);
  };

  const handleCaptureFail = async (cid: string) => {
    // 포획 실패 시 DB에 기록된 카드 해금을 롤백
    if (!player) return;
    const updatedUnlocked = player.unlockedCards.filter(id => id !== cid);
    try {
      await supabase
        .from('players')
        .update({ unlocked_cards: updatedUnlocked })
        .eq('id', player.id);

      setLocalPlayer({ ...player, unlockedCards: updatedUnlocked });
    } catch (e) {
      console.error('Failed to rollback failed capture card unlock:', e);
    }
  };

  const handleCaptureConsumeBall = (ballType: ConsumableBall) => {
    useItem(ballType);
  };

  const handleCaptureContinue = () => {
    setCaptureCardId(null);
    handleNext();
  };

  if (questionsList.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-cyan-400 font-mono text-sm animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> LOADING QUIZ QUESTIONS...
      </div>
    );
  }

  const currentQuestion = questionsList[currentIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];

  const theme = getUnitTheme(unitId);

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 rounded-3xl border bg-gradient-to-br ${theme.bgGradient} ${theme.cardBg} ${theme.accentGlow} relative font-sans transition-all duration-500`}>
      {theme.overlayHtml}

      {/* Quit Confirmation Modal */}
      {showQuitModal && (
        <QuizQuitModal
          currentNumber={currentIndex + 1}
          total={questionsList.length}
          score={score}
          onResume={() => {
            setShowQuitModal(false);
            resumeTimer();
          }}
          onQuit={() => {
            setShowQuitModal(false);
            onCancel();
          }}
        />
      )}

      {/* XP Toast Layer */}
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none flex flex-col gap-2">
        {xpToasts.map(toast => (
          <div key={toast.id} className="px-4 py-2 bg-emerald-500 text-black font-black rounded-full text-xs shadow-lg animate-bounce flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" /> +{toast.xp} XP 획득!
          </div>
        ))}
      </div>

      {/* Full Screen Correct/Wrong Flash Overlay */}
      {flashType && (
        <div className={`fixed inset-0 z-40 transition-opacity duration-300 pointer-events-none ${
          flashType === 'correct' ? 'bg-emerald-500/20' : 'bg-red-500/20'
        }`} />
      )}

      {/* Rare Card Capture Challenge Full-Screen Overlay */}
      {captureCardId && (
        <CaptureMinigame
          cardId={captureCardId}
          ballItems={progress.items}
          onSuccess={handleCaptureSuccess}
          onFail={handleCaptureFail}
          onConsumeBall={handleCaptureConsumeBall}
          onContinue={handleCaptureContinue}
        />
      )}

      {/* Main Quiz Flow Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Question, Timer, Option lists */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header Panel */}
          <div className="glass-panel p-4 border-cyan-500/10 flex justify-between items-center gap-4 bg-[#090f1d]/60">
            <button
              onClick={() => {
                gameAudio.playClick();
                if (timerRef.current) clearInterval(timerRef.current);
                setShowQuitModal(true);
              }}
              className="px-3.5 py-1.5 border border-red-500/20 bg-red-950/20 text-red-400 hover:text-white rounded-lg text-xs font-bold btn-cyber transition-all touch-target font-mono"
            >
              ← QUIT
            </button>

            {isReviewMode && (
              <span className="px-2.5 py-1 bg-orange-950/40 border border-orange-500/40 text-orange-400 text-[10px] font-black rounded-full tracking-wide">
                🔁 오답 복습
              </span>
            )}

            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-950/20 border border-orange-500/30 px-3 py-1 rounded-full animate-pulse">
                <Flame className="w-4 h-4 text-orange-500 fill-current animate-bounce" />
                <span className="text-orange-400 font-extrabold text-xs font-mono">{streak} COMBO!</span>
              </div>
            )}

            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-mono block">PROGRESS</span>
              <span className="text-base font-extrabold text-cyan-400 font-mono">{currentIndex + 1} / {questionsList.length}</span>
            </div>
          </div>

          {/* Sliding Question Card Wrapper */}
          <div key={currentIndex} className="animate-slide-in-right relative">
            <div className={`glass-panel p-8 border-cyan-500/10 bg-gradient-to-b ${theme.cardBg} shadow-xl min-h-[160px] flex flex-col justify-center items-center text-center relative overflow-hidden`}>
              <div className="absolute top-3 left-4 text-[10px] font-mono text-cyan-400/40 uppercase tracking-widest flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
                QUESTION {currentIndex + 1}
              </div>

              {/* Timer Widget placement on card top-right */}
              {!isAnswered && (
                <div className="absolute top-3 right-4 flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                    {timeLeft}s
                  </span>
                  <svg className="w-6 h-6 transform -rotate-90">
                    <circle cx="12" cy="12" r="10" className="stroke-gray-800" strokeWidth="2" fill="transparent" />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      className={`transition-all duration-1000 ease-linear ${timeLeft <= 5 ? 'stroke-red-500' : 'stroke-cyan-400'}`}
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 10}
                      strokeDashoffset={2 * Math.PI * 10 * (1 - timeLeft / totalTime)}
                    />
                  </svg>
                </div>
              )}

              <p className="text-white text-xl md:text-2xl font-black leading-relaxed mt-6">
                {currentQuestion.question}
              </p>

              {/* Hint section */}
              {!isAnswered && currentQuestion.hint && (
                <div className="mt-4 w-full">
                  {showHint ? (
                    <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl px-4 py-3 text-left animate-slide-up">
                      <p className="text-amber-300 text-lg font-medium leading-relaxed">
                        💡 {currentQuestion.hint}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => { gameAudio.playClick(); setShowHint(true); }}
                      className="text-sm text-amber-500/70 hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/50 px-4 py-2.5 rounded-lg transition-all font-medium touch-target"
                    >
                      💡 힌트 보기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Question Type Dispatcher */}
          {isOXQuestion(currentQuestion) ? (
            <OXRenderer
              question={currentQuestion}
              isAnswered={isAnswered}
              btnCorrectStyle="border-emerald-500 bg-emerald-950/40 text-emerald-300 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              btnIncorrectStyle="border-red-500 bg-red-950/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
              onAnswer={handleOXAnswer}
            />
          ) : isMatchingQuestion(currentQuestion) ? (
            <MatchingRenderer
              question={currentQuestion}
              isAnswered={isAnswered}
              onAnswer={handleNewTypeAnswer}
            />
          ) : isShortQuestion(currentQuestion) ? (
            <ShortAnswerRenderer
              question={currentQuestion}
              isAnswered={isAnswered}
              onAnswer={handleNewTypeAnswer}
            />
          ) : (
            /* MC: A/B/C/D grid */
            <div className="grid grid-cols-1 gap-4">
              {(currentQuestion as MCQuestion).options.map((option, idx) => {
                let btnStyle = theme.btnStyle;
                if (isAnswered) {
                  if (idx === (currentQuestion as MCQuestion).correctIndex) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.25)]';
                  } else if (idx === selectedOption) {
                    btnStyle = 'border-red-500 bg-red-950/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]';
                  } else {
                    btnStyle = 'border-gray-950 bg-gray-950/20 text-gray-600 cursor-not-allowed opacity-40';
                  }
                }
                return (
                  <button
                    key={idx}
                    data-testid="mc-option"
                    disabled={isAnswered || loading}
                    onClick={() => handleOptionClick(idx)}
                    className={`min-h-[64px] px-6 py-4 text-left rounded-2xl border btn-cyber transition-all duration-200 flex items-center justify-start gap-4 touch-target ${btnStyle}`}
                  >
                    <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono font-black text-base shrink-0 ${
                      isAnswered
                        ? idx === (currentQuestion as MCQuestion).correctIndex
                          ? 'border-emerald-500 bg-emerald-500 text-black'
                          : idx === selectedOption
                            ? 'border-red-500 bg-red-500 text-black'
                            : 'border-gray-900 text-gray-700 bg-transparent'
                        : 'border-cyan-500/20 text-cyan-400 bg-transparent'
                    }`}>
                      {optionLetters[idx]}
                    </span>
                    <span className="text-xl font-bold">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Explanation Overlay Screen */}
          {explanationVisible && (
            <div className="glass-panel p-6 border-cyan-500/20 bg-gradient-to-r from-[#0d1629] to-[#040812] relative overflow-hidden animate-slide-up">
              <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {(isMCQuestion(currentQuestion) ? selectedOption === (currentQuestion as MCQuestion).correctIndex : flashType === 'correct') ? (
                      <span className="text-emerald-400 font-extrabold text-lg flex items-center gap-1.5">
                        <CheckCircle className="w-5 h-5" /> 정답입니다! (Correct)
                      </span>
                    ) : (
                      <span className="text-red-400 font-extrabold text-lg flex items-center gap-1.5">
                        <AlertTriangle className="w-5 h-5" /> 오답입니다. (Incorrect)
                      </span>
                    )}
                  </div>

                  {isMCQuestion(currentQuestion) && (
                    <div className="text-xl text-cyan-400 font-bold mb-2">
                      정답: {optionLetters[(currentQuestion as MCQuestion).correctIndex]}. {(currentQuestion as MCQuestion).options[(currentQuestion as MCQuestion).correctIndex]}
                    </div>
                  )}
                  {isOXQuestion(currentQuestion) && (
                    <div className="text-xl text-cyan-400 font-bold mb-2">
                      정답: {currentQuestion.correctIndex === 0 ? '⭕ 맞다 (O)' : '❌ 틀리다 (X)'}
                    </div>
                  )}
                  {isShortQuestion(currentQuestion) && (
                    <div className="text-xl text-cyan-400 font-bold mb-2">
                      정답: {currentQuestion.correctAnswer}
                    </div>
                  )}

                  <p className="text-gray-300 text-lg md:text-xl leading-relaxed font-medium">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>

              {/* Learner-controlled advance button */}
              {isReadyToAdvance && (
                <button
                  onClick={() => { gameAudio.playClick(); handleNext(); }}
                  className="mt-4 w-full py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black rounded-xl transition-all touch-target flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-xl"
                >
                  {currentIndex < questionsList.length - 1 ? '다음 문제 ▶' : '결과 보기 🏆'}
                </button>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Scoreboard & Stats */}
        <div className="lg:col-span-1 space-y-6">

          {/* Current Score Panel */}
          <div className="glass-panel p-5 border-cyan-500/10 bg-[#090f1d]/50 relative text-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">📊 점수판</h3>
            <div className="text-5xl font-black font-mono-numbers text-cyan-400 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              {score * 10} <span className="text-xs text-gray-500">점</span>
            </div>
            <div className="border-t border-gray-900 mt-4 pt-3 flex justify-between text-xs text-gray-400">
              <span>맞힌 문제 수:</span>
              <span className="text-white font-bold">{score} / {questionsList.length}</span>
            </div>
          </div>

          {/* Unit Card Rewards Info */}
          {currentQuestion.cardReward && (
            <div className="glass-panel p-5 border-amber-500/10 bg-amber-950/5 text-center">
              <h3 className="text-xs font-mono font-bold text-amber-500/60 uppercase tracking-widest mb-4">🎁 이 문제의 도감 보상</h3>
              <div className="w-20 h-20 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-4xl mx-auto mb-3 animate-pulse">
                {cards.find(c => c.id === currentQuestion.cardReward)?.emoji || '❓'}
              </div>
              <span className="text-base font-black text-gray-100">{cards.find(c => c.id === currentQuestion.cardReward)?.name || '보상 카드'}</span>
              <div className="text-[10px] text-gray-500 font-mono mt-1 uppercase">
                {cards.find(c => c.id === currentQuestion.cardReward)?.rarity || 'common'} Rarity
              </div>
            </div>
          )}

        </div>
      </div>

      {levelUpToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base border border-white shadow-xl rounded-xl animate-bounce select-none">
          ⭐ {levelUpToast} ⭐
        </div>
      )}
    </div>
  );
}
