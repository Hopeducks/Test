'use client';

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { ClassroomSession, PlayerDashboardEntry, Player, PlayerPosition } from '../../../types';
import { RenderAvatarPreview } from '../../AvatarCustomizer';

interface StudentGridProps {
  classroomSession: ClassroomSession;
  sessionCode: string;
  lastDbUpdate: string;
  setDetailedStudent: (student: PlayerDashboardEntry | null) => void;
}

export default function StudentGrid({ classroomSession, sessionCode, lastDbUpdate, setDetailedStudent }: StudentGridProps) {
  const dashboardStudents: PlayerDashboardEntry[] = useMemo(() => {
    return classroomSession.students.map(student => {
      const totalAnswers = 10;
      const correctRate = student.currentScore / totalAnswers;

      const recentAnswers = [
        { questionId: '1', correct: student.lastAnswerCorrect ?? true, timestamp: '' },
        { questionId: '2', correct: student.currentStreak > 1, timestamp: '' },
        { questionId: '3', correct: student.currentStreak > 2, timestamp: '' },
      ];

      const playerObj: Player = {
        id: student.name,
        nickname: student.name,
        sessionCode,
        avatar: {
          bodyColor: '#4f46e5',
          outfit: student.equippedCosmetics?.outfit || null,
          accessory: student.equippedCosmetics?.accessory || null,
          vehicle: student.equippedCosmetics?.mount || null,
          hat: null,
          emote: null,
        },
        position: { x: student.x, y: student.y },
        xp: student.currentScore * 100,
        level: Math.floor(student.currentScore / 2) + 1,
        coins: student.currentScore * 15,
        unlockedCards: [],
        unlockedCostumes: [],
        achievements: [],
      };

      let currentActivity: PlayerDashboardEntry['currentActivity'] = 'lobby';
      const activeBattle = classroomSession.activeBattles?.find(
        b => b.player1 === student.name || b.player2 === student.name
      );
      if (activeBattle) currentActivity = 'battle';
      else if (classroomSession.status === 'playing') currentActivity = 'quiz';
      else if ((classroomSession.status as string) === 'raid') currentActivity = 'raid';

      const position: PlayerPosition = {
        playerId: student.name,
        x: student.x,
        y: student.y,
        direction: 'idle',
        animFrame: 0,
        emote: null,
      };

      return {
        player: playerObj,
        currentActivity,
        correctRate,
        recentAnswers,
        battleRecord: { wins: 3, losses: 1 },
        position,
        avatarEmoji: student.avatar,
      };
    });
  }, [classroomSession, sessionCode]);

  return (
    <div className="lg:col-span-5 glass-panel p-5 border-cyan-500/10 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-900 pb-2">
        <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
          <Users className="w-4 h-4" /> 대원 접속 그리드
        </h3>
        <span className="text-[10px] text-gray-500 font-mono">정오답 갱신: {lastDbUpdate}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
        {dashboardStudents.map((entry) => {
          const { player, currentActivity, correctRate, recentAnswers, avatarEmoji } = entry;

          const perfBorder = correctRate >= 0.8
            ? 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/5'
            : correctRate >= 0.5
              ? 'border-yellow-500/40 hover:border-yellow-400 bg-yellow-950/5'
              : 'border-red-500/40 hover:border-red-400 bg-red-950/5';

          const dotColor = currentActivity === 'quiz'
            ? 'bg-blue-500'
            : currentActivity === 'battle'
              ? 'bg-red-500'
              : currentActivity === 'raid'
                ? 'bg-orange-500'
                : 'bg-gray-500';

          return (
            <div
              key={player.nickname}
              onClick={() => setDetailedStudent(entry)}
              className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col justify-between h-32 ${perfBorder}`}
            >
              <div className="flex justify-between items-start">
                <RenderAvatarPreview
                  baseAvatar={avatarEmoji || '🧑‍🎓'}
                  outfit={player.avatar.outfit || 'none'}
                  expression={player.avatar.emote || 'none'}
                  accessory={player.avatar.accessory || 'none'}
                  mount={player.avatar.vehicle || 'none'}
                  hat={player.avatar.hat || 'none'}
                  bodyColor={player.avatar.bodyColor || '#06b6d4'}
                  size="sm"
                />
                <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} title={`활동: ${currentActivity}`} />
              </div>

              <div>
                <span className="text-xs font-black text-white block truncate">{player.nickname}</span>
                <span className="text-[9px] text-gray-500 font-mono block mt-0.5">LV. {player.level} // XP {player.xp}</span>
              </div>

              <div className="flex justify-between items-center border-t border-gray-900/60 pt-2 mt-2">
                <div className="flex gap-1">
                  {recentAnswers.map((ans, idx) => (
                    <span
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border text-[7px] font-bold flex items-center justify-center ${
                        ans.correct
                          ? 'border-emerald-500/30 bg-emerald-500 text-black'
                          : 'border-red-500/30 bg-red-500 text-black'
                      }`}
                    >
                      {ans.correct ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-400">{Math.round(correctRate * 100)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
