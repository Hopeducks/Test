'use client';

import React from 'react';
import { useGameState } from '../lib/game-state';
import { cards } from '../data/cards';
import { gameAudio } from '../lib/audio';
import { Award, BookOpen, ChevronRight, Play, User, Trophy } from 'lucide-react';

interface PokedexHomeProps {
  onSelectUnit: (unitId: number) => void;
  onViewPokedex: () => void;
  onViewMyPage?: () => void;
  onViewLeaderboard?: () => void;
}

export const UNITS = [
  { id: 1, title: '지층과 화석', icon: '🪨' },
  { id: 2, title: '빛의 성질', icon: '🔍' },
  { id: 3, title: '용해와 용액', icon: '🧪' },
  { id: 4, title: '우리 몸의 구조와 기능', icon: '🫁' },
  { id: 5, title: '생물과 환경', icon: '🌲' },
  { id: 6, title: '날씨와 우리 생활', icon: '⛅' },
  { id: 7, title: '물체의 운동', icon: '🏃' },
  { id: 8, title: '산과 염기', icon: '💧' },
];

export default function PokedexHome({ onSelectUnit, onViewPokedex, onViewMyPage, onViewLeaderboard }: PokedexHomeProps) {
  const { progress } = useGameState();
  const { unlockedCardIds, unitHighScores } = progress;

  const totalCards = cards.length;
  const unlockedCount = unlockedCardIds.length;
  const completionPercentage = Math.round((unlockedCount / totalCards) * 100);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-slide-up">

      {/* 헤더 패널 */}
      <div className="glass-panel p-6 md:p-8 mb-10 border-amber-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-wider text-amber-400 uppercase"
                style={{ textShadow: '0 0 20px rgba(251,191,36,0.4)' }}>
              과학 마스터 도감
            </h1>
            <p className="text-gray-400 text-base md:text-lg mt-2 font-medium">
              초등 5학년 과학 복습 — 퀴즈를 풀고 도감을 완성하세요!
            </p>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <div className="text-xs font-bold text-amber-500/70 tracking-widest uppercase mb-1">
              전체 진도
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono-numbers text-amber-400"
                    style={{ textShadow: '0 0 15px rgba(251,191,36,0.3)' }}>
                {completionPercentage}
              </span>
              <span className="text-2xl font-black text-amber-500">%</span>
              <span className="text-gray-500 mx-2">|</span>
              <span className="text-3xl font-bold font-mono-numbers text-yellow-400">
                {unlockedCount}
              </span>
              <span className="text-gray-500 text-lg">/ {totalCards}장</span>
            </div>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="w-full h-4 bg-gray-950 rounded-full mt-6 overflow-hidden border border-amber-500/10 p-[2px]">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000"
            style={{ width: `${completionPercentage}%`, boxShadow: '0 0 10px rgba(251,191,36,0.4)' }}
          />
        </div>

        {/* 빠른 이동 버튼 */}
        <div className="mt-6 flex justify-end gap-3 flex-wrap">
          {onViewMyPage && (
            <button
              onClick={() => { gameAudio.playClick(); onViewMyPage(); }}
              className="flex items-center gap-2 px-5 py-3 bg-purple-950/40 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/70 text-purple-300 hover:text-white font-bold rounded-lg transition-all text-base touch-target"
            >
              <User className="w-4 h-4" />
              내 학습 기록
            </button>
          )}
          {onViewLeaderboard && (
            <button
              onClick={() => { gameAudio.playClick(); onViewLeaderboard(); }}
              className="flex items-center gap-2 px-5 py-3 bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/70 text-amber-300 hover:text-white font-bold rounded-lg transition-all text-base touch-target"
            >
              <Trophy className="w-4 h-4" />
              랭킹
            </button>
          )}
          <button
            onClick={() => { gameAudio.playClick(); onViewPokedex(); }}
            className="flex items-center gap-2 px-6 py-3 bg-amber-950/40 border border-amber-400/40 hover:border-amber-400 hover:bg-amber-950/80 text-amber-300 hover:text-white font-bold rounded-lg transition-all text-base touch-target"
          >
            <BookOpen className="w-5 h-5" />
            도감 전체 보기
          </button>
        </div>
      </div>

      {/* 단원 선택 */}
      <h2 className="text-2xl md:text-3xl font-black text-amber-500/80 tracking-wide mb-6 px-1 flex items-center gap-2">
        <span>📚</span> 학습 단원 선택
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {UNITS.map((unit) => {
          const unitCards = cards.filter((c) => c.unitId === unit.id);
          const unitUnlockedCount = unitCards.filter((c) => unlockedCardIds.includes(c.id)).length;
          const unitProgressPercent = unitUnlockedCount * 10;
          const highScore = unitHighScores[unit.id];
          const isUnitCompleted = progress.completedUnits.includes(unit.id);
          const isFullyUnlocked = unitUnlockedCount === unitCards.length;

          return (
            <div
              key={unit.id}
              className={`glass-panel p-6 flex flex-col justify-between relative group overflow-hidden transition-all ${
                isUnitCompleted
                  ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'border-amber-500/10 hover:border-amber-400/40'
              }`}
            >
              {/* 배경 단원 번호 */}
              <div className="absolute -top-4 -right-4 text-8xl font-black text-amber-500/5 font-mono select-none pointer-events-none group-hover:text-amber-500/10 transition-colors">
                {unit.id}
              </div>

              {/* 제목 */}
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="text-4xl">{unit.icon}</div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    isUnitCompleted
                      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                      : 'text-amber-500 bg-amber-950/30 border-amber-500/20'
                  }`}>
                    {isUnitCompleted ? '완료 ✓' : `${unit.id}단원`}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                  {unit.title}
                </h3>
              </div>

              {/* 진행 정보 */}
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center text-base">
                  <span className="text-gray-400 font-medium">카드 해금</span>
                  <span className="font-mono-numbers text-white font-bold">
                    {unitUnlockedCount} / {unitCards.length}
                    <span className="text-xs text-gray-500 ml-0.5">장</span>
                  </span>
                </div>

                <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-amber-500/5 p-[1px]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFullyUnlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    }`}
                    style={{ width: `${unitProgressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-base border-t border-amber-500/10 pt-3">
                  <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                    <Award className="w-4 h-4 text-amber-500" />
                    최고 점수
                  </span>
                  <span className="font-mono-numbers text-amber-400 font-extrabold text-base">
                    {highScore !== undefined ? `${highScore}/10` : '—'}
                  </span>
                </div>

                <button
                  onClick={() => { gameAudio.playClick(); onSelectUnit(unit.id); }}
                  className={`w-full py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 font-extrabold text-lg transition-all transform group-hover:scale-[1.02] active:scale-[0.98] touch-target border ${
                    isFullyUnlocked
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-400 hover:bg-amber-900/40 hover:border-amber-400'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  퀴즈 시작
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
