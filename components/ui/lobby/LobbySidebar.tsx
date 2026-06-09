'use client';

import React from 'react';
import { gameAudio } from '../../../lib/audio';
import { ClassroomSession, GameProgress } from '../../../types';
import { Award, Trophy, Swords } from 'lucide-react';
import dynamic from 'next/dynamic';

const LobbyQuestsPanel = dynamic(() => import('./LobbyQuestsPanel'), { ssr: false });

type EquippedCosmetics = {
  outfit: string;
  expression: string;
  accessory: string;
  mount: string;
  hat?: string;
  badge?: string;
  title?: string;
  petId?: string;
};

interface LobbySidebarProps {
  studentName: string;
  studentAvatar: string;
  classroomSession: ClassroomSession | null;
  sessionCode: string;
  isSimulatedLobby: boolean;
  chosenUnitId: number;
  localStudents: ClassroomSession['students'];
  playerPos: { x: number; y: number };
  progress: GameProgress;
  equippedCosmetics: EquippedCosmetics;
  activeSidebarTab: 'ranking' | 'quests';
  onTabChange: (tab: 'ranking' | 'quests') => void;
  getTrainerInfo: () => ReturnType<NonNullable<unknown> extends never ? never : any>;
  calculateCP: (unlockedCardIds: string[], equippedCosmetics: EquippedCosmetics) => number;
  claimQuestReward: (questId: string, coinReward: number) => void;
  claimDailyQuestReward: (questId: string, coinReward: number) => void;
  onStartSimulatedQuiz: () => void;
  onStartBattle: () => void;
  onOpenCenter: () => void;
  onOpenGym: () => void;
}

export default function LobbySidebar({
  studentName,
  classroomSession,
  isSimulatedLobby,
  chosenUnitId,
  localStudents,
  playerPos,
  progress,
  equippedCosmetics,
  activeSidebarTab,
  onTabChange,
  getTrainerInfo,
  calculateCP,
  claimQuestReward,
  claimDailyQuestReward,
  onStartSimulatedQuiz,
  onStartBattle,
  onOpenCenter,
  onOpenGym,
}: LobbySidebarProps) {
  const trainer = getTrainerInfo();
  const totalThreshold = trainer.nextThreshold - trainer.prevThreshold;
  const progressXp = trainer.xp - trainer.prevThreshold;
  const xpPercent = trainer.nextThreshold < 999999
    ? Math.min(100, Math.max(0, Math.round((progressXp / totalThreshold) * 100)))
    : 100;

  const rankedStudents = [...localStudents].map(student => {
    let cpVal = 0;
    if (student.name === studentName) {
      cpVal = calculateCP(progress.unlockedCardIds, equippedCosmetics);
    } else if (student.isSimulated) {
      cpVal = (student as any).cp || 500;
    } else {
      cpVal = (student as any).cp || (student.currentScore * 80) + 400;
    }
    return { ...student, cp: cpVal };
  }).sort((a, b) => b.cp - a.cp).slice(0, 5);

  return (
    <div className="lg:col-span-1 space-y-4 flex flex-col justify-start">
      <div className="glass-panel p-5 border-cyan-500/20 bg-cyan-950/5 relative overflow-hidden">
        <div className="text-[10px] font-bold text-cyan-500 tracking-wider mb-1">
          🌍 과학 탐험 메타버스
        </div>

        <div className="p-3 mb-4 bg-cyan-950/20 border border-cyan-500/10 rounded-xl space-y-1.5 font-mono select-none">
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] font-bold text-cyan-400 tracking-wider">⭐ 트레이너 랭크</span>
            <span className="text-[10px] font-black text-amber-400">LV.{trainer.level}</span>
          </div>
          <div className="text-xs font-black text-white font-sans">{trainer.rank}</div>
          {trainer.nextThreshold < 999999 ? (
            <div className="space-y-1 pt-0.5">
              <div className="w-full h-1 bg-gray-950 border border-gray-900 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-300 rounded-full"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-gray-500">
                <span>XP: {trainer.xp} / {trainer.nextThreshold}</span>
                <span>{xpPercent}%</span>
              </div>
            </div>
          ) : (
            <div className="text-[8px] text-amber-500 tracking-wide pt-1">🏆 최고 레벨 달성!</div>
          )}
        </div>

        <div className="border-t border-gray-900 pt-3 space-y-2 font-mono text-xs text-gray-400">
          <div className="flex justify-between">
            <span>접속 좌표:</span>
            <span className="text-cyan-400 font-bold">({playerPos.x}, {playerPos.y})</span>
          </div>
          <div className="flex justify-between">
            <span>학습 대원:</span>
            <span className="text-white font-bold">{localStudents.length} 명 접속</span>
          </div>
          <div className="flex justify-between">
            <span>보유 재화:</span>
            <span className="text-amber-450 font-black text-gray-250 flex items-center gap-1.5">
              🪙 {progress.coins ?? 0} 코인
            </span>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="glass-panel p-2 border-cyan-500/10 flex gap-2">
        <button
          onClick={() => { gameAudio.playClick(); onTabChange('ranking'); }}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSidebarTab === 'ranking'
              ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)] font-black'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> 실시간 랭킹
        </button>
        <button
          onClick={() => { gameAudio.playClick(); onTabChange('quests'); }}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSidebarTab === 'quests'
              ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)] font-black'
              : 'bg-gray-900 text-gray-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" /> 개인 퀘스트
        </button>
      </div>

      <div className="flex-1">
        {activeSidebarTab === 'ranking' ? (
          <div className="glass-panel p-4 border-cyan-500/10 space-y-3 min-h-[220px]">
            <div className="text-[11px] font-bold text-gray-400 text-center border-b border-gray-900 pb-2 mb-2">
              🏅 실시간 CP 랭킹 (TOP 5)
            </div>
            <div className="space-y-2">
              {rankedStudents.map((student, rankIdx) => {
                const isMe = student.name === studentName;
                const medalColors = ['text-yellow-450 font-black', 'text-slate-350 font-extrabold', 'text-amber-600 font-extrabold'];
                return (
                  <div
                    key={student.name}
                    className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                      isMe ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-gray-950/40 border-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-4 h-4 shrink-0 flex items-center justify-center font-mono ${rankIdx < 3 ? medalColors[rankIdx] : 'text-gray-500'}`}>
                        {rankIdx + 1}
                      </span>
                      <span className="text-base shrink-0">{student.avatar}</span>
                      <span className={`truncate font-bold text-gray-250 ${isMe ? 'text-cyan-400' : ''}`}>
                        {student.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-black text-cyan-400 tracking-wider">
                      CP {student.cp}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <LobbyQuestsPanel
            progress={progress}
            getTrainerInfo={getTrainerInfo}
            onClaimQuest={claimQuestReward}
            onClaimDailyQuest={claimDailyQuestReward}
          />
        )}
      </div>

      {/* Special Training Areas */}
      <div className="glass-panel p-4 border-cyan-500/10 space-y-3">
        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest text-center border-b border-gray-900 pb-2 mb-2 font-black">
          // SPECIAL TRAINING AREAS
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { gameAudio.playClick(); onOpenCenter(); }}
            className="py-2.5 bg-pink-900/30 hover:bg-pink-900/50 border border-pink-500/30 hover:border-pink-500 text-pink-400 font-bold rounded-lg text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-[0_0_8px_rgba(236,72,153,0.15)] touch-target"
          >
            <span className="text-xl">🩺</span>
            <span className="font-extrabold text-[11px]">포켓몬 센터</span>
            {progress.wrongAnswers && progress.wrongAnswers.length > 0 && (
              <span className="bg-pink-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse mt-0.5">
                {progress.wrongAnswers.length} 치료 필요
              </span>
            )}
          </button>
          <button
            onClick={() => { gameAudio.playClick(); onOpenGym(); }}
            className="py-2.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-500/30 hover:border-amber-500 text-amber-400 font-bold rounded-lg text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-[0_0_8px_rgba(245,158,11,0.15)] touch-target"
          >
            <span className="text-xl">⚔️</span>
            <span className="font-extrabold text-[11px]">체육관 관장</span>
            <span className="text-[9px] text-gray-500 font-mono mt-0.5 font-bold">
              {classroomSession ? `교실 모드` : `솔로 ${chosenUnitId}단원`}
            </span>
          </button>
        </div>
      </div>

      {/* Direct Play Panel */}
      <div className="glass-panel p-4 border-cyan-500/10 space-y-3">
        {classroomSession ? (
          <div className="text-center py-2">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-300 text-xs font-bold">
              선생님이 퀴즈를 개시하길 대기하는 중...
            </p>
          </div>
        ) : (
          <button
            onClick={onStartSimulatedQuiz}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all touch-target"
          >
            퀴즈 모의 시뮬레이션 개시
          </button>
        )}
        {(classroomSession?.battleMode || isSimulatedLobby) && (
          <button
            onClick={() => { gameAudio.playClick(); onStartBattle(); }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all touch-target"
          >
            <Swords className="w-4 h-4" /> 배틀 스타디움 즉시입장
          </button>
        )}
      </div>
    </div>
  );
}
