'use client';

import React from 'react';
import { gameAudio } from '../../../lib/audio';
import { GameProgress } from '../../../types';
import { buildActiveQuests, TOTAL_QUEST_COUNT, buildDailyQuestStatus } from '../../../data/quests';

interface TrainerInfo {
  level: number;
  xp: number;
  rank: string;
  prevThreshold: number;
  nextThreshold: number;
}

interface LobbyQuestsPanelProps {
  progress: GameProgress;
  getTrainerInfo: () => TrainerInfo;
  onClaimQuest: (questId: string, reward: number) => void;
  onClaimDailyQuest: (questId: string, reward: number) => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function LobbyQuestsPanel({ progress, getTrainerInfo, onClaimQuest, onClaimDailyQuest }: LobbyQuestsPanelProps) {
  const trainer = getTrainerInfo();
  const questsList = buildActiveQuests(
    { progress, trainerLevel: trainer.level, trainerXp: trainer.xp },
    progress.claimedQuestIds ?? []
  );
  const claimedCount = progress.claimedQuestIds?.length ?? 0;
  const today = todayStr();
  const dailyStatuses = buildDailyQuestStatus(today, progress.dailyStats, progress.claimedDailyQuestIds ?? []);

  return (
    <div className="glass-panel p-4 border-cyan-500/10 space-y-3 max-h-[400px] overflow-y-auto min-h-[220px]">
      <div className="text-[11px] font-bold text-amber-400 text-center border-b border-amber-900/40 pb-2 mb-1 flex items-center justify-center gap-2">
        <span>⭐ 오늘의 도전</span>
        <span className="text-[9px] font-mono text-amber-500/70">{today}</span>
      </div>
      {dailyStatuses.map(({ quest, prog, isClaimed, isReady, extraProg, extraGoal }) => {
        const showExtra = extraProg !== undefined && extraGoal !== undefined;
        const percent = Math.min(100, Math.round((Math.min(prog, quest.goal) / quest.goal) * 100));
        return (
          <div key={quest.id} className="p-2 border border-amber-900/30 bg-amber-950/10 rounded-lg space-y-1 text-left">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-black text-amber-100">{quest.icon} {quest.name}</span>
              <span className="text-[9px] font-mono text-amber-400 font-bold">
                {showExtra ? 'quiz ' + prog + '/1 + battle ' + extraProg + '/' + extraGoal : Math.min(prog, quest.goal) + '/' + quest.goal}
              </span>
            </div>
            <p className="text-[9px] text-amber-200/60 leading-tight">{quest.desc}</p>
            {!showExtra && (
              <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: percent + '%' }} />
              </div>
            )}
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">🪙 {quest.reward}</span>
              {isClaimed ? (
                <span className="text-[9px] font-bold text-gray-500 border border-gray-900 px-1.5 py-0.5 rounded bg-gray-950/40">완료됨</span>
              ) : isReady ? (
                <button
                  onClick={() => { gameAudio.playCatchSuccess(); onClaimDailyQuest(quest.id, quest.reward); }}
                  className="text-[9px] font-black bg-amber-500 hover:bg-amber-400 text-black px-2 py-0.5 rounded transition-all animate-pulse"
                >보상 받기</button>
              ) : (
                <span className="text-[9px] font-bold text-gray-600 border border-gray-900 px-1.5 py-0.5 rounded bg-transparent select-none">진행 중</span>
              )}
            </div>
          </div>
        );
      })}

      <div className="text-[11px] font-bold text-gray-400 text-center border-b border-gray-900 pb-2 mb-2 mt-3 flex items-center justify-center gap-2">
        <span>📋 누적 퀘스트 &amp; 보상</span>
        <span className="text-[9px] font-mono text-cyan-500/80">{claimedCount}/{TOTAL_QUEST_COUNT}</span>
      </div>
      {questsList.filter(q => !q.isAllCleared).map(quest => {
        const isClaimed = progress.claimedQuestIds?.includes(quest.id) || false;
        const isReady = quest.prog >= quest.max && !isClaimed;
        const percent = Math.min(100, Math.round((quest.prog / quest.max) * 100));

        return (
          <div key={quest.id} className="p-2 border border-gray-900 bg-gray-950/20 rounded-lg space-y-1 text-left">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-black text-gray-100">{quest.icon} {quest.name}</span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold">{quest.prog}/{quest.max}</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-tight">{quest.desc}</p>
            <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500" style={{ width: percent + '%' }} />
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">🪙 {quest.reward}</span>
              {isClaimed ? (
                <span className="text-[9px] font-bold text-gray-500 font-sans border border-gray-900 px-1.5 py-0.5 rounded bg-gray-950/40">완료됨</span>
              ) : isReady ? (
                <button
                  onClick={() => { gameAudio.playCatchSuccess(); onClaimQuest(quest.id, quest.reward); }}
                  className="text-[9px] font-black bg-emerald-500 hover:bg-emerald-450 text-black px-2 py-0.5 rounded transition-all animate-pulse"
                >보상 받기</button>
              ) : (
                <span className="text-[9px] font-bold text-gray-650 font-sans border border-gray-900 px-1.5 py-0.5 rounded bg-transparent select-none">진행 중</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
