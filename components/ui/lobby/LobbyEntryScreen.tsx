'use client';

import React from 'react';
import { getUnitIcon, getUnitTitle } from '../../../data/questions';

interface LobbyEntryScreenProps {
  inputSessionCode: string;
  onInputChange: (value: string) => void;
  onJoinWithCode: () => void;
  onSelectUnit: (unitId: number) => void;
  unlockedBadges?: string[];
}

const UNIT_COLORS = [
  'from-amber-950/40 border-amber-500/30 hover:border-amber-400',
  'from-blue-950/40 border-blue-500/30 hover:border-blue-400',
  'from-emerald-950/40 border-emerald-500/30 hover:border-emerald-400',
  'from-rose-950/40 border-rose-500/30 hover:border-rose-400',
  'from-violet-950/40 border-violet-500/30 hover:border-violet-400',
  'from-sky-950/40 border-sky-500/30 hover:border-sky-400',
  'from-orange-950/40 border-orange-500/30 hover:border-orange-400',
  'from-teal-950/40 border-teal-500/30 hover:border-teal-400',
];

export default function LobbyEntryScreen({
  inputSessionCode,
  onInputChange,
  onJoinWithCode,
  onSelectUnit,
  unlockedBadges,
}: LobbyEntryScreenProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* 환영 헤더 */}
      <div className="text-center">
        <div className="text-5xl mb-3 animate-bounce" style={{ animationDuration: '2s' }}>🔬</div>
        <h2 className="text-2xl font-black text-gray-100 mb-2">
          과학 탐험 세계에 오신 것을 환영합니다!
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
          선생님께 받은 참여 코드로 실시간 수업에 참가하거나, 혼자서 단원을 골라 연습해보세요.
        </p>
      </div>

      {/* 실시간 수업 참가 */}
      <div className="rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 to-blue-950/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="font-black text-cyan-300 text-base">실시간 수업 참가</h3>
            <p className="text-xs text-cyan-500/70">선생님이 알려주신 참여 코드를 입력하세요</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="참여 코드 입력 (예: ABC123)"
            value={inputSessionCode}
            onChange={(e) => onInputChange(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-400 text-sm font-bold font-mono tracking-widest"
          />
          <button
            onClick={onJoinWithCode}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black text-sm font-black rounded-xl transition-all shadow-[0_4px_20px_rgba(6,182,212,0.4)]"
          >
            참가 →
          </button>
        </div>
      </div>

      {/* 혼자 연습하기 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📚</span>
          <h3 className="font-black text-gray-200 text-base">혼자 연습하기</h3>
          <span className="text-xs text-gray-500 font-normal">단원을 골라 AI 친구들과 함께 복습!</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((unitId) => {
            const isLocked = unitId > 1 && !unlockedBadges?.includes(`accessory_badge_u${unitId - 1}`);
            return (
              <button
                key={unitId}
                disabled={isLocked}
                onClick={() => onSelectUnit(unitId)}
                className={`p-3 border rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1.5 touch-target bg-gradient-to-b ${
                  isLocked
                    ? 'from-gray-950/20 border-gray-800 text-gray-600 opacity-40 cursor-not-allowed'
                    : `${UNIT_COLORS[unitId - 1]} text-gray-200 active:scale-95`
                }`}
              >
                <span className="text-xl">{isLocked ? '🔒' : getUnitIcon(unitId)}</span>
                <span className="line-clamp-1 font-bold">{unitId}단원</span>
                <span className="text-[10px] opacity-70 line-clamp-1">{getUnitTitle(unitId)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
