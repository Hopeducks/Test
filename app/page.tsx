'use client';

import React, { useState, useEffect } from 'react';
import useGameState from '../lib/game-state';
import PokedexHome from '../components/PokedexHome';
import PokedexGrid from '../components/PokedexGrid';
import QuizScreen from '../components/ui/QuizScreen';
import BossRaidScreen from '../components/ui/BossRaidScreen';
import UnitComplete from '../components/UnitComplete';
import { Player } from '../types';
import RoleSelector from '../components/RoleSelector';
import StudentLobby from '../components/StudentLobby';
import TeacherDashboard from '../components/ui/TeacherDashboard';
import CardBattleArena from '../components/ui/CardBattleArena';
import { gameAudio } from '../lib/audio';
import { Volume2, VolumeX, RotateCcw, Award, BookOpen, AlertTriangle, Users, User, Sun, Moon } from 'lucide-react';
import { cards } from '../data/cards';
import { supabase } from '../lib/supabase-client';
import LegendaryAnnouncement from '../components/ui/LegendaryAnnouncement';
import MyPage from '../components/ui/MyPage';
import Leaderboard from '../components/ui/Leaderboard';

export default function Home() {
  const { 
    progress, 
    soundOn, 
    setSoundOn, 
    resetProgress,
    role,
    studentName,
    studentAvatar,
    classroomStudents,
    classroomSession,
    setRole,
    setStudentProfile,
    setClassroomStudents,
    setClassroomSession,
    updateStudentProgress
  } = useGameState();
  
  const { unlockedCardIds } = progress;

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'light' | 'dark';
      if (saved) {
        setTheme(saved);
      }
    }
  }, []);

  const toggleTheme = () => {
    gameAudio.playClick();
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  // Screen Routing State
  const [activeScreen, setActiveScreen] = useState<'home' | 'pokedex' | 'quiz' | 'complete' | 'lobby' | 'battle' | 'raid' | 'mypage' | 'leaderboard'>('home');
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [player, setPlayer] = useState<Player | null>(null);

  const { getLocalPlayer } = useGameState();

  useEffect(() => {
    const local = getLocalPlayer();
    if (local) setPlayer(local);
  }, [activeScreen]);
  
  // Last Quiz Session Results
  const [quizScore, setQuizScore] = useState<number>(0);
  const [newlyUnlockedCards, setNewlyUnlockedCards] = useState<string[]>([]);
  
  // Reset Confirmation Overlay State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Quiz remount key — increment to force QuizScreen to reset internal state
  const [quizKey, setQuizKey] = useState<number>(0);
  const [reviewQuestionIds, setReviewQuestionIds] = useState<string[]>([]);

  // Legendary announcement state
  const [legendaryAnnounce, setLegendaryAnnounce] = useState<{
    playerName: string;
    playerAvatar: string;
    cardName: string;
    cardEmoji: string;
  } | null>(null);

  // Global calculations
  const totalCards = cards.length;
  const unlockedCount = unlockedCardIds.length;
  const completionPercentage = Math.round((unlockedCount / totalCards) * 100);

  // Auto-init web audio context on user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const tempCtx = new AudioCtx();
          if (tempCtx.state === 'suspended') {
            tempCtx.resume();
          }
        }
      }
      window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  // Listen for legendary card unlock broadcasts from any player
  useEffect(() => {
    const channel = supabase.channel('legendary_announcements_global');
    channel
      .on('broadcast', { event: 'legendary_unlock' }, (payload: { payload: { playerName: string; playerAvatar: string; cardName: string; cardEmoji: string } }) => {
        const data = payload.payload;
        if (data && data.playerName && data.cardName) {
          setLegendaryAnnounce(data);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleResetProgress = () => {
    gameAudio.playClick();
    resetProgress();
    setShowResetConfirm(false);
    setActiveScreen('home');
  };

  // 1. Role Selection Screen (if role is not chosen yet)
  if (role === 'none') {
    return (
      <main className={`min-h-screen ${theme === 'dark' ? 'dark-theme' : 'light-theme'} bg-[#030712] text-gray-105 flex flex-col justify-center font-sans relative overflow-x-hidden`}>
        {/* Subtle scanline background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 z-40" />
        <RoleSelector 
          onSelectStudent={(name, avatar, sessionCode) => {
            setStudentProfile(name, avatar);
            setRole('student');
            // session code는 RoleSelector에서 이미 localStorage에 저장됨
            setActiveScreen('lobby');
          }}
          onSelectTeacher={() => {
            setRole('teacher');
          }}
        />
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${theme === 'dark' ? 'dark-theme' : 'light-theme'} bg-[#030712] text-gray-105 flex flex-col justify-between font-sans relative overflow-x-hidden`}>
      {/* Subtle scanline background pattern for retro sci-fi CRT style */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 z-40" />

      {/* Global Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div 
            onClick={() => {
              if (role === 'student' && activeScreen !== 'home') {
                gameAudio.playClick();
                setActiveScreen('home');
              }
            }}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded border border-cyan-400/50 flex items-center justify-center bg-cyan-950/20 text-cyan-400 font-black text-sm">
              S
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-mono text-cyan-500 tracking-widest block leading-none font-bold">
                SCIENCE POKEDEX
              </span>
              <span className="text-[10px] font-mono text-gray-500 tracking-wider">
                V2.0.0 // {role === 'teacher' ? 'ADMINISTRATOR' : `${studentAvatar} STUDENT`}
              </span>
            </div>
          </div>

          {/* Quick Header Stats & Actions */}
          {role === 'student' && (
            <div className="flex items-center gap-3">
              {activeScreen !== 'home' && (
                <div className="hidden md:flex items-center gap-4 text-xs font-mono bg-cyan-950/10 border border-cyan-500/5 px-4 py-1.5 rounded-lg">
                  <div className="text-cyan-400 font-bold">
                    도감 {unlockedCount}장 해금 ({completionPercentage}%)
                  </div>
                </div>
              )}

              {/* Lobby Entry Button */}
              {activeScreen !== 'lobby' && activeScreen !== 'quiz' && activeScreen !== 'battle' && (
                <button
                  onClick={() => {
                    gameAudio.playClick();
                    setActiveScreen('lobby');
                  }}
                  className="px-4 py-1.5 bg-cyan-950/40 border border-cyan-400/40 hover:border-cyan-400 text-cyan-400 hover:text-white rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 touch-target"
                >
                  <Users className="w-3.5 h-3.5" />
                  교실 대기실 입장
                </button>
              )}
            </div>
          )}

          {/* Settings & Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
              className="w-11 h-11 border border-gray-800 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-cyan-400 rounded-lg flex items-center justify-center transition-all touch-target"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundOn(!soundOn);
                if (!soundOn) {
                  setTimeout(() => gameAudio.playClick(), 50);
                }
              }}
              title={soundOn ? '사운드 켜짐' : '사운드 꺼짐'}
              className={`w-11 h-11 border rounded-lg flex items-center justify-center transition-all touch-target ${
                soundOn
                  ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400 hover:border-cyan-400'
                  : 'bg-red-950/10 border-red-900/30 text-red-500 hover:border-red-500'
              }`}
            >
              {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Role Switcher */}
            <button
              onClick={() => {
                gameAudio.playClick();
                setRole('none');
              }}
              title="역할 변경"
              className="w-11 h-11 border border-gray-800 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-cyan-400 rounded-lg flex items-center justify-center transition-all touch-target"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Reset Button */}
            <button
              onClick={() => {
                gameAudio.playClick();
                setShowResetConfirm(true);
              }}
              title="진행도 초기화"
              className="w-11 h-11 border border-gray-800 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-red-400 hover:border-red-950/50 rounded-lg flex items-center justify-center transition-all touch-target"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <div className="flex-1 w-full flex flex-col justify-start py-4 relative z-10">
        
        {/* A. TEACHER MODULE */}
        {role === 'teacher' && (
          <TeacherDashboard 
            sessionCode={classroomSession?.code || 'LOCAL'}
            classroomStudents={classroomStudents}
            classroomSession={classroomSession}
            setClassroomSession={setClassroomSession}
            setClassroomStudents={setClassroomStudents}
            onBack={() => {
              setRole('none');
            }}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}

        {/* B. STUDENT MODULE */}
        {role === 'student' && (
          <>
            {activeScreen === 'home' && (
              <PokedexHome
                onSelectUnit={(unitId) => {
                  setSelectedUnitId(unitId);
                  setActiveScreen('quiz');
                }}
                onViewPokedex={() => {
                  setActiveScreen('pokedex');
                }}
                onViewMyPage={() => {
                  setActiveScreen('mypage');
                }}
                onViewLeaderboard={() => {
                  setActiveScreen('leaderboard');
                }}
              />
            )}

            {activeScreen === 'mypage' && (
              <MyPage onBack={() => setActiveScreen('home')} />
            )}

            {activeScreen === 'leaderboard' && (
              <Leaderboard onBack={() => setActiveScreen('home')} />
            )}

            {activeScreen === 'lobby' && (
              <StudentLobby 
                studentName={studentName}
                studentAvatar={studentAvatar}
                classroomSession={classroomSession}
                setClassroomSession={setClassroomSession}
                onStartQuiz={(unitId) => {
                  setSelectedUnitId(unitId);
                  setActiveScreen('quiz');
                }}
                onStartBattle={() => {
                  setActiveScreen('battle');
                }}
                onStartRaid={() => {
                  setActiveScreen('raid');
                }}
                onOpenMuseum={() => {
                  setActiveScreen('pokedex');
                }}
                onBack={() => {
                  setActiveScreen('home');
                }}
              />
            )}

            {activeScreen === 'pokedex' && (
              <PokedexGrid
                onBack={() => {
                  setActiveScreen('home');
                }}
              />
            )}

            {activeScreen === 'quiz' && (
              <QuizScreen
                key={`quiz-${selectedUnitId}-${quizKey}`}
                unitId={selectedUnitId}
                questionIds={reviewQuestionIds.length > 0 ? reviewQuestionIds : undefined}
                onQuizComplete={(score, unlockedCards) => {
                  setReviewQuestionIds([]);
                  setQuizScore(score);
                  setNewlyUnlockedCards(unlockedCards);
                  setActiveScreen('complete');
                }}
                onCancel={() => {
                  setReviewQuestionIds([]);
                  setActiveScreen('lobby');
                }}
              />
            )}

            {activeScreen === 'complete' && (
              <UnitComplete
                unitId={selectedUnitId}
                score={quizScore}
                newlyUnlockedCardIds={newlyUnlockedCards}
                onReviewWrongAnswers={(ids) => {
                  setReviewQuestionIds(ids);
                  setQuizKey(prev => prev + 1);
                  setActiveScreen('quiz');
                }}
                onRestart={() => {
                  setReviewQuestionIds([]);
                  setQuizKey(prev => prev + 1);
                  setActiveScreen('quiz');
                }}
                onGoHome={() => {
                  setActiveScreen('home');
                }}
                onGoLobby={() => {
                  setActiveScreen('lobby');
                }}
              />
            )}

            {activeScreen === 'battle' && (
              <CardBattleArena
                onBack={() => {
                  setActiveScreen('lobby');
                }}
              />
            )}

            {activeScreen === 'raid' && player && (
              <BossRaidScreen
                sessionCode={player.sessionCode || 'SOLO-UNIT-1'}
                player={player}
                onRaidComplete={() => {
                  setActiveScreen('lobby');
                }}
                onCancel={() => {
                  setActiveScreen('lobby');
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Global Footer */}
      <footer className="w-full border-t border-cyan-500/5 bg-gray-950/20 py-4 text-center mt-12">
        <p className="text-[12px] font-mono text-gray-600 tracking-wider">
          © 2026 SCIENCE MASTER POKEDEX // DEVELOPED FOR ELEMENTARY SCHOOL GRADE 5
        </p>
      </footer>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 border-red-500/40 bg-gradient-to-b from-[#180a0a] to-[#0a0505] shadow-2xl relative">
            <h2 className="text-2xl font-black text-red-500 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              진행도 초기화 경고
            </h2>
            
            <p className="text-gray-300 text-base leading-relaxed mb-6 font-medium">
              정말로 지금까지 저장된 모든 학습 진행도를 초기화하시겠습니까? 해금된 카드 도감 데이터, 최고 점수 및 모든 진화형 카드가 영구 삭제되며 복구할 수 없습니다.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  gameAudio.playClick();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-3 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-bold rounded-lg transition-all touch-target"
              >
                취소 (Cancel)
              </button>
              
              <button
                onClick={handleResetProgress}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] touch-target"
              >
                초기화 승인 (Confirm Reset)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legendary Card Global Announcement */}
      {legendaryAnnounce && (
        <LegendaryAnnouncement
          playerName={legendaryAnnounce.playerName}
          playerAvatar={legendaryAnnounce.playerAvatar}
          cardName={legendaryAnnounce.cardName}
          cardEmoji={legendaryAnnounce.cardEmoji}
          onClose={() => setLegendaryAnnounce(null)}
        />
      )}
    </main>
  );
}
