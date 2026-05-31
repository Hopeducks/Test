'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EmoteId } from '../../types';
import { gameAudio } from '../../lib/audio';
import { Users, KeyRound, Map, Smile } from 'lucide-react';

interface LobbyOverlayProps {
  sessionCode: string;
  playerName: string;
  playerAvatar: string;
  playerPos: { x: number; y: number };
  classmates: Array<{ id: string; nickname: string; x: number; y: number }>;
  onEmoteTrigger?: (emote: EmoteId) => void;
}

const EMOTE_LIST: Array<{ id: EmoteId; icon: string; label: string }> = [
  { id: 'wave', icon: '👋', label: '인사' },
  { id: 'cheer', icon: '🙌', label: '만세' },
  { id: 'think', icon: '🤔', label: '생각' },
  { id: 'celebrate', icon: '🎉', label: '축하' },
  { id: 'sad', icon: '😢', label: '슬픔' },
];

export default function LobbyOverlay({
  sessionCode,
  playerName,
  playerAvatar,
  playerPos,
  classmates,
  onEmoteTrigger,
}: LobbyOverlayProps) {
  const [emoteBubble, setEmoteBubble] = useState<{ icon: string; key: number } | null>(null);

  const handleEmoteClick = useCallback((emoteId: EmoteId) => {
    const emoteData = EMOTE_LIST.find(e => e.id === emoteId);
    if (!emoteData) return;

    gameAudio.playClick();
    if (onEmoteTrigger) {
      onEmoteTrigger(emoteId);
    }

    // Show large emote bubble toast
    setEmoteBubble({ icon: emoteData.icon, key: Date.now() });

    // Trigger custom window event so Phaser scene catches and plays it
    window.dispatchEvent(new CustomEvent('react:triggerEmote', { detail: { emote: emoteId } }));
  }, [onEmoteTrigger]);

  // Auto-dismiss emote bubble after 3 seconds
  useEffect(() => {
    if (!emoteBubble) return;
    const timer = setTimeout(() => setEmoteBubble(null), 3000);
    return () => clearTimeout(timer);
  }, [emoteBubble]);

  // Convert tile coordinates to percentage for radar positioning
  const getRadarStyle = (tx: number, ty: number) => {
    const left = Math.max(0, Math.min(95, (tx / 120) * 100));
    const top = Math.max(0, Math.min(95, (ty / 90) * 100));
    return { left: `${left}%`, top: `${top}%` };
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4">
      {/* Top HUD Section */}
      <div className="flex justify-between items-start w-full">
        {/* Player Info & Session Code */}
        <div className="flex flex-col gap-2 pointer-events-auto bg-gray-950/85 border border-cyan-500/20 rounded-lg p-3 shadow-[0_4px_12px_rgba(0,0,0,0.6)] backdrop-blur-md text-left font-mono">
          {/* Player Identity */}
          <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-1">
            <span className="text-xl">{playerAvatar}</span>
            <span className="text-sm font-black text-white tracking-wide">{playerName}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">세션 코드</span>
            <span className="text-xs font-bold text-cyan-400 ml-1">{sessionCode}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">접속 인원</span>
            <span className="text-xs font-bold text-emerald-400 ml-1">
              {classmates.length + 1}명
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </div>
        </div>

        {/* Radar Mini-map HUD */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto bg-gray-950/85 border border-cyan-500/20 rounded-lg p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400 uppercase tracking-wider font-bold mb-1">
            <Map className="w-3 h-3 animate-pulse" />
            <span>레이더 미니맵 ({Math.round(playerPos.x)}, {Math.round(playerPos.y)})</span>
          </div>

          {/* High Fidelity Stylized Radar Screen */}
          <div className="relative w-44 h-32 bg-black border border-cyan-500/15 rounded-md overflow-hidden shadow-[inset_0_0_10px_rgba(6,182,212,0.3)]">
            
            {/* Grid scanlines overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_2px] opacity-20 pointer-events-none" />

            {/* Zone Boundaries on Radar */}
            {/* 퀴즈 존 (북) */}
            <div 
              style={{ left: '12px', top: '6px', width: '152px', height: '23px' }}
              className="absolute bg-amber-500/5 border border-amber-500/10 rounded flex items-center justify-center text-[7px] text-amber-500/40"
            >
              QUIZ (N)
            </div>
            {/* 보스 레이드 (서) */}
            <div 
              style={{ left: '12px', top: '57px', width: '23px', height: '23px' }}
              className="absolute bg-purple-500/5 border border-purple-500/10 rounded flex items-center justify-center text-[7px] text-purple-500/40"
            >
              BOSS
            </div>
            {/* 배틀 아레나 (동) */}
            <div 
              style={{ left: '139px', top: '57px', width: '23px', height: '23px' }}
              className="absolute bg-red-500/5 border border-red-500/10 rounded flex items-center justify-center text-[7px] text-red-500/40"
            >
              BATTLE
            </div>
            {/* 도감 박물관 (남) */}
            <div 
              style={{ left: '73px', top: '102px', width: '29px', height: '17px' }}
              className="absolute bg-emerald-500/5 border border-emerald-500/10 rounded flex items-center justify-center text-[7px] text-emerald-500/40"
            >
              MUSEUM (S)
            </div>
            {/* 포켓몬 센터 (남서) */}
            <div 
              style={{ left: '12px', top: '102px', width: '23px', height: '17px' }}
              className="absolute bg-pink-500/5 border border-pink-500/10 rounded flex items-center justify-center text-[7px] text-pink-500/40"
            >
              CENTER
            </div>
            {/* 체육관 (남동) */}
            <div 
              style={{ left: '139px', top: '102px', width: '23px', height: '17px' }}
              className="absolute bg-amber-500/5 border border-amber-500/10 rounded flex items-center justify-center text-[7px] text-amber-500/40"
            >
              GYM
            </div>

            {/* Classmate Radar Dots */}
            {classmates.map((mate, idx) => (
              <div
                key={mate.id || idx}
                style={getRadarStyle(mate.x, mate.y)}
                className="absolute w-2 h-2 rounded-full bg-purple-500 border border-purple-300 shadow-[0_0_4px_#a855f7] transform -translate-x-1/2 -translate-y-1/2"
                title={mate.nickname}
              />
            ))}

            {/* Local Player Radar Dot */}
            <div
              style={getRadarStyle(playerPos.x, playerPos.y)}
              className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white shadow-[0_0_6px_#22d3ee] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
