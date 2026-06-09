'use client';

import React, { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { Player, PlayerPosition, AvatarConfig } from '../../types';
import { usePresence, broadcastPosition } from '../../lib/supabase/realtime';
import { supabase } from '../../lib/supabase-client';
import { gameAudio } from '../../lib/audio';
import { useGameState } from '../../lib/game-state';
import { Swords, BookOpen, Orbit, X, Trophy, AlertTriangle, Heart, Shield } from 'lucide-react';

interface PhaserCanvasProps {
  sessionCode: string;
  player: Player;
  onZoneAction?: (zone: 'quiz' | 'battle' | 'raid' | 'museum' | 'center' | 'gym' | 'lab', unitId?: number) => void;
}

export default function PhaserCanvas({ sessionCode, player, onZoneAction }: PhaserCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  
  // Connect to global Game State to watch classroomSession changes
  const { classroomSession } = useGameState();

  // Subscribe to realtime presence positions of other players in the session
  const presenceData = usePresence(sessionCode);

  // Modal overlay state triggered by portals
  const [activeZoneModal, setActiveZoneModal] = useState<{ zone: 'quiz' | 'battle' | 'raid' | 'museum' | 'center' | 'gym' | 'lab'; unitId?: number } | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // 1. Sync React Presence Data to Phaser Scene
  useEffect(() => {
    const event = new CustomEvent('react:presenceUpdate', { detail: presenceData });
    window.dispatchEvent(event);
  }, [presenceData]);

  // 2. Sync active classroomSession to Phaser Registry (to verify Boss Raid status)
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set('classroomSession', classroomSession);
    }
  }, [classroomSession]);

  // 3. Listen to local position updates from Phaser and broadcast via Supabase Presence
  useEffect(() => {
    if (!sessionCode) return;

    const channelId = `presence_session_${sessionCode}`;
    const channel = supabase.channel(channelId);
    channel.subscribe();

    const handlePositionUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PlayerPosition>;
      const position = customEvent.detail;
      broadcastPosition(channel, position);
    };

    window.addEventListener('phaser:positionUpdate', handlePositionUpdate);

    return () => {
      window.removeEventListener('phaser:positionUpdate', handlePositionUpdate);
      channel.unsubscribe();
    };
  }, [sessionCode]);

  // 4. Listen to zone collisions and warnings dispatched from Phaser Scene
  useEffect(() => {
    const handleZoneEntered = (e: Event) => {
      const customEvent = e as CustomEvent<{ zone: 'quiz' | 'battle' | 'raid' | 'museum' | 'center' | 'gym' | 'lab'; unitId?: number }>;
      const { zone, unitId } = customEvent.detail;
      gameAudio.playPortalEnter();
      setActiveZoneModal({ zone, unitId });
    };

    const handleZoneWarning = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      gameAudio.playClick();
      setWarningMessage(customEvent.detail.message);
    };

    window.addEventListener('phaser:zoneEntered', handleZoneEntered);
    window.addEventListener('phaser:zoneWarning', handleZoneWarning);

    return () => {
      window.removeEventListener('phaser:zoneEntered', handleZoneEntered);
      window.removeEventListener('phaser:zoneWarning', handleZoneWarning);
    };
  }, []);

  // 4.8. Sync Avatar customizations to Phaser registry and emit update event
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.registry.set('avatar', player.avatar);
      gameRef.current.registry.set('nickname', player.nickname);
      const updateEvent = new CustomEvent('react:avatarUpdate', {
        detail: { nickname: player.nickname, avatar: player.avatar }
      });
      window.dispatchEvent(updateEvent);
    }
  }, [player.avatar, player.nickname]);

  // 5. Initialize Phaser 4 Instance and bind LobbyScene & RaidScene
  useEffect(() => {
    // destroyed 플래그: 컴포넌트 언마운트 후 Promise가 늦게 resolve되어도 Game 생성 차단
    let destroyed = false;

    Promise.all([
      import('phaser'),
      import('../../game/scenes/LobbyScene'),
      import('../../game/scenes/RaidScene')
    ]).then(([PhaserModule, LobbySceneModule, RaidSceneModule]) => {
      if (destroyed || !containerRef.current || gameRef.current) return;

      const Phaser = PhaserModule;
      const LobbyScene = LobbySceneModule.default;
      const RaidScene = RaidSceneModule.default;

      const config = {
        type: Phaser.AUTO,
        width: 768,
        height: 576,
        parent: containerRef.current,
        backgroundColor: '#030712',
        input: {
          keyboard: {
            target: containerRef.current
          }
        },
        physics: {
          default: 'arcade',
          arcade: { debug: false }
        },
        scene: [LobbyScene, RaidScene],
        callbacks: {
          preBoot: (game: Phaser.Game) => {
            game.registry.set('sessionCode', sessionCode);
            game.registry.set('playerId', player.id);
            game.registry.set('nickname', player.nickname);
            game.registry.set('avatar', player.avatar);
            game.registry.set('classroomSession', classroomSession);
          }
        }
      };

      gameRef.current = new Phaser.Game(config);

      setTimeout(() => {
        if (!destroyed) containerRef.current?.focus();
      }, 500);
    });

    return () => {
      destroyed = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [sessionCode, player.id]);

  const handleModalConfirm = () => {
    if (activeZoneModal && onZoneAction) {
      gameAudio.playClick();
      onZoneAction(activeZoneModal.zone, activeZoneModal.unitId);
    }
    setActiveZoneModal(null);
  };

  return (
    <div className="w-full flex justify-center bg-[#030712] border border-cyan-500/10 rounded-lg p-1 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
      <div
        id="phaser-lobby-canvas-container"
        className="w-full aspect-[4/3] max-w-[768px] outline-none"
        ref={containerRef}
        tabIndex={0}
        onFocus={() => {}}
        onClick={(e) => {
          // Ensure the container gets focus for keyboard events
          (e.currentTarget as HTMLDivElement).focus();
        }}
      />

      {/* Zone Entry Confirm Modals */}
      {activeZoneModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 border-cyan-500/30 bg-[#090f1d] shadow-2xl relative text-center animate-scale-up">
            <button
              onClick={() => {
                gameAudio.playClick();
                setActiveZoneModal(null);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {activeZoneModal.zone === 'quiz' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-amber-950/50 border border-amber-500/30 rounded-lg flex items-center justify-center text-amber-400 mx-auto animate-pulse">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-amber-400">{activeZoneModal.unitId}단원 퀴즈 풀기</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  선택한 <span className="text-amber-400 font-bold">{activeZoneModal.unitId}단원</span> 과학 복습 퀴즈 구역에 진입하였습니다. 퀴즈를 풀고 새로운 도감 카드를 획득하시겠습니까?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveZoneModal(null)}
                    className="flex-1 py-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
                  >
                    대기
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded text-xs transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  >
                    퀴즈 풀기
                  </button>
                </div>
              </div>
            )}

            {activeZoneModal.zone === 'battle' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-red-950/50 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 mx-auto animate-pulse">
                  <Swords className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-red-400">배틀 아레나 진입</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  수집한 카드로 세션 내 다른 학습자들과 과학 지식을 겨룰 수 있는 배틀 아레나입니다. 배틀 매칭에 참여하시겠습니까?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveZoneModal(null)}
                    className="flex-1 py-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
                  >
                    대기
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded text-xs transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                  >
                    매칭 신청
                  </button>
                </div>
              </div>
            )}

            {activeZoneModal.zone === 'raid' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-purple-950/50 border border-purple-500/30 rounded-lg flex items-center justify-center text-purple-400 mx-auto animate-pulse">
                  <Orbit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-purple-400">보스 레이드 아레나</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  전설의 보스를 학급 친구들과 함께 협동하여 물리치는 레이드 존입니다. 보스 전장으로 워프하시겠습니까?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveZoneModal(null)}
                    className="flex-1 py-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
                  >
                    대기
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded text-xs transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                  >
                    레이드 입장
                  </button>
                </div>
              </div>
            )}

            {activeZoneModal.zone === 'museum' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-950/50 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-emerald-400">도감 전시 박물관</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  지금까지 수집하고 획득한 모든 과학 마스터 카드를 전시하는 박물관입니다. 박물관으로 입장하시겠습니까?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveZoneModal(null)}
                    className="flex-1 py-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
                  >
                    대기
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded text-xs transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  >
                    박물관 입장
                  </button>
                </div>
              </div>
            )}

            {activeZoneModal.zone === 'center' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-pink-950/50 border border-pink-500/30 rounded-lg flex items-center justify-center text-pink-400 mx-auto animate-pulse">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-pink-400">포켓몬 센터 입장</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  치료가 필요한 포켓몬이 있거나 오답 노트 카드를 해결하시겠습니까? 포켓몬 센터로 진입합니다.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveZoneModal(null)}
                    className="flex-1 py-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
                  >
                    대기
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 text-white font-black rounded text-xs transition-all shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                  >
                    센터 입장
                  </button>
                </div>
              </div>
            )}

            {activeZoneModal.zone === 'gym' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-amber-950/50 border border-amber-500/30 rounded-lg flex items-center justify-center text-amber-400 mx-auto animate-pulse">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-amber-400">체육관 관장 배틀</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  현재 단원의 체육관 관장에 도전하여 지식 배틀을 진행하고 단원 배지를 획득하시겠습니까?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveZoneModal(null)}
                    className="flex-1 py-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
                  >
                    대기
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded text-xs transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  >
                    체육관 도전
                  </button>
                </div>
              </div>
            )}

            {activeZoneModal.zone === 'lab' && (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-teal-950/50 border border-teal-500/30 rounded-lg flex items-center justify-center text-teal-400 mx-auto animate-pulse">
                  <span className="text-2xl">🔬</span>
                </div>
                <h3 className="text-lg font-black text-teal-400">탐구 연구소 입장</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  일일 탐구 미션을 확인하고 트레이너 진행 현황을 살펴보는 연구소입니다. 입장하시겠습니까?
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setActiveZoneModal(null)}
                    className="flex-1 py-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
                  >
                    대기
                  </button>
                  <button
                    onClick={handleModalConfirm}
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black rounded text-xs transition-all shadow-[0_0_10px_rgba(45,212,191,0.3)]"
                  >
                    연구소 입장
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning Toast (e.g. inactive Boss Raid) */}
      {warningMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-950 border border-red-500/30 text-red-300 text-xs font-bold px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 max-w-sm">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{warningMessage}</span>
            <button 
              onClick={() => setWarningMessage(null)}
              className="text-gray-500 hover:text-white ml-2 font-mono"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
