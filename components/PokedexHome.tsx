'use client';

import React from 'react';
import { useGameState } from '../lib/game-state';
import { cards } from '../data/cards';
import { gameAudio } from '../lib/audio';
import { Award, BookOpen, ChevronRight, Play } from 'lucide-react';

interface PokedexHomeProps {
  onSelectUnit: (unitId: number) => void;
  onViewPokedex: () => void;
}

export const UNITS = [
  { id: 1, title: '지층과 화석', subtitle: 'Strata & Fossils', icon: '🪨' },
  { id: 2, title: '빛의 성질', subtitle: 'Properties of Light', icon: '🔍' },
  { id: 3, title: '용해와 용액', subtitle: 'Dissolution & Solutions', icon: '🧪' },
  { id: 4, title: '우리 몸의 구조와 기능', subtitle: 'Body Structure & Function', icon: '🫁' },
  { id: 5, title: '생물과 환경', subtitle: 'Living Things & Environment', icon: '🌲' },
  { id: 6, title: '날씨와 우리 생활', subtitle: 'Weather & Our Life', icon: '⛅' },
  { id: 7, title: '물체의 운동', subtitle: 'Motion of Objects', icon: '🏃' },
  { id: 8, title: '산과 염기', subtitle: 'Acids and Bases', icon: '💧' },
];

export default function PokedexHome({ onSelectUnit, onViewPokedex }: PokedexHomeProps) {
  const { progress } = useGameState();
  const { unlockedCardIds, unitHighScores } = progress;

  // Calculate global stats
  const totalCards = 80;
  const unlockedCount = unlockedCardIds.length;
  const completionPercentage = Math.round((unlockedCount / totalCards) * 100);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      {/* Global Pokedex Progress Dashboard */}
      <div className="glass-panel p-6 md:p-8 mb-10 border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-wider text-cyan-400 text-neon-glow uppercase">
              과학 마스터 도감
            </h1>
            <p className="text-gray-400 text-base md:text-lg mt-2 font-medium">
              초등 5학년 과학 복습 시스템 — 퀴즈를 풀고 도감을 완성하세요!
            </p>
          </div>
          
          <div className="flex flex-col items-end shrink-0">
            <div className="text-sm font-mono text-cyan-500 tracking-widest uppercase mb-1">
              TOTAL SYSTEM PROGRESS
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono-numbers text-cyan-400 text-neon-glow">
                {completionPercentage}
              </span>
              <span className="text-2xl font-black text-cyan-500">%</span>
              <span className="text-gray-500 mx-2">|</span>
              <span className="text-3xl font-bold font-mono-numbers text-amber-400 text-gold-glow">
                {unlockedCount}
              </span>
              <span className="text-gray-500 text-lg">/ {totalCards} Cards</span>
            </div>
          </div>
        </div>

        {/* Big Progress Gauge */}
        <div className="w-full h-4 bg-gray-950 rounded-full mt-6 overflow-hidden border border-cyan-500/10 p-[2px]">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Quick action to open Pokedex Grid */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              gameAudio.playClick();
              onViewPokedex();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-950/40 border border-cyan-400/40 hover:border-cyan-400 hover:bg-cyan-950/80 text-cyan-300 hover:text-white font-bold rounded-lg transition-all text-base touch-target"
          >
            <BookOpen className="w-5 h-5" />
            도감 목록 전체 보기 (View Full Pokedex)
          </button>
        </div>
      </div>

      {/* Units Grid */}
      <h2 className="text-2xl md:text-3xl font-black uppercase text-cyan-500/80 tracking-widest mb-6 px-1 flex items-center gap-2">
        <span>📂</span> 학습 단원 선택 (Select Scientific Unit)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {UNITS.map((unit) => {
          // Calculate unit progress (10 cards max per unit)
          const unitCards = cards.filter((c) => c.unitId === unit.id);
          const unitUnlockedCount = unitCards.filter((c) => unlockedCardIds.includes(c.id)).length;
          const unitProgressPercent = unitUnlockedCount * 10;
          
          const highScore = unitHighScores[unit.id];
          const isUnitCompleted = progress.completedUnits.includes(unit.id);

          return (
            <div
              key={unit.id}
              className={`glass-panel p-6 flex flex-col justify-between relative group overflow-hidden border-cyan-500/10 hover:border-cyan-400/50 ${
                isUnitCompleted ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : ''
              }`}
            >
              {/* Unit number bg */}
              <div className="absolute -top-4 -right-4 text-8xl font-black text-cyan-500/5 font-mono select-none pointer-events-none group-hover:text-cyan-500/10 transition-colors">
                {unit.id}
              </div>

              {/* Title & Icon */}
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="text-4xl">{unit.icon}</div>
                  <span className="text-sm font-mono text-cyan-500 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">
                    UNIT 0{unit.id}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
                  {unit.title}
                </h3>
                <p className="text-gray-500 text-xs font-mono tracking-wider mt-1 uppercase">
                  {unit.subtitle}
                </p>
              </div>

              {/* Status / Scores */}
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">도감 해금</span>
                  <span className="font-mono-numbers text-white font-bold">
                    {unitUnlockedCount} / 10 <span className="text-xs text-gray-500">장</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-cyan-500/5 p-[1px]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      unitUnlockedCount === 10 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]' 
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${unitProgressPercent}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-sm border-t border-cyan-500/10 pt-3">
                  <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                    <Award className="w-4 h-4 text-amber-500" />
                    최고 점수
                  </span>
                  <span className="font-mono-numbers text-amber-400 font-extrabold text-base">
                    {highScore !== undefined ? `${highScore}/10` : '없음'}
                  </span>
                </div>

                {/* Start Button */}
                <button
                  onClick={() => {
                    gameAudio.playClick();
                    onSelectUnit(unit.id);
                  }}
                  className={`w-full py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 font-extrabold text-lg tracking-wider transition-all transform group-hover:scale-[1.02] active:scale-[0.98] touch-target border ${
                    unitUnlockedCount === 10 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40' 
                      : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/40 hover:border-cyan-400'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  퀴즈 시작 (Quiz Start)
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
