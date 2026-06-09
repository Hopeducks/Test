'use client';

import React from 'react';
import { GameProgress } from '../../../types';
import { buildDailyQuestStatus } from '../../../data/quests';
import { getWorldProgress, LOOP_STEPS, ZONES } from '../../../lib/world-progression';
import { gameAudio } from '../../../lib/audio';

interface LabScreenProps {
  progress: GameProgress;
  onStartQuiz: (unitId: number) => void;
  onClaimDailyQuest: (questId: string, reward: number) => void;
  onClose: () => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LabScreen({ progress, onStartQuiz, onClaimDailyQuest, onClose }: LabScreenProps) {
  const today = todayStr();
  const dailyStatuses = buildDailyQuestStatus(today, progress.dailyStats, progress.claimedDailyQuestIds ?? []);
  const world = getWorldProgress(progress);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel border-teal-500/30 bg-[#020f0f] space-y-0 overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-teal-500/20 bg-teal-950/20">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔬</span>
            <div>
              <h2 className="text-base font-black text-teal-300 leading-tight">탐구 연구소</h2>
              <p className="text-[10px] text-teal-500/70 font-mono">일일 탐구 미션 & 진행 현황</p>
            </div>
          </div>
          <button
            onClick={() => { gameAudio.playClick(); onClose(); }}
            className="text-gray-500 hover:text-teal-400 transition-colors text-lg font-mono touch-target px-2"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] space-y-4 p-5">

          {/* 진행 개요 */}
          <section aria-label="트레이너 진행 현황">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest">진행 현황</span>
              <span className="text-[10px] font-mono text-teal-600">{world.trainerTier} Lv.{world.trainerLevel}</span>
            </div>
            <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${world.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-gray-500 mb-2">
              <span>단원 {world.completedUnitCount}/{world.totalUnits} 완료</span>
              <span>카드 {world.unlockedCardCount}개 보유</span>
            </div>
            <p className="text-[10px] text-teal-200/70 bg-teal-950/30 border border-teal-800/30 rounded-lg px-3 py-2 leading-snug">
              📌 {world.nextMilestone}
            </p>
          </section>

          {/* 월드 진행 루프 */}
          <section aria-label="월드 진행 루프">
            <p className="text-[11px] font-bold text-teal-400 uppercase tracking-widest mb-2">월드 진행 루프</p>
            <div className="grid grid-cols-4 gap-1.5">
              {LOOP_STEPS.map(({ step, icon, label, desc }) => (
                <div key={step} className="flex flex-col items-center text-center gap-1 bg-teal-950/20 border border-teal-800/20 rounded-lg p-2">
                  <span className="text-lg" role="img" aria-label={label}>{icon}</span>
                  <span className="text-[9px] font-black text-teal-300">{label}</span>
                  <span className="text-[8px] text-gray-400 leading-tight">{desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 일일 탐구 미션 */}
          <section aria-label="일일 탐구 미션">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">오늘의 탐구 미션</span>
              <span className="text-[9px] font-mono text-gray-500">{today}</span>
            </div>
            <div className="space-y-2">
              {dailyStatuses.map(({ quest, prog, isClaimed, isReady }) => {
                const pct = Math.min(100, Math.round((Math.min(prog, quest.goal) / quest.goal) * 100));
                return (
                  <div
                    key={quest.id}
                    className={`border rounded-lg p-2.5 space-y-1.5 transition-all ${
                      isClaimed
                        ? 'border-gray-800 bg-gray-950/40 opacity-50'
                        : isReady
                          ? 'border-amber-500/40 bg-amber-950/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                          : 'border-gray-800/60 bg-gray-950/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-100">{quest.icon} {quest.name}</span>
                      <span className="text-[9px] font-mono text-amber-400">{Math.min(prog, quest.goal)}/{quest.goal}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-tight">{quest.desc}</p>
                    <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-amber-600 font-mono">+{quest.reward} 코인</span>
                      {isClaimed ? (
                        <span className="text-[9px] text-green-500 font-bold">✓ 수령 완료</span>
                      ) : isReady ? (
                        <button
                          onClick={() => { gameAudio.playClick(); onClaimDailyQuest(quest.id, quest.reward); }}
                          className="text-[9px] font-black px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black rounded-md transition-all touch-target"
                        >
                          수령
                        </button>
                      ) : (
                        <span className="text-[9px] text-gray-600">진행 중...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 단원 복습 바로가기 */}
          <section aria-label="단원 복습 바로가기">
            <p className="text-[11px] font-bold text-teal-400 uppercase tracking-widest mb-2">단원 복습 바로가기</p>
            <div className="grid grid-cols-4 gap-1.5">
              {ZONES.filter(z => z.id === 'quiz').length > 0 && Array.from({ length: 8 }, (_, i) => i + 1).map((unitId) => {
                const done = progress.completedUnits?.includes(unitId);
                return (
                  <button
                    key={unitId}
                    onClick={() => { gameAudio.playClick(); onStartQuiz(unitId); onClose(); }}
                    className={`py-2 rounded-lg text-[10px] font-black transition-all touch-target ${
                      done
                        ? 'bg-teal-900/40 border border-teal-500/30 text-teal-300 hover:bg-teal-800/50'
                        : 'bg-gray-900/60 border border-gray-700/40 text-gray-400 hover:border-teal-500/30 hover:text-teal-400'
                    }`}
                    aria-label={`${unitId}단원 복습`}
                  >
                    {done ? '✓ ' : ''}{unitId}단원
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
