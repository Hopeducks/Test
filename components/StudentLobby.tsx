'use client';

import React, { useEffect, useState } from 'react';
import { gameAudio } from '../lib/audio';
import { ClassroomSession, Player, EmoteId } from '../types';
import { Loader2, ArrowLeft, Shirt } from 'lucide-react';
import { SIMULATED_CLASSMATES } from '../data/questions';
import { simulatedBotCp } from '../lib/progression';
import useGameState from '../lib/game-state';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabase-client';
import LobbySidebar from './ui/lobby/LobbySidebar';

// Lazy load the Phaser Canvas container to prevent Next.js SSR breakages
const PhaserCanvas = dynamic(() => import('./game/PhaserCanvas'), { ssr: false });
const LobbyOverlay = dynamic(() => import('./game/LobbyOverlay'), { ssr: false });
const NicknameEntry = dynamic(() => import('./ui/NicknameEntry'), { ssr: false });
const AvatarCustomizer = dynamic(() => import('./ui/AvatarCustomizer'), { ssr: false });
const LobbyChatPanel = dynamic(() => import('./ui/LobbyChatPanel'), { ssr: false });
const PokemonCenter = dynamic(() => import('./ui/PokemonCenter'), { ssr: false });
const GymLeaderBattle = dynamic(() => import('./ui/GymLeaderBattle'), { ssr: false });
const NpcQuestModal = dynamic(() => import('./ui/NpcQuestModal'), { ssr: false });
const ZoneEntryPanel = dynamic(() => import('./ui/ZoneEntryPanel'), { ssr: false });
const TournamentBracketView = dynamic(() => import('./ui/TournamentBracketView'), { ssr: false });
const LobbyEntryScreen = dynamic(() => import('./ui/lobby/LobbyEntryScreen'), { ssr: false });
const LabScreen = dynamic(() => import('./ui/lobby/LabScreen'), { ssr: false });
const LobbyShopModal = dynamic(() => import('./ui/lobby/LobbyShopModal'), { ssr: false });

// Map Dimensions
const GRID_COLS = 120;
const GRID_ROWS = 90;
const NPC_NAMES_BY_UNIT: Record<number, string> = { 1: '갈릴레이', 2: '뉴턴', 3: '파스퇴르', 4: '나이팅게일', 5: '다윈', 6: '베게너', 7: '아인슈타인', 8: '퀴리 부인' };

interface StudentLobbyProps {
  studentName: string;
  studentAvatar: string;
  classroomSession: ClassroomSession | null;
  setClassroomSession: (session: ClassroomSession | null) => void;
  onStartQuiz: (unitId: number) => void;
  onStartBattle: () => void;
  onStartRaid?: () => void;
  onOpenMuseum?: () => void;
  onBack: () => void;
}

export default function StudentLobby({
  studentName,
  studentAvatar,
  classroomSession,
  setClassroomSession,
  onStartQuiz,
  onStartBattle,
  onStartRaid,
  onOpenMuseum,
  onBack,
}: StudentLobbyProps) {
  const { 
    progress,
    equippedCosmetics, 
    updateStudentCoordinates, 
    getLocalPlayer, 
    setLocalPlayer,
    calculateCP,
    purchaseItem,
    claimQuestReward,
    claimDailyQuestReward,
    getDailyStats,
    markLobbyVisited,
    getTrainerInfo
  } = useGameState();
  const [isSimulatedLobby, setIsSimulatedLobby] = useState(false);
  const [localStudents, setLocalStudents] = useState<ClassroomSession['students']>([]);
  const [chosenUnitId, setChosenUnitId] = useState<number>(1);
  const [simSpawnIndex, setSimSpawnIndex] = useState(0);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [noticeText, setNoticeText] = useState<string>('');
  const [showKickAlert, setShowKickAlert] = useState<boolean>(false);
  
  // Game state extensions
  const [showShopModal, setShowShopModal] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'ranking' | 'quests'>('ranking');
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [showGymModal, setShowGymModal] = useState(false);
  const [showLabScreen, setShowLabScreen] = useState(false);
  const [showNpcQuest, setShowNpcQuest] = useState(false);
  const [activeNpcName, setActiveNpcName] = useState('');
  const [zoneEntry, setZoneEntry] = useState<{ unitId: number } | null>(null);

  // Connection Session States
  const [sessionCode, setSessionCode] = useState<string>('');
  const [inputSessionCode, setInputSessionCode] = useState<string>('');
  const [joinedPlayer, setJoinedPlayer] = useState<Player | null>(null);
  const [showNicknameModal, setShowNicknameModal] = useState<boolean>(false);

  // Position of current player (tile grid coordinates)
  const [playerPos, setPlayerPos] = useState({ x: 60, y: 48 }); // Spawn in center square by default

  // 로비 입장 시 일일 통계 기록
  useEffect(() => {
    markLobbyVisited();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state with local storage player config
  useEffect(() => {
    const localPlayer = getLocalPlayer();
    if (localPlayer && localPlayer.nickname) {
      setJoinedPlayer(localPlayer);
      if (localPlayer.sessionCode) {
        setSessionCode(localPlayer.sessionCode);
      }
    }
  }, [equippedCosmetics, studentName, progress.coins]);

  // 1.5. Listen to teacher notice and kick broadcasts
  useEffect(() => {
    if (!sessionCode) return;

    const eventChannel = supabase.channel(`dashboard_events_${sessionCode}`);
    
    eventChannel
      .on('broadcast', { event: 'teacher_notice' }, ({ payload }: { payload: { text: string } }) => {
        if (payload && payload.text) {
          gameAudio.playCorrect();
          setNoticeText(payload.text);
        }
      })
      .on('broadcast', { event: 'player_kick' }, ({ payload }: { payload: { name: string } }) => {
        if (payload && payload.name === studentName) {
          gameAudio.playWrong();
          setShowKickAlert(true);
          
          setTimeout(() => {
            setShowKickAlert(false);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('science_pokedex_classroom_session');
              localStorage.removeItem('science_pokedex_classroom_session');
              const local = getLocalPlayer();
              if (local) {
                local.sessionCode = '';
                setLocalPlayer(local);
              }
              window.location.reload(); // Reset Phaser instance & React states cleanly
            }
          }, 2000);
        }
      })
      .subscribe();

    return () => {
      eventChannel.unsubscribe();
    };
  }, [sessionCode, studentName]);

  // Listen to open shop event from Phaser
  useEffect(() => {
    const handleOpenShop = () => {
      gameAudio.playClick();
      setShowShopModal(true);
    };
    window.addEventListener('react:openShop', handleOpenShop);
    return () => window.removeEventListener('react:openShop', handleOpenShop);
  }, []);

  // Listen to open NPC Quest event from Phaser
  useEffect(() => {
    const handleOpenNpcQuest = (e: Event) => {
      const customEvent = e as CustomEvent<{ name: string }>;
      if (customEvent.detail && customEvent.detail.name) {
        // Map and clean up NPC names
        const cleanName = customEvent.detail.name.replace(' 박사', '');
        setActiveNpcName(cleanName);
        setShowNpcQuest(true);
      }
    };
    window.addEventListener('react:openNpcQuest', handleOpenNpcQuest);
    return () => window.removeEventListener('react:openNpcQuest', handleOpenNpcQuest);
  }, []);

  // 1. Join Classroom Session & Track presence
  useEffect(() => {
    if (!sessionCode) return;
    const channelId = `classroom_lobby_${sessionCode}`;
    const channel = supabase.channel(channelId);

    const myCp = calculateCP(progress.unlockedCardIds, equippedCosmetics);

    const playerPresenceState = {
      name: studentName,
      avatar: studentAvatar,
      isSimulated: false,
      currentScore: 0,
      currentStreak: 0,
      answeredCurrentQuestion: false,
      x: playerPos.x,
      y: playerPos.y,
      equippedCosmetics: {
        ...equippedCosmetics,
        bodyColor: getLocalPlayer().avatar.bodyColor
      },
      cp: myCp
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        // Parse presence state into ClassroomSession['students'] format
        const list: any[] = [];
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          presences.forEach(p => {
            if (!list.some(item => item.name === p.name)) {
              list.push(p);
            }
          });
        });

        // Merge with simulated AI bots
        setLocalStudents(prev => {
          const sims = prev.filter(s => s.isSimulated);
          const combined = [...list];
          sims.forEach(sim => {
            if (!combined.some(c => c.name === sim.name)) {
              combined.push(sim);
            }
          });
          return combined;
        });
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.track(playerPresenceState);
        }
      });

    return () => {
      channel.untrack();
      channel.unsubscribe();
    };
  }, [sessionCode, studentName, studentAvatar, playerPos, equippedCosmetics, progress.unlockedCardIds]);

  // Check if session has started — 입장한 세션 코드와 일치할 때만 퀴즈/레이드 시작
  useEffect(() => {
    if (!classroomSession || !sessionCode) return;
    const codeMatch = classroomSession.code === sessionCode;
    if (!codeMatch) return;
    if (classroomSession.status === 'playing') {
      gameAudio.playClick();
      onStartQuiz(classroomSession.activeUnitId);
    } else if ((classroomSession.status as string) === 'raid') {
      gameAudio.playClick();
      if (onStartRaid) onStartRaid();
    }
  }, [classroomSession?.status, classroomSession?.activeUnitId, sessionCode, onStartQuiz, onStartRaid]);

  // 2. Simulated lobby spawning & AI movement effect
  useEffect(() => {
    if (!isSimulatedLobby) return;

    // Initialize simulated session
    if (localStudents.length === 0) {
      setLocalStudents([
        {
          name: studentName,
          avatar: studentAvatar,
          isSimulated: false,
          currentScore: 0,
          currentStreak: 0,
          answeredCurrentQuestion: false,
          x: 60,
          y: 48,
          equippedCosmetics: equippedCosmetics,
          cp: calculateCP(progress.unlockedCardIds, equippedCosmetics)
        }
      ]);
      setSimSpawnIndex(0);
      setPlayerPos({ x: 60, y: 48 });
      return;
    }

    // Spawn AI classmates slowly
    if (simSpawnIndex < SIMULATED_CLASSMATES.length) {
      const spawnTimer = setTimeout(() => {
        const nextSim = SIMULATED_CLASSMATES[simSpawnIndex];
        
        // Prevent duplicates
        if (!localStudents.some(s => s.name === nextSim.name)) {
          setLocalStudents(prev => [
            ...prev,
            {
              name: nextSim.name,
              avatar: nextSim.avatar,
              isSimulated: true,
              currentScore: 0,
              currentStreak: 0,
              answeredCurrentQuestion: false,
              x: Math.floor(Math.random() * (GRID_COLS - 4)) + 2,
              y: Math.floor(Math.random() * (GRID_ROWS - 4)) + 2,
              equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' },
              cp: simulatedBotCp(nextSim.accuracyFactor, nextSim.speedFactor)
            }
          ]);
          
          if (simSpawnIndex % 3 === 0) {
            gameAudio.playClick();
          }
        }
        
        setSimSpawnIndex(prev => prev + 1);
      }, 700 + Math.random() * 800);

      return () => clearTimeout(spawnTimer);
    }
  }, [isSimulatedLobby, localStudents.length, simSpawnIndex, studentName, studentAvatar, equippedCosmetics]);

  // 3. AI bots random wandering effect
  useEffect(() => {
    if (!isSimulatedLobby) return;
    
    // Wander AI classmates every 2.5 seconds to look active
    const wanderTimer = setInterval(() => {
      setLocalStudents(prev => {
        return prev.map(s => {
          if (s.isSimulated && Math.random() < 0.4) {
            // Pick a direction
            const dir = Math.floor(Math.random() * 4);
            let nx = s.x;
            let ny = s.y;
            if (dir === 0) nx = Math.max(2, s.x - 1);
            else if (dir === 1) nx = Math.min(GRID_COLS - 3, s.x + 1);
            else if (dir === 2) ny = Math.max(2, s.y - 1);
            else ny = Math.min(GRID_ROWS - 3, s.y + 1);

            return { ...s, x: nx, y: ny };
          }
          return s;
        });
      });
    }, 2500);

    return () => clearInterval(wanderTimer);
  }, [isSimulatedLobby]);

  // 4. Listen to position changes dispatched from Phaser
  useEffect(() => {
    const handlePhaserPositionUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      const { x, y } = customEvent.detail;
      
      // Translate pixel coords back to grid cell coordinate index
      const gx = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / 32)));
      const gy = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / 32)));
      
      setPlayerPos({ x: gx, y: gy });
      updateStudentCoordinates(gx, gy);
    };

    window.addEventListener('phaser:positionUpdate', handlePhaserPositionUpdate);
    return () => window.removeEventListener('phaser:positionUpdate', handlePhaserPositionUpdate);
  }, [updateStudentCoordinates]);

  // Handle manual movement commands from touch pad
  const moveCharacter = (dx: number, dy: number) => {
    const nextX = Math.max(1, Math.min(GRID_COLS - 2, playerPos.x + dx));
    const nextY = Math.max(1, Math.min(GRID_ROWS - 2, playerPos.y + dy));

    if (nextX !== playerPos.x || nextY !== playerPos.y) {
      setPlayerPos({ x: nextX, y: nextY });

      // Update local student list coordinate representation if simulated
      if (isSimulatedLobby) {
        setLocalStudents(prev => {
          return prev.map(s => {
            if (s.name === studentName) {
              return { ...s, x: nextX, y: nextY };
            }
            return s;
          });
        });
      }

      // Sync and trigger Phaser scene movement via event bridge
      window.dispatchEvent(new CustomEvent('react:movePlayer', {
        detail: { x: nextX * 32 + 16, y: nextY * 32 + 16 }
      }));
      updateStudentCoordinates(nextX, nextY);
    }
  };

  // Actions for simulated mode
  const handleStartSimulatedQuiz = () => {
    gameAudio.playClick();
    
    const newSession: ClassroomSession = {
      activeUnitId: chosenUnitId,
      status: 'playing',
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      battleMode: false,
      students: localStudents.map(s => ({
        ...s,
        currentScore: 0,
        currentStreak: 0,
        answeredCurrentQuestion: false,
      })),
    };
    
    setClassroomSession(newSession);
    onStartQuiz(chosenUnitId);
  };

  const handleInitSimulatedLobby = (unitId: number) => {
    gameAudio.playClick();
    setChosenUnitId(unitId);
    setSessionCode('SOLO-UNIT-' + unitId);
    setIsSimulatedLobby(true);

    const mockPlayer: Player = {
      id: 'solo-sim-player-id',
      nickname: studentName || '학습원',
      sessionCode: 'SOLO-UNIT-' + unitId,
      avatar: {
        bodyColor: '#06b6d4',
        outfit: equippedCosmetics.outfit || null,
        accessory: equippedCosmetics.accessory || null,
        vehicle: equippedCosmetics.mount || null,
        hat: null,
        emote: null
      },
      position: { x: 640, y: 480 },
      xp: 0,
      level: 1,
      coins: 100,
      unlockedCards: [],
      unlockedCostumes: [],
      achievements: []
    };

    setLocalPlayer(mockPlayer);
    setJoinedPlayer(mockPlayer);
    setLocalStudents([
      {
        name: studentName,
        avatar: studentAvatar,
        isSimulated: false,
        currentScore: 0,
        currentStreak: 0,
        answeredCurrentQuestion: false,
        x: 60,
        y: 48,
        equippedCosmetics: equippedCosmetics,
      }
    ]);
    setSimSpawnIndex(0);
    setPlayerPos({ x: 60, y: 48 });
  };

  // Custom session code joining handler
  const handleJoinWithCode = () => {
    const code = inputSessionCode.trim().toUpperCase();
    if (!code) return;
    gameAudio.playClick();
    setSessionCode(code);
    // game-state.ts 전역 브로드캐스트 필터에 사용
    localStorage.setItem('science_pokedex_player_session_code', code);
    setShowNicknameModal(true);
  };

  const handleNicknameSuccess = (player: Player) => {
    setJoinedPlayer(player);
    setShowNicknameModal(false);
    setShowWardrobe(true); // Open wardrobe immediately to select costumes
  };

  const handleNicknameCancel = () => {
    setShowNicknameModal(false);
    setSessionCode('');
  };

  const handleZoneAction = (zone: 'quiz' | 'battle' | 'raid' | 'museum' | 'center' | 'gym' | 'lab', unitId?: number) => {
    if (zone === 'quiz') {
      const targetUnitId = unitId || chosenUnitId;
      const isLocked = targetUnitId > 1 && !progress.unlockedBadges?.includes(`accessory_badge_u${targetUnitId - 1}`);
      if (isLocked) {
        gameAudio.playWrong();
        setNoticeText('🔒 이 단원은 잠겨 있습니다! 이전 단원 배지를 획득해야 입장할 수 있습니다.');
        setTimeout(() => setNoticeText(''), 4000);
        return;
      }
      gameAudio.playClick();
      setZoneEntry({ unitId: targetUnitId });
    } else if (zone === 'battle') {
      onStartBattle();
    } else if (zone === 'raid') {
      if (onStartRaid) {
        onStartRaid();
      } else {
        // Fallback or specific boss raid route (starts 1st quiz for demonstration)
        onStartQuiz(1);
      }
    } else if (zone === 'museum') {
      if (onOpenMuseum) onOpenMuseum();
    } else if (zone === 'center') {
      setShowCenterModal(true);
    } else if (zone === 'gym') {
      setShowGymModal(true);
    } else if (zone === 'lab') {
      gameAudio.playClick();
      setShowLabScreen(true);
    }
  };

  const handleEmoteTrigger = (emote: EmoteId) => {
    // Sync React side if needed, phaser handles rendering and broadcast dispatch automatically
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6">
      
      {/* 📢 Global Notice Banner */}
      {noticeText && (
        <div className="w-full py-3 px-6 bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-black rounded-xl animate-pulse flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.25)] relative overflow-hidden select-none z-40">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          <div className="flex items-center gap-2.5">
            <span className="text-sm">📢</span>
            <span className="font-sans tracking-wide leading-relaxed">
              [전체 공지]: {noticeText}
            </span>
          </div>
          <button
            onClick={() => setNoticeText('')}
            className="text-red-400 hover:text-red-200 transition-colors font-mono text-[10px] uppercase border border-red-500/20 px-2 py-0.5 rounded-md hover:bg-red-500/10"
          >
            닫기
          </button>
        </div>
      )}

      {/* 🚨 Kick Alert Screen Overlay */}
      {showKickAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass-panel w-full max-w-sm p-8 border-red-500/30 bg-[#0d0707] text-center space-y-6 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto animate-bounce">
              ⚠️
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-red-500">강제 퇴장 알림</h2>
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">// ADMINISTRATOR ACTION // SESSION CLOSED</p>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed">
              교사 권한에 의해 세션 대기실에서 퇴장 조치되었습니다. 메인 화면으로 이동합니다.
            </p>
          </div>
        </div>
      )}

      {/* Wardrobe Modal */}
      {showWardrobe && (
        <AvatarCustomizer onClose={() => {
          setShowWardrobe(false);
          // Sync changes in React preview
          const local = getLocalPlayer();
          if (local) setJoinedPlayer(local);
        }} />
      )}

      {/* Nickname Entry Overlay Modal */}
      {showNicknameModal && (
        <NicknameEntry 
          sessionCode={sessionCode} 
          onJoinSuccess={handleNicknameSuccess} 
          onCancel={handleNicknameCancel} 
        />
      )}

      {/* Lobby Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-4">
        <button
          onClick={() => {
            gameAudio.playClick();
            onBack();
          }}
          className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 font-mono text-sm transition-colors touch-target"
        >
          <ArrowLeft className="w-4 h-4" /> 뒤로가기 (EXIT)
        </button>

        <div className="flex items-center gap-4">
          {/* Avatar Wardrobe toggle button */}
          {joinedPlayer && (
            <button
              onClick={() => {
                gameAudio.playClick();
                setShowWardrobe(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-cyan-500/20 bg-cyan-950/20 hover:border-cyan-400 text-cyan-400 hover:text-white rounded-lg text-xs font-bold transition-all touch-target font-mono"
            >
              <Shirt className="w-4 h-4" /> 아바타 꾸미기 (WARDROBE)
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-400 tracking-wider">
              {isSimulatedLobby ? '모의 플레이 중 (SIMULATED)' : '실시간 메타버스 활성화 (ONLINE)'}
            </span>
          </div>
        </div>
      </div>

      {!joinedPlayer && !classroomSession && !isSimulatedLobby ? (
        /* Lobby Entry Selector & Session Join Screen */
        <LobbyEntryScreen
          inputSessionCode={inputSessionCode}
          onInputChange={setInputSessionCode}
          onJoinWithCode={handleJoinWithCode}
          onSelectUnit={handleInitSimulatedLobby}
          unlockedBadges={progress.unlockedBadges}
        />
      ) : (
        <>
          {/* Active Metaverse Lobby Map view */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Panel */}
          <LobbySidebar
            studentName={studentName}
            studentAvatar={studentAvatar}
            classroomSession={classroomSession}
            sessionCode={sessionCode}
            isSimulatedLobby={isSimulatedLobby}
            chosenUnitId={chosenUnitId}
            localStudents={localStudents}
            playerPos={playerPos}
            progress={progress}
            equippedCosmetics={equippedCosmetics}
            activeSidebarTab={activeSidebarTab}
            onTabChange={setActiveSidebarTab}
            getTrainerInfo={getTrainerInfo}
            calculateCP={calculateCP}
            claimQuestReward={claimQuestReward}
            claimDailyQuestReward={claimDailyQuestReward}
            onStartSimulatedQuiz={handleStartSimulatedQuiz}
            onStartBattle={onStartBattle}
            onOpenCenter={() => setShowCenterModal(true)}
            onOpenGym={() => setShowGymModal(true)}
          />

          {/* Right Panel: 2D Metaverse Canvas and HUD */}
          <div className="lg:col-span-3 glass-panel p-4 border-cyan-500/20 bg-gray-950/80 flex flex-col justify-between items-center overflow-x-auto min-w-[320px] relative">
            {joinedPlayer ? (
              <div className="relative w-full aspect-[4/3] max-w-[768px]">
                <PhaserCanvas
                  sessionCode={sessionCode}
                  player={joinedPlayer}
                  onZoneAction={handleZoneAction}
                />
                <LobbyOverlay
                  sessionCode={sessionCode}
                  playerName={studentName || '학습원'}
                  playerAvatar={studentAvatar || '⚡'}
                  playerPos={playerPos}
                  classmates={localStudents
                    .filter(s => s.name !== studentName)
                    .map(s => ({
                      id: s.name,
                      nickname: s.name,
                      x: s.x,
                      y: s.y
                    }))
                  }
                  onEmoteTrigger={handleEmoteTrigger}
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] max-w-[768px] flex flex-col items-center justify-center bg-gray-950/40 border border-gray-900 rounded-lg p-12 text-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
                <span className="text-gray-400 text-sm font-mono">// INITIALIZING PLAYER WARDROBE CONTEXT...</span>
              </div>
            )}

            {/* Special Locations Legend Grid */}
            <div className="flex flex-wrap gap-4 justify-center text-[9px] font-mono text-gray-500 pt-3 border-t border-gray-900 mt-4 select-none w-full">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500/20 border border-amber-500/40 rounded" /> 퀴즈 포탈 (North Portal)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500/20 border border-red-500/40 rounded" /> 배틀 아레나 (East Match)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-purple-500/20 border border-purple-500/40 rounded" /> 보스 레이드 존 (West Raid)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded" /> 도감 박물관 (South Museum)
              </span>
            </div>
          </div>

        </div>

        {/* Lobby Chat Panel */}
        {sessionCode && (
          <LobbyChatPanel
            sessionCode={sessionCode}
            playerName={studentName || '학습원'}
            playerAvatar={studentAvatar || '⚡'}
          />
        )}

        {/* Shop Modal Overlay */}
        {showShopModal && (
          <LobbyShopModal
            progress={progress}
            onPurchase={purchaseItem}
            onClose={() => setShowShopModal(false)}
          />
        )}
        </>
      )}

      {/* Pokemon Center Overlay */}
      {showCenterModal && (
        <PokemonCenter onClose={() => setShowCenterModal(false)} />
      )}

      {/* Gym Leader Battle Overlay */}
      {showGymModal && (
        <GymLeaderBattle
          unitId={classroomSession ? classroomSession.activeUnitId : chosenUnitId}
          onClose={() => setShowGymModal(false)}
          onDefeated={() => {
            setShowGymModal(false);
            const local = getLocalPlayer();
            if (local) setJoinedPlayer(local);
          }}
          onGoToCenter={() => {
            setShowGymModal(false);
            setShowCenterModal(true);
          }}
        />
      )}

      {showLabScreen && (
        <LabScreen
          progress={progress}
          onStartQuiz={(unitId) => { setShowLabScreen(false); handleZoneAction('quiz', unitId); }}
          onClaimDailyQuest={(questId, reward) => {
            claimDailyQuestReward(questId, reward);
            const local = getLocalPlayer();
            if (local) setJoinedPlayer(local);
          }}
          onClose={() => setShowLabScreen(false)}
        />
      )}

      {/* Tournament Bracket Overlay */}
      {classroomSession?.status === 'tournament' && classroomSession.tournament && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <TournamentBracketView
              bracket={classroomSession.tournament}
              myName={studentName}
            />
            <p className="text-center text-xs font-mono text-gray-500 mt-3">
              교사가 대결 결과를 선택하면 다음 라운드로 진행됩니다.
            </p>
          </div>
        </div>
      )}

      {/* Zone Entry Panel — shown when player enters a quiz portal */}
      {zoneEntry && (
        <ZoneEntryPanel
          unitId={zoneEntry.unitId}
          onStartQuiz={() => { setZoneEntry(null); onStartQuiz(zoneEntry.unitId); }}
          onOpenNpc={() => {
            const npcName = NPC_NAMES_BY_UNIT[zoneEntry.unitId] ?? '갈릴레이';
            setZoneEntry(null);
            setActiveNpcName(npcName);
            setShowNpcQuest(true);
          }}
          onClose={() => setZoneEntry(null)}
        />
      )}

      {/* Storytelling NPC Quest Modal */}
      {showNpcQuest && (
        <NpcQuestModal
          npcName={activeNpcName}
          onClose={() => setShowNpcQuest(false)}
        />
      )}
    </div>
  );
}
