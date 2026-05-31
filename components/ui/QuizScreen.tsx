'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Player, Question, CostumeId } from '../../types';
import { useGameState } from '../../lib/game-state';
import { supabase } from '../../lib/supabase-client';
import { submitQuizAnswer } from '../../lib/supabase/edge-functions';
import { gameAudio } from '../../lib/audio';
import { cards } from '../../data/cards';
import { getUnitQuestions } from '../../data/questions';
import { Sparkles, Timer, Flame, CheckCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

interface UnitTheme {
  name: string;
  bgGradient: string;
  cardBg: string;
  accentGlow: string;
  textColor: string;
  btnStyle: string;
  btnCorrect: string;
  btnIncorrect: string;
  overlayHtml?: React.ReactNode;
}

function getUnitTheme(unitId: number): UnitTheme {
  switch (unitId) {
    case 1:
      return {
        name: '지층과 화석',
        bgGradient: 'from-stone-900 to-amber-950',
        cardBg: 'bg-stone-950/80 border-stone-750/30',
        accentGlow: 'shadow-[0_0_15px_rgba(120,113,108,0.15)]',
        textColor: 'text-stone-400',
        btnStyle: 'border-stone-500/20 hover:border-stone-450 hover:bg-stone-900/30 text-stone-200 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-stone-400 via-stone-600 to-transparent" />
        )
      };
    case 2:
      return {
        name: '빛의 성질',
        bgGradient: 'from-yellow-950 via-gray-950 to-amber-950',
        cardBg: 'bg-black/80 border-yellow-500/20',
        accentGlow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
        textColor: 'text-yellow-400',
        btnStyle: 'border-yellow-500/20 hover:border-yellow-450 hover:bg-yellow-950/20 text-yellow-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[2px] h-full bg-gradient-to-b from-yellow-400 via-amber-500 to-transparent blur-[1px] animate-pulse" />
            <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-yellow-300 via-transparent to-transparent blur-[0.5px]" />
          </div>
        )
      };
    case 3:
      return {
        name: '용해와 용액',
        bgGradient: 'from-blue-950 to-indigo-950',
        cardBg: 'bg-indigo-950/50 border-blue-500/20 backdrop-blur-md',
        accentGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
        textColor: 'text-blue-400',
        btnStyle: 'border-blue-500/20 hover:border-blue-400 hover:bg-blue-950/20 text-blue-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.08] overflow-hidden">
            <div className="absolute bottom-4 left-4 w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '4s' }} />
            <div className="absolute bottom-10 left-36 w-4 h-4 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '6s' }} />
            <div className="absolute bottom-6 left-72 w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '5s' }} />
            <div className="absolute bottom-20 right-12 w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
          </div>
        )
      };
    case 4:
      return {
        name: '우리 몸의 구조와 기능',
        bgGradient: 'from-purple-950 to-fuchsia-950',
        cardBg: 'bg-purple-950/70 border-fuchsia-500/20',
        accentGlow: 'shadow-[0_0_15px_rgba(217,70,239,0.15)]',
        textColor: 'text-fuchsia-400',
        btnStyle: 'border-fuchsia-500/20 hover:border-fuchsia-400 hover:bg-fuchsia-950/20 text-fuchsia-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
            <div className="w-full h-full bg-[linear-gradient(90deg,transparent_49%,rgba(217,70,239,0.2)_50%,transparent_51%)] bg-[length:40px_40px] animate-pulse" />
          </div>
        )
      };
    case 5:
      return {
        name: '생물과 환경',
        bgGradient: 'from-emerald-950 to-stone-900',
        cardBg: 'bg-stone-950/70 border-emerald-500/20',
        accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        textColor: 'text-emerald-400',
        btnStyle: 'border-emerald-500/20 hover:border-emerald-400 hover:bg-emerald-950/20 text-emerald-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] overflow-hidden">
            <span className="absolute top-10 left-12 text-base text-emerald-500 animate-pulse select-none opacity-40">🍃</span>
            <span className="absolute bottom-20 right-16 text-sm text-emerald-400 animate-bounce select-none opacity-30">🌱</span>
          </div>
        )
      };
    case 6:
      return {
        name: '날씨와 우리 생활',
        bgGradient: 'from-cyan-950 to-slate-900',
        cardBg: 'bg-slate-950/70 border-cyan-500/20',
        accentGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        textColor: 'text-cyan-400',
        btnStyle: 'border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/20 text-cyan-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.15),transparent)] animate-pulse" />
          </div>
        )
      };
    case 7:
      return {
        name: '물체의 운동',
        bgGradient: 'from-slate-800 to-zinc-950',
        cardBg: 'bg-zinc-950/80 border-slate-600/30',
        accentGlow: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
        textColor: 'text-slate-400',
        btnStyle: 'border-slate-500/20 hover:border-slate-400 hover:bg-slate-900/30 text-slate-200 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] overflow-hidden">
            <div className="absolute top-1/3 left-0 w-full h-[1px] bg-white animate-pulse" />
            <div className="absolute top-2/3 left-0 w-full h-[1px] bg-slate-400" />
          </div>
        )
      };
    case 8:
      return {
        name: '산과 염기',
        bgGradient: 'from-red-950 to-purple-950',
        cardBg: 'bg-purple-950/40 border-red-500/20 backdrop-blur-sm',
        accentGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        textColor: 'text-red-400',
        btnStyle: 'border-red-500/20 hover:border-red-400 hover:bg-red-950/20 text-red-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] overflow-hidden">
            <div className="absolute bottom-4 left-12 w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute bottom-12 left-48 w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '1.2s' }} />
            <div className="absolute bottom-8 right-24 w-4.5 h-4.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }} />
          </div>
        )
      };
    default:
      return {
        name: '과학 퀴즈',
        bgGradient: 'from-[#0b0f19] to-[#04060c]',
        cardBg: 'bg-[#090f1d]/60 border-cyan-500/10',
        accentGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.1)]',
        textColor: 'text-cyan-400',
        btnStyle: 'border-cyan-500/10 hover:border-cyan-400/40 bg-gray-950/30 hover:bg-cyan-950/10 text-gray-250 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
      };
  }
}

interface QuizScreenProps {
  unitId: number;
  onQuizComplete: (score: number, newlyUnlockedCardIds: string[]) => void;
  onCancel: () => void;
}

export default function QuizScreen({ unitId, onQuizComplete, onCancel }: QuizScreenProps) {
  const { 
    progress, 
    studentName, 
    getLocalPlayer, 
    setLocalPlayer,
    classroomSession,
    setClassroomSession,
    unlockCard,
    useItem,
    gainCardXp,
    addWrongAnswer
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
      
      const t = setTimeout(() => {
        setLevelUpToast(null);
      }, 3000);
    };

    window.addEventListener('react:cardLevelUp', handleLevelUp);
    return () => window.removeEventListener('react:cardLevelUp', handleLevelUp);
  }, []);

  // Standard Quiz Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Screen Flash Feedback
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);

  // Explanation display timer state
  const [explanationVisible, setExplanationVisible] = useState(false);

  // Newly Unlocked Cards list
  const [newlyUnlockedCardIds, setNewlyUnlockedCardIds] = useState<string[]>([]);

  // Quit Modal State
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Capture Minigame States
  const [captureCardId, setCaptureCardId] = useState<string | null>(null);
  const [greenZoneLeft, setGreenZoneLeft] = useState(100); // 0px to 680px range
  const [captureStatus, setCaptureStatus] = useState<'aiming' | 'success' | 'fail' | null>(null);
  const [selectedBallType, setSelectedBallType] = useState<'monsterBall' | 'superBall' | 'ultraBall' | 'masterBall'>('monsterBall');
  const captureAnimRef = useRef<number | null>(null);
  const captureStartTimeRef = useRef<number | null>(null);

  // Load local player and unit questions
  useEffect(() => {
    const localPlayer = getLocalPlayer();
    setPlayer(localPlayer);

    const unitQuestions = getUnitQuestions(unitId);
    // Shuffle and pick 10
    const shuffled = [...unitQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
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
      // Wait for user to read or auto-advance
      setTimeout(() => {
        setExplanationVisible(false);
        handleNext();
      }, 3000);
    }, 800);
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

      if (response.correct) {
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
        setFlashType('correct');
        gameAudio.playCorrect();

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
            // Trigger Rare Card Capture Minigame
            setCaptureCardId(response.cardUnlocked);
            setCaptureStatus('aiming');
            captureStartTimeRef.current = null;
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
        // If capture game was triggered, do NOT auto-advance quiz yet
        if (response.correct && response.cardUnlocked && cards.find(c => c.id === response.cardUnlocked)?.rarity === 'rare') {
          // Pause and let the capture screen take over
          return;
        }

        // Standard auto-advance after explanation shown (800ms more for readability)
        setTimeout(() => {
          setExplanationVisible(false);
          handleNext();
        }, 2200);
      }, 800);

    } catch (error) {
      console.error('Quiz submission error:', error);
      setLoading(false);
      setIsAnswered(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < 9) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Completed standard quiz
      onQuizComplete(score, newlyUnlockedCardIds);
    }
  };

  // ── Rare Card Capture Minigame Loops ──────────────────────────────────────
  useEffect(() => {
    if (!captureCardId || captureStatus !== 'aiming') {
      if (captureAnimRef.current) cancelAnimationFrame(captureAnimRef.current);
      return;
    }

    const animateGreenZone = (timestamp: number) => {
      if (!captureStartTimeRef.current) captureStartTimeRef.current = timestamp;
      const elapsedSeconds = (timestamp - captureStartTimeRef.current) / 1000;

      // Track dimensions: 800px wide horizontal track
      const ballWidth = getBallWidth(selectedBallType);
      // Max boundary for left alignment = 800 - ballWidth
      const maxLeft = Math.max(0, 800 - ballWidth);
      
      // Speed: 200px/s for rare
      const speed = 200;
      
      // Calculate oscillation using a sine wave with easing (starts slow at boundaries, fast in middle)
      // Cycle width = 2 * maxLeft. Period = (2 * maxLeft) / speed
      const period = maxLeft > 0 ? (2 * maxLeft) / speed : 1;
      const omega = (2 * Math.PI) / period;
      
      // Position maps to sine oscillation
      const leftPos = maxLeft > 0 ? (maxLeft / 2) + (maxLeft / 2) * Math.sin(omega * elapsedSeconds) : 0;

      setGreenZoneLeft(leftPos);
      captureAnimRef.current = requestAnimationFrame(animateGreenZone);
    };

    captureAnimRef.current = requestAnimationFrame(animateGreenZone);

    // Keyboard Listener for Space Key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerCaptureAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (captureAnimRef.current) cancelAnimationFrame(captureAnimRef.current);
    };
  }, [captureCardId, captureStatus]);

  const getBallWidth = (type: string) => {
    if (type === 'superBall') return 180;
    if (type === 'ultraBall') return 240;
    if (type === 'masterBall') return 800;
    return 120;
  };

  const triggerCaptureAction = async () => {
    if (captureStatus !== 'aiming' || !captureCardId) return;

    if (captureAnimRef.current) cancelAnimationFrame(captureAnimRef.current);
    
    // Capture point/marker is in the center of the track (400px)
    const targetPoint = 400;
    const ballWidth = getBallWidth(selectedBallType);
    
    // Check if 400px falls inside the current greenZone range: [left, left + ballWidth]
    const isSuccess = targetPoint >= greenZoneLeft && targetPoint <= (greenZoneLeft + ballWidth);

    if (isSuccess) {
      gameAudio.playCatchSuccess();
      setCaptureStatus('success');
      unlockCard(captureCardId);
      setNewlyUnlockedCardIds(prev => [...prev, captureCardId]);
      
      // Consume ball item
      if (selectedBallType !== 'monsterBall') {
        useItem(selectedBallType);
        const remaining = (progress.items?.[selectedBallType] || 1) - 1;
        if (remaining <= 0) {
          setSelectedBallType('monsterBall');
        }
      }
    } else {
      gameAudio.playWrong();
      setCaptureStatus('fail');
      
      // Consume ball item
      if (selectedBallType !== 'monsterBall') {
        useItem(selectedBallType);
        const remaining = (progress.items?.[selectedBallType] || 1) - 1;
        if (remaining <= 0) {
          setSelectedBallType('monsterBall');
        }
      }
      
      // Rollback card unlock in database if capture fails
      if (player) {
        const updatedUnlocked = player.unlockedCards.filter(id => id !== captureCardId);
        try {
          await supabase
            .from('players')
            .update({ unlocked_cards: updatedUnlocked })
            .eq('id', player.id);
          
          const updatedPlayer = { ...player, unlockedCards: updatedUnlocked };
          setLocalPlayer(updatedPlayer);
        } catch (e) {
          console.error('Failed to rollback failed capture card unlock:', e);
        }
      }
    }
  };

  const handleCaptureContinue = () => {
    setCaptureCardId(null);
    setCaptureStatus(null);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 border-red-500/30 bg-gradient-to-b from-[#180a0a] to-[#0a0505] shadow-2xl relative">
            <h2 className="text-2xl font-black text-red-400 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              퀴즈를 중단하시겠습니까?
            </h2>

            <p className="text-gray-300 text-base leading-relaxed mb-6 font-medium">
              현재 {currentIndex + 1}/10 문제 완료 · {score}문제 정답
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  gameAudio.playClick();
                  setShowQuitModal(false);
                  resumeTimer();
                }}
                className="flex-1 py-3 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-bold rounded-lg transition-all touch-target"
              >
                계속 풀기
              </button>

              <button
                onClick={() => {
                  gameAudio.playClick();
                  setShowQuitModal(false);
                  onCancel();
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] touch-target"
              >
                퀴즈 중단하기
              </button>
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-5xl bg-gradient-to-b from-[#18110a] to-[#050302] border border-amber-500/30 rounded-3xl p-8 text-center relative shadow-2xl overflow-hidden flex flex-col items-center">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,transparent_60%)] pointer-events-none" />

            <h2 className="text-3xl md:text-4xl font-black text-amber-400 mb-2 tracking-wide font-sans animate-pulse filter drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              ✨ 희귀 카드 포획 찬스! ✨
            </h2>
            <p className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest mb-10">
              // CHANCE TO CAPTURE RARE SCIENCE CARD // PRESS SPACE OR TAP TO CATCH
            </p>

            {/* 3D Card Display Area */}
            <div className="w-56 h-72 relative perspective-1000 mb-10 select-none">
              <div className={`w-full h-full relative duration-700 preserve-3d transition-transform ${
                captureStatus === 'success' ? 'rotate-y-180' : ''
              }`}>
                {/* Card Front (Silhouette or Hidden Card before catch) */}
                <div className="absolute inset-0 backface-hidden bg-gray-900/60 border-2 border-dashed border-amber-500/20 rounded-2xl flex flex-col items-center justify-center p-4">
                  <div className={`text-7xl mb-4 opacity-35 ${
                    captureStatus === 'fail' ? 'scale-90 rotate-12 filter grayscale contrast-200' : 'animate-pulse'
                  }`}>
                    {cards.find(c => c.id === captureCardId)?.emoji || '❓'}
                  </div>
                  {captureStatus === 'fail' && (
                    <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center">
                      <span className="text-red-500 text-5xl font-black rotate-12 border-4 border-red-500 px-3 py-1 rounded-xl">ESCAPE</span>
                    </div>
                  )}
                  <span className="text-xs text-gray-500 font-mono">RARE ENCOUNTER</span>
                </div>

                {/* Card Back (Flipped showing Card Details on Success) */}
                <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-b from-[#1b1e2a] to-[#090b11] border-2 border-amber-400 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span className="text-[9px] font-mono text-amber-400 font-bold uppercase">RARE CARD</span>
                    <span className="text-xs font-mono font-bold text-amber-400">POWER {cards.find(c => c.id === captureCardId)?.power || 60}</span>
                  </div>
                  <div className="text-6xl text-center my-4">{cards.find(c => c.id === captureCardId)?.emoji}</div>
                  <div className="text-center">
                    <h4 className="text-sm font-black text-white">{cards.find(c => c.id === captureCardId)?.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{cards.find(c => c.id === captureCardId)?.description}</p>
                  </div>
                </div>
              </div>

              {/* Particle Burst Elements on Success */}
              {captureStatus === 'success' && (
                <div className="absolute inset-0 pointer-events-none z-30">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const tx = (Math.random() - 0.5) * 300;
                    const ty = (Math.random() - 0.5) * 300;
                    return (
                      <div
                        key={i}
                        className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          animation: 'particle-scatter 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                          ['--tx' as any]: `${tx}px`,
                          ['--ty' as any]: `${ty}px`,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Slider Minigame Interface */}
            {captureStatus === 'aiming' ? (
              <div className="w-full max-w-[800px] space-y-6 flex flex-col items-center">
                
                {/* Pokéball Selector */}
                <div className="flex justify-center gap-3 mb-2">
                  {[
                    { key: 'monsterBall', name: '몬스터볼', emoji: '🔴', count: '∞' },
                    { key: 'superBall', name: '수퍼볼', emoji: '🔵', count: progress.items?.superBall ?? 0 },
                    { key: 'ultraBall', name: '하이퍼볼', emoji: '🟡', count: progress.items?.ultraBall ?? 0 },
                    { key: 'masterBall', name: '마스터볼', emoji: '🟣', count: progress.items?.masterBall ?? 0 },
                  ].map(ball => {
                    const isSelected = selectedBallType === ball.key;
                    const isAvailable = ball.count === '∞' || Number(ball.count) > 0;
                    
                    return (
                      <button
                        key={ball.key}
                        disabled={!isAvailable}
                        onClick={() => {
                          gameAudio.playClick();
                          setSelectedBallType(ball.key as 'monsterBall' | 'superBall' | 'ultraBall' | 'masterBall');
                        }}
                        className={`p-3 border rounded-xl flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-amber-950/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                            : isAvailable
                              ? 'bg-gray-900/60 border-gray-850 hover:border-gray-700 text-gray-300 hover:scale-102 active:scale-98'
                              : 'bg-gray-950/25 border-gray-950 text-gray-600 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-xl">{ball.emoji}</span>
                        <div className="text-left leading-none">
                          <span className="text-xs font-bold block">{ball.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5">소지: {ball.count}개</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Easing sliding track */}
                <div className="w-[800px] h-10 bg-gray-950/80 border border-gray-850 rounded-xl relative flex items-center p-[2px] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] overflow-hidden">
                  
                  {/* Moving Target Catch Zone */}
                  <div 
                    style={{ left: `${greenZoneLeft}px`, width: `${getBallWidth(selectedBallType)}px` }}
                    className="absolute top-[2px] bottom-[2px] bg-gradient-to-r from-emerald-500/20 via-emerald-400/50 to-emerald-500/20 border border-emerald-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all duration-16 ease-linear"
                  >
                    <span className="text-[9px] font-black text-emerald-300 font-mono tracking-wider animate-pulse">CATCH ZONE</span>
                  </div>

                  {/* Fixed Pointer Indicator in the exact center (400px) */}
                  <div className="absolute left-[397px] w-1.5 h-12 bg-amber-400 border border-white z-20 shadow-[0_0_8px_rgba(245,158,11,1)] rounded-full" />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={triggerCaptureAction}
                    className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black text-lg font-black rounded-2xl tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] btn-cyber transition-all hover:scale-105 active:scale-95 touch-target"
                  >
                    포획하기 (SPACE BAR / TAP)
                  </button>
                  <span className="text-xs text-gray-500 font-mono">가운데 노란 게이지 침이 녹색 영역 안에 머무를 때 멈추세요!</span>
                </div>

              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-2xl font-black tracking-wide">
                  {captureStatus === 'success' ? (
                    <span className="text-green-400">🎉 포획 성공! 도감 카드가 해금되었습니다!</span>
                  ) : (
                    <span className="text-red-500">💨 이번엔 놓쳤어! 다음에 도전해봐</span>
                  )}
                </div>
                
                <button
                  onClick={handleCaptureContinue}
                  className="px-8 py-3 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 font-black rounded-xl btn-cyber transition-all touch-target"
                >
                  다음 퀴즈로 진행하기
                </button>
              </div>
            )}
          </div>
        </div>
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

            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-950/20 border border-orange-500/30 px-3 py-1 rounded-full animate-pulse">
                <Flame className="w-4 h-4 text-orange-500 fill-current animate-bounce" />
                <span className="text-orange-400 font-extrabold text-xs font-mono">{streak} COMBO!</span>
              </div>
            )}

            <div className="text-right">
              <span className="text-[10px] text-gray-500 font-mono block">PROGRESS</span>
              <span className="text-sm font-extrabold text-cyan-400 font-mono">{currentIndex + 1} / 10</span>
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
            </div>
          </div>

          {/* Large A/B/C/D Choices Buttons */}
          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => {
              let btnStyle = theme.btnStyle;
              
              if (isAnswered) {
                if (idx === currentQuestion.correctIndex) {
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
                  disabled={isAnswered || loading}
                  onClick={() => handleOptionClick(idx)}
                  className={`min-h-[64px] px-6 py-4 text-left rounded-2xl border btn-cyber transition-all duration-200 flex items-center justify-start gap-4 touch-target ${btnStyle}`}
                >
                  <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                    isAnswered
                      ? idx === currentQuestion.correctIndex
                        ? 'border-emerald-500 bg-emerald-500 text-black'
                        : idx === selectedOption
                          ? 'border-red-500 bg-red-500 text-black'
                          : 'border-gray-900 text-gray-700 bg-transparent'
                      : 'border-cyan-500/20 text-cyan-400 bg-transparent'
                  }`}>
                    {optionLetters[idx]}
                  </span>
                  <span className="text-[17px] md:text-[19px] font-bold">
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation Overlay Screen */}
          {explanationVisible && (
            <div className="glass-panel p-6 border-cyan-500/20 bg-gradient-to-r from-[#0d1629] to-[#040812] relative overflow-hidden animate-slide-up">
              <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedOption === currentQuestion.correctIndex ? (
                      <span className="text-emerald-400 font-extrabold text-sm flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> 정답입니다! (Correct)
                      </span>
                    ) : (
                      <span className="text-red-400 font-extrabold text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> 오답입니다. (Incorrect)
                      </span>
                    )}
                  </div>
                  
                  <div className="text-base text-cyan-400 font-bold mb-2">
                    정답: {optionLetters[currentQuestion.correctIndex]}. {currentQuestion.options[currentQuestion.correctIndex]}
                  </div>

                  <p className="text-gray-300 text-[15px] md:text-[16px] leading-relaxed font-medium">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Scoreboard & Stats */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Current Score Panel */}
          <div className="glass-panel p-5 border-cyan-500/10 bg-[#090f1d]/50 relative text-center">
            <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-3">// SCORE BOARD</h3>
            <div className="text-5xl font-black font-mono-numbers text-cyan-400 filter drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              {score * 10} <span className="text-xs text-gray-500">점</span>
            </div>
            <div className="border-t border-gray-900 mt-4 pt-3 flex justify-between text-xs text-gray-400">
              <span>맞힌 문제 수:</span>
              <span className="text-white font-bold">{score} / 10</span>
            </div>
          </div>

          {/* Unit Card Rewards Info */}
          {currentQuestion.cardReward && (
            <div className="glass-panel p-5 border-amber-500/10 bg-amber-950/5 text-center">
              <h3 className="text-xs font-mono font-bold text-amber-500/60 uppercase tracking-widest mb-4">🎁 이 문제의 도감 보상</h3>
              <div className="w-20 h-20 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-4xl mx-auto mb-3 animate-pulse">
                {cards.find(c => c.id === currentQuestion.cardReward)?.emoji || '❓'}
              </div>
              <span className="text-sm font-black text-gray-100">{cards.find(c => c.id === currentQuestion.cardReward)?.name || '보상 카드'}</span>
              <div className="text-[10px] text-gray-500 font-mono mt-1 uppercase">
                {cards.find(c => c.id === currentQuestion.cardReward)?.rarity || 'common'} Rarity
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Styled Animations for custom keyframes */}
      <style jsx global>{`
        @keyframes scatter-out {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.3);
            opacity: 0;
          }
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
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        @keyframes slideInRight {
          from {
            transform: translateX(30px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        div[style*="--tx"] {
          animation: scatter-out 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      {levelUpToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm border border-white shadow-xl rounded-xl animate-bounce select-none">
          ⭐ {levelUpToast} ⭐
        </div>
      )}
    </div>
  );
}
