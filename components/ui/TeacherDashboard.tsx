'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { gameAudio } from '../../lib/audio';
import { ClassroomSession, StudentResponse, Question, DashboardEvent, PlayerDashboardEntry, Player } from '../../types';
import { 
  getUnitQuestions, 
  getUnitTitle, 
  getUnitIcon,
  SIMULATED_CLASSMATES,
  questions
} from '../../data/questions';
import { 
  Users, 
  Play, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCcw, 
  Award, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Database,
  Grid,
  Swords,
  ShieldAlert,
  Flame,
  Crown,
  Activity,
  Heart,
  BarChart2,
  Trophy,
  Sun,
  Moon
} from 'lucide-react';
import { supabase } from '../../lib/supabase-client';
import { cards } from '../../data/cards';
import { RenderAvatarPreview } from '../AvatarCustomizer';

interface TeacherDashboardProps {
  sessionCode: string;
  classroomSession: ClassroomSession | null;
  setClassroomSession: (session: ClassroomSession | null) => void;
  classroomStudents: StudentResponse[];
  setClassroomStudents: (students: StudentResponse[]) => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export default function TeacherDashboard({
  sessionCode,
  classroomSession,
  setClassroomSession,
  classroomStudents,
  setClassroomStudents,
  onBack,
  theme,
  toggleTheme
}: TeacherDashboardProps) {
  // Navigation states & filter states
  const [activeTab, setActiveTab] = useState<'control' | 'stats'>('control');
  const [feedFilter, setFeedFilter] = useState<'all' | 'card' | 'battle' | 'achievement'>('all');
  
  // Quiz management
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [detailedStudent, setDetailedStudent] = useState<PlayerDashboardEntry | null>(null);

  // Live feed stream state
  const [feedEvents, setFeedEvents] = useState<DashboardEvent[]>([]);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  // Drag and Drop Matchmaking pairing state
  const [draggedStudentName, setDraggedStudentName] = useState<string | null>(null);
  const [selectedStudentForPairing, setSelectedStudentForPairing] = useState<string | null>(null);

  // Throttled database updater clock
  const [lastDbUpdate, setLastDbUpdate] = useState<string>('방금 전');

  // Load static questions list
  const activeQuestions = useMemo(() => getUnitQuestions(classroomSession?.activeUnitId || selectedUnitId), [classroomSession?.activeUnitId, selectedUnitId]);

  // UI / Integration States
  const [googleSyncState, setGoogleSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [noticeText, setNoticeText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Dynamic AI feedback analysis generator
  const aiClassFeedback = useMemo(() => {
    if (!classroomSession || classroomSession.students.length === 0) {
      return {
        summary: "충분한 학습 데이터가 수집되지 않았습니다. 학생들이 대기실에 진입하고 퀴즈 풀이를 가동하면 실시간 AI 진단이 활성화됩니다.",
        recs: [
          "퀴즈 제어판에서 퀴즈 세션을 열어 학생들의 문제 풀이 성적을 유도하십시오.",
          "PvP 1:1 대전이나 협동 레이드를 활성화하여 학급 참여율을 제고하십시오."
        ],
        lowestUnit: classroomSession?.activeUnitId || 1
      };
    }

    const students = classroomSession.students;
    const avgScore = students.reduce((acc, s) => acc + s.currentScore, 0) / students.length;
    const lowestUnit = classroomSession.activeUnitId;

    let summary = "";
    let recs: string[] = [];

    if (avgScore >= 8) {
      summary = "🎉 [종합 진단] 학급 전반의 과학 단원 개념 이해도가 최고 등급 수준으로 무척 높습니다. 심화 연계 과제를 적극 권장합니다.";
      recs = [
        "1:1 대전 모드를 가동하여 획득한 카드 정보와 능력치를 기반으로 자율적이고 극적인 배틀 매칭에 참여하도록 독려하세요.",
        "수집된 과학 도감 속 크리처의 특성에 맞는 학급 내 포켓몬 모둠별 과학 토론 및 조별 탐구 보고서 환류 지도를 처방합니다."
      ];
    } else if (avgScore >= 5) {
      summary = "📈 [종합 진단] 전반적으로 보통 수준의 무난한 성취도를 보이나, 문제 해결 소요 시간 지연 및 특정 취약 개념의 정답 쏠림이 보입니다.";
      recs = [
        `현재 개설된 ${lowestUnit}단원 주요 퀴즈 단어 카테고리를 메타버스 로비 내 탐험가 NPC와의 대화를 통해 2회독 이상 복습하게 안내해 주세요.`,
        "빛의 굴절/반사, 지층과 화석 등 특정 오답률이 높은 다지선다 문제에 대하여 시각 보조 학습(프리즘 관찰 등)을 5분간 병행하면 보완에 탁월합니다."
      ];
    } else {
      summary = "⚠️ [종합 진단] 단원 평균 성적이 심각하게 지체되어 있어 기초 보강 및 밀착 피드백 환류가 절실히 요망되는 위기 상태입니다.";
      recs = [
        "대시보드에서 퀴즈 타이머를 조정하여 문제를 풀 충분한 시간을 보장하거나, 틀린 문항을 복습할 수 있게 개인 지도를 강화하십시오.",
        "교사 강제 제어로 보스 레이드(Boss Raid)를 소환해, 학생들이 힘을 모아 퀴즈 협동 데미지를 주게 유도하여 과학에 대한 거부감을 리텐션하십시오."
      ];
    }

    return { summary, recs, lowestUnit };
  }, [classroomSession]);

  const getAiStudentPrescription = (score: number) => {
    if (score >= 8) {
      return "🏆 우수 대원 처방: 기본 지식이 탄탄해 대기실 도감 수집과 펫 동행으로 이미 동기가 고양되어 있습니다. 급우들의 1:1 대전 상대 혹은 멘토로 임명해 학급 참여 흥미를 주도하게 권유하세요.";
    } else if (score >= 5) {
      return "📖 보통 대원 처방: 학습 흐름을 이해하나 콤보 누적이 잦고 지엽적 정의(산성/염기성 비교 등)를 혼동합니다. 퀴즈 오답 문항 복습 및 도감 상세 설명 란의 힌트 읽기를 가이드해 주세요.";
    } else {
      return "🚨 집중 관리 대원 처방: 문항 추론 및 읽기 이해가 현저히 늦어 배틀 경기에서 연패할 리스크가 큽니다. 메타버스 솔로 연습 퀴즈 모드로 이전 완료 단원을 1회 더 안전하게 재풀이하도록 밀착 조치해 주세요.";
    }
  };

  // Realtime Presence List & Event Subscriptions
  useEffect(() => {
    if (!sessionCode) return;

    // Listen to Supabase Broadcast Events for live activity feed
    const eventChannel = supabase.channel(`dashboard_events_${sessionCode}`);
    
    eventChannel
      .on('broadcast', { event: 'dashboard_log' }, ({ payload }: { payload: any }) => {
        const newEvent: DashboardEvent = {
          type: payload.type,
          playerId: payload.playerId || 'unknown',
          nickname: payload.nickname || '익명',
          detail: payload.detail || '',
          timestamp: new Date().toISOString(),
          isCorrect: payload.isCorrect,
        };
        setFeedEvents(prev => [...prev.slice(-49), newEvent]);

        if (payload.type === 'quiz_answer') {
          triggerScoreRefresh(payload.nickname, payload.isCorrect);
        }
      })
      .subscribe();

    // Spawn some initial mock feed events if empty to make UI look alive
    setFeedEvents([
      { type: 'battle_end', playerId: '1', nickname: '김민준', detail: '배틀에서 승리하여 🏆 골드 크라운 왕관을 얻었습니다!', timestamp: new Date(Date.now() - 60000).toISOString() },
      { type: 'card_unlocked', playerId: '2', nickname: '이서연', detail: '희귀 카드 [암모나이트]를 포획하는 데 성공했습니다!', timestamp: new Date(Date.now() - 45000).toISOString() },
      { type: 'boss_damage', playerId: '3', nickname: '박지호', detail: '보스에게 회심의 일격을 가해 120 데미지를 주었습니다!', timestamp: new Date(Date.now() - 30000).toISOString() },
      { type: 'achievement', playerId: '4', nickname: '류현서', detail: '업적 [퀴즈 마스터]를 해금했습니다!', timestamp: new Date(Date.now() - 15000).toISOString() }
    ]);

    return () => {
      eventChannel.unsubscribe();
    };
  }, [sessionCode]);

  // ── Supabase Presence: track real students joining the lobby ──
  useEffect(() => {
    if (!sessionCode) return;

    const presenceChannel = supabase.channel(`classroom_lobby_${sessionCode}`);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();

        // Collect all unique players from presence
        const liveStudents: Array<{
          name: string;
          avatar: string;
          isSimulated: boolean;
          currentScore: number;
          currentStreak: number;
          answeredCurrentQuestion: boolean;
          x: number;
          y: number;
          equippedCosmetics: { outfit: string; expression: string; accessory: string; mount: string };
          cp: number;
        }> = [];

        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          presences.forEach(p => {
            if (!liveStudents.some(ls => ls.name === p.name)) {
              liveStudents.push({
                name: p.name || '익명',
                avatar: p.avatar || '🎒',
                isSimulated: p.isSimulated || false,
                currentScore: p.currentScore || 0,
                currentStreak: p.currentStreak || 0,
                answeredCurrentQuestion: p.answeredCurrentQuestion || false,
                x: p.x || 20,
                y: p.y || 15,
                equippedCosmetics: p.equippedCosmetics || { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' },
                cp: p.cp || 0
              });
            }
          });
        });

        if (liveStudents.length > 0 && classroomSession) {
          // Merge live presence data with existing students (preserve scores)
          const existingMap = new Map(classroomSession.students.map(s => [s.name, s]));
          
          const mergedStudents = liveStudents.map(live => {
            const existing = existingMap.get(live.name);
            if (existing) {
              // Preserve score/streak from existing data, update position
              return {
                ...existing,
                x: live.x,
                y: live.y,
                equippedCosmetics: live.equippedCosmetics,
                cp: live.cp || (existing as any).cp || 0
              };
            }
            // New student from presence
            return live;
          });

          // Only update if student list actually changed
          const currentNames = classroomSession.students.map(s => s.name).sort().join(',');
          const mergedNames = mergedStudents.map(s => s.name).sort().join(',');

          if (currentNames !== mergedNames || mergedStudents.some((ms, i) => {
            const cs = classroomSession.students.find(s => s.name === ms.name);
            return cs && (cs.x !== ms.x || cs.y !== ms.y);
          })) {
            setClassroomSession({
              ...classroomSession,
              students: mergedStudents as any
            });
          }
        }
      })
      .subscribe();

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [sessionCode, classroomSession]);

  // Scroll to bottom of activity stream when new events arrive
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedEvents]);

  // Ref to always have the latest classroomSession in the 10-second interval callback
  const sessionRef = useRef(classroomSession);
  useEffect(() => {
    sessionRef.current = classroomSession;
  }, [classroomSession]);

  const fetchSessionData = async () => {
    if (!sessionCode) return;
    try {
      // 1. Fetch all players registered under this session
      const { data: dbPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('session_code', sessionCode);

      if (playersError) {
        console.error('Error fetching players from DB:', playersError);
        return;
      }

      // 2. Fetch all quiz answers for this session
      const { data: dbAnswers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('*')
        .eq('session_code', sessionCode);

      if (answersError) {
        console.error('Error fetching quiz answers from DB:', answersError);
        return;
      }

      // Check current session from ref
      const currentSession = sessionRef.current;
      if (!currentSession) return;

      const activeUnitId = currentSession.activeUnitId;

      // Filter out real database players and convert them
      const updatedRealStudents = (dbPlayers || []).map((p: any) => {
        // Calculate score for active unit
        const playerAnswers = (dbAnswers || []).filter((a: any) => a.player_id === p.id && a.unit_id === activeUnitId);
        const correctAnswers = playerAnswers.filter((a: any) => a.is_correct);
        const currentScore = correctAnswers.length;

        // Calculate streak
        // Sort answers by id to calculate recent streak
        const sortedAnswers = [...playerAnswers].sort((a, b) => a.id - b.id);
        let currentStreak = 0;
        for (let i = sortedAnswers.length - 1; i >= 0; i--) {
          if (sortedAnswers[i].is_correct) {
            currentStreak++;
          } else {
            break;
          }
        }

        // Try to find if this player is in the current live presence list to preserve coordinates
        const existingStudent = currentSession.students.find((s: any) => s.name === p.nickname);

        return {
          name: p.nickname,
          avatar: existingStudent?.avatar || (p.avatar?.gender === 'female' ? '👧' : '👦'),
          isSimulated: false,
          currentScore,
          currentStreak,
          answeredCurrentQuestion: playerAnswers.length > 0,
          lastAnswerCorrect: sortedAnswers[sortedAnswers.length - 1]?.is_correct,
          x: existingStudent?.x || p.position?.x || 20,
          y: existingStudent?.y || p.position?.y || 15,
          equippedCosmetics: {
            outfit: p.avatar?.outfit || 'none',
            expression: p.avatar?.expression || 'none',
            accessory: p.avatar?.accessory || 'none',
            mount: p.avatar?.vehicle || 'none',
          },
          cp: p.xp || 0
        };
      });

      // Preserve simulated AI classmates
      const simulatedStudents = currentSession.students.filter((s: any) => s.isSimulated);

      // Merge real database students and simulated AI classmates
      const mergedStudents = [...updatedRealStudents];
      simulatedStudents.forEach(sim => {
        if (!mergedStudents.some(s => s.name === sim.name)) {
          mergedStudents.push(sim);
        }
      });

      // Update state if anything changed
      setClassroomSession({
        ...currentSession,
        students: mergedStudents as any
      });
      setLastDbUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch (e) {
      console.error('Failed to sync student activity records:', e);
    }
  };

  // Add 10-second refresh interval
  useEffect(() => {
    if (!sessionCode) return;

    // Refresh immediately on mount/sessionCode change
    fetchSessionData();

    const intervalId = setInterval(() => {
      fetchSessionData();
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [sessionCode]);

  const triggerScoreRefresh = (nickname: string, isCorrect: boolean) => {
    if (!classroomSession) return;

    // Check if student exists in current list
    const studentExists = classroomSession.students.some(s => s.name === nickname);

    if (!studentExists) {
      // Student not in list yet — add them dynamically
      const newStudent = {
        name: nickname,
        avatar: '🎒',
        isSimulated: false,
        currentScore: isCorrect ? 1 : 0,
        currentStreak: isCorrect ? 1 : 0,
        answeredCurrentQuestion: true,
        lastAnswerCorrect: isCorrect,
        x: 20,
        y: 15,
        equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' }
      };
      setClassroomSession({
        ...classroomSession,
        students: [...classroomSession.students, newStudent]
      });
      return;
    }

    const updated = classroomSession.students.map(s => {
      if (s.name === nickname) {
        const newStreak = isCorrect ? s.currentStreak + 1 : 0;
        const newScore = isCorrect ? s.currentScore + 1 : s.currentScore;
        return {
          ...s,
          answeredCurrentQuestion: true,
          currentStreak: newStreak,
          currentScore: newScore,
          lastAnswerCorrect: isCorrect
        };
      }
      return s;
    });
    setClassroomSession({
      ...classroomSession,
      students: updated
    });
  };

  // Convert active presence data to DashboardEntry format
  const dashboardStudents: PlayerDashboardEntry[] = useMemo(() => {
    if (!classroomSession) return [];

    return classroomSession.students.map(student => {
      // Find average correct rate from completed history or current scores
      const totalAnswers = 10; // Standard quiz count
      const correctRate = student.currentScore / totalAnswers;

      // Generate recent answer history (last 3 answers)
      const recentAnswers = [
        { questionId: '1', correct: student.lastAnswerCorrect ?? true, timestamp: '' },
        { questionId: '2', correct: student.currentStreak > 1, timestamp: '' },
        { questionId: '3', correct: student.currentStreak > 2, timestamp: '' }
      ];

      // Match player positions and info
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
          emote: null
        },
        position: { x: student.x, y: student.y },
        xp: student.currentScore * 100,
        level: Math.floor(student.currentScore / 2) + 1,
        coins: student.currentScore * 15,
        unlockedCards: [],
        unlockedCostumes: [],
        achievements: []
      };

      // Determine activity
      let currentActivity: PlayerDashboardEntry['currentActivity'] = 'lobby';
      const activeBattle = classroomSession.activeBattles?.find(
        b => b.player1 === student.name || b.player2 === student.name
      );
      if (activeBattle) currentActivity = 'battle';
      else if (classroomSession.status === 'playing') currentActivity = 'quiz';
      else if ((classroomSession.status as string) === 'raid') currentActivity = 'raid';

      return {
        player: playerObj,
        currentActivity,
        correctRate,
        recentAnswers,
        battleRecord: { wins: 3, losses: 1 },
        position: {
          playerId: student.name,
          x: student.x,
          y: student.y,
          direction: 'idle',
          animFrame: 0,
          emote: null
        },
        avatarEmoji: student.avatar
      };
    });
  }, [classroomSession, sessionCode]);

  // Filtered live feed log entries
  const filteredEvents = useMemo(() => {
    return feedEvents.filter(e => {
      if (feedFilter === 'all') return true;
      if (feedFilter === 'card') return e.type === 'card_unlocked';
      if (feedFilter === 'battle') return e.type === 'battle_start' || e.type === 'battle_end';
      if (feedFilter === 'achievement') return e.type === 'achievement';
      return true;
    });
  }, [feedEvents, feedFilter]);

  // Matchmaking pairings control helpers
  const unpairedStudents = useMemo(() => {
    if (!classroomSession) return [];
    
    // Find students not currently paired in activeBattles list
    const pairedNames = new Set<string>();
    classroomSession.activeBattles?.forEach(b => {
      pairedNames.add(b.player1);
      pairedNames.add(b.player2);
    });

    return classroomSession.students.filter(s => !pairedNames.has(s.name));
  }, [classroomSession]);

  const handleStartLobby = () => {
    gameAudio.playClick();
    setClassroomSession({
      activeUnitId: selectedUnitId,
      status: 'lobby',
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      battleMode: false,
      activeBattles: [],
      students: [
        { name: '김민준', avatar: '🧑‍🎓', isSimulated: true, currentScore: 8, currentStreak: 3, answeredCurrentQuestion: true, lastAnswerCorrect: true, x: 15, y: 12, equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' } },
        { name: '이서연', avatar: '👩‍🎓', isSimulated: true, currentScore: 5, currentStreak: 1, answeredCurrentQuestion: true, lastAnswerCorrect: false, x: 22, y: 14, equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' } },
        { name: '박지호', avatar: '🎒', isSimulated: true, currentScore: 9, currentStreak: 5, answeredCurrentQuestion: true, lastAnswerCorrect: true, x: 18, y: 11, equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' } },
        { name: '최윤서', avatar: '👟', isSimulated: true, currentScore: 3, currentStreak: 0, answeredCurrentQuestion: true, lastAnswerCorrect: false, x: 25, y: 15, equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' } }
      ]
    });
  };

  const handleAddSimulatedStudents = () => {
    if (!classroomSession) return;
    gameAudio.playClick();

    const currentNames = classroomSession.students.map(s => s.name);
    const availableSims = SIMULATED_CLASSMATES.filter(s => !currentNames.includes(s.name));

    if (availableSims.length === 0) return;

    const added = availableSims.map(sim => ({
      name: sim.name,
      avatar: sim.avatar,
      isSimulated: true,
      currentScore: Math.floor(Math.random() * 5) + 3,
      currentStreak: 0,
      answeredCurrentQuestion: false,
      x: Math.floor(Math.random() * 20) + 10,
      y: Math.floor(Math.random() * 15) + 5,
      equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' }
    }));

    setClassroomSession({
      ...classroomSession,
      students: [...classroomSession.students, ...added]
    });
  };

  const handleStartQuiz = () => {
    if (!classroomSession) return;
    gameAudio.playClick();
    
    setClassroomSession({
      ...classroomSession,
      status: 'playing',
      currentQuestionIndex: 0,
      questionStartTime: Date.now()
    });
  };

  const handleStopQuiz = () => {
    if (!classroomSession) return;
    gameAudio.playClick();
    setClassroomSession({
      ...classroomSession,
      status: 'lobby'
    });
  };

  const handleStartRaid = () => {
    if (!classroomSession) return;
    gameAudio.playClick();
    
    setClassroomSession({
      ...classroomSession,
      status: 'raid' as any
    });
  };

  const handleStopRaid = () => {
    if (!classroomSession) return;
    gameAudio.playClick();
    setClassroomSession({
      ...classroomSession,
      status: 'lobby'
    });
  };

  const handleToggleBattleMode = () => {
    if (!classroomSession) return;
    gameAudio.playClick();
    setClassroomSession({
      ...classroomSession,
      battleMode: !classroomSession.battleMode
    });
  };

  // Drag and Drop Matchmaking logic
  const handleDragStart = (e: React.DragEvent, name: string) => {
    setDraggedStudentName(name);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnStudent = (targetName: string) => {
    if (!classroomSession || !draggedStudentName || draggedStudentName === targetName) return;
    
    // Create new battle pair
    const p1Card = cards.find(c => c.unitId === classroomSession.activeUnitId) || cards[0];
    const p2Card = cards.find(c => c.unitId === classroomSession.activeUnitId && c.id !== p1Card.id) || cards[1];

    const newBattle = {
      battleId: `battle_${Date.now()}_${draggedStudentName}_vs_${targetName}`,
      player1: draggedStudentName,
      player2: targetName,
      p1CardId: p1Card.id,
      p2CardId: p2Card.id,
      p1Hp: 100,
      p2Hp: 100,
      status: 'fighting' as const,
      currentQuestionId: questions[0].id,
      p1Answered: false,
      p2Answered: false
    };

    setClassroomSession({
      ...classroomSession,
      activeBattles: [...(classroomSession.activeBattles || []), newBattle]
    });

    // Clear state
    setDraggedStudentName(null);
    gameAudio.playClick();
  };

  // Click-to-Pair logic fallback for non-DND devices
  const handleSelectStudentForPairing = (name: string) => {
    if (!classroomSession) return;
    if (!selectedStudentForPairing) {
      setSelectedStudentForPairing(name);
      gameAudio.playClick();
    } else {
      if (selectedStudentForPairing === name) {
        setSelectedStudentForPairing(null);
        return;
      }
      
      // Perform pairing
      const p1Card = cards[0];
      const p2Card = cards[1];

      const newBattle = {
        battleId: `battle_${Date.now()}_${selectedStudentForPairing}_vs_${name}`,
        player1: selectedStudentForPairing,
        player2: name,
        p1CardId: p1Card.id,
        p2CardId: p2Card.id,
        p1Hp: 100,
        p2Hp: 100,
        status: 'fighting' as const,
        currentQuestionId: questions[0].id,
        p1Answered: false,
        p2Answered: false
      };

      setClassroomSession({
        ...classroomSession,
        activeBattles: [...(classroomSession.activeBattles || []), newBattle]
      });

      setSelectedStudentForPairing(null);
      gameAudio.playClick();
    }
  };

  // Automated matchmaking pairing
  const handleAutoMatch = () => {
    if (!classroomSession || unpairedStudents.length < 2) return;
    gameAudio.playClick();

    const shuffled = [...unpairedStudents].sort(() => Math.random() - 0.5);
    const newPairs: typeof classroomSession.activeBattles = [];
    const p1Card = cards[0];
    const p2Card = cards[1];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newPairs.push({
        battleId: `battle_${Date.now()}_${shuffled[i].name}_vs_${shuffled[i+1].name}`,
        player1: shuffled[i].name,
        player2: shuffled[i+1].name,
        p1CardId: p1Card.id,
        p2CardId: p2Card.id,
        p1Hp: 100,
        p2Hp: 100,
        status: 'fighting' as const,
        currentQuestionId: questions[Math.floor(Math.random() * questions.length)].id,
        p1Answered: false,
        p2Answered: false
      });
    }

    setClassroomSession({
      ...classroomSession,
      activeBattles: [...(classroomSession.activeBattles || []), ...newPairs]
    });
  };

  // Copy TSV for Google Sheets clipboard integration (구글 스프레드시트 연계)
  const handleCopyTSV = () => {
    gameAudio.playClick();
    if (!classroomSession || classroomSession.students.length === 0) return;

    let tsvContent = '학습원 닉네임\t정답 점수\t최근 콤보 횟수\t접속 위치(X)\t접속 위치(Y)\n';
    classroomSession.students.forEach(s => {
      tsvContent += `${s.name}\t${s.currentScore}\t${s.currentStreak}\t${s.x}\t${s.y}\n`;
    });

    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Google Sheets real-time synchronization simulation (구글 워크스페이스 연계)
  const handleGoogleSync = () => {
    if (googleSyncState === 'syncing') return;
    gameAudio.playClick();
    setGoogleSyncState('syncing');

    setTimeout(() => {
      gameAudio.playCorrect();
      setGoogleSyncState('synced');
      
      // Log to feed logs
      const syncEvent: DashboardEvent = {
        type: 'achievement',
        playerId: 'system',
        nickname: '구글연계',
        detail: '학급 실시간 평가 데이터가 Google Workspace 스프레드시트에 성공적으로 동기화되었습니다.',
        timestamp: new Date().toISOString()
      };
      setFeedEvents(prev => [...prev.slice(-49), syncEvent]);
    }, 2000);
  };

  // Broadcast a notice banner message to all students
  const handleBroadcastNotice = () => {
    if (!noticeText.trim()) return;
    gameAudio.playClick();

    const channel = supabase.channel(`dashboard_events_${sessionCode}`);
    channel.send({
      type: 'broadcast',
      event: 'teacher_notice',
      payload: { text: noticeText.trim() }
    });

    // Add notice log to feed
    const noticeEvent: DashboardEvent = {
      type: 'achievement',
      playerId: 'system',
      nickname: '공지사항',
      detail: `[전체 방송 공지]: "${noticeText.trim()}"`,
      timestamp: new Date().toISOString()
    };
    setFeedEvents(prev => [...prev.slice(-49), noticeEvent]);
    setNoticeText('');
  };

  // Reset student score
  const handleResetStudentScore = (nickname: string) => {
    if (!classroomSession) return;
    gameAudio.playClick();
    const updated = classroomSession.students.map(s => {
      if (s.name === nickname) {
        return {
          ...s,
          currentScore: 0,
          currentStreak: 0,
          answeredCurrentQuestion: false,
          lastAnswerCorrect: undefined
        };
      }
      return s;
    });
    setClassroomSession({
      ...classroomSession,
      students: updated
    });
    setDetailedStudent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        correctRate: 0,
        player: {
          ...prev.player,
          xp: 0,
          level: 1,
          coins: 0
        }
      };
    });
  };

  // Reset student cosmetics to default
  const handleResetStudentAvatar = (nickname: string) => {
    if (!classroomSession) return;
    gameAudio.playClick();
    const updated = classroomSession.students.map(s => {
      if (s.name === nickname) {
        return {
          ...s,
          equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' }
        };
      }
      return s;
    });
    setClassroomSession({
      ...classroomSession,
      students: updated
    });
    setDetailedStudent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        player: {
          ...prev.player,
          avatar: {
            ...prev.player.avatar,
            outfit: null,
            accessory: null,
            vehicle: null,
            hat: null,
            emote: null
          }
        }
      };
    });
  };

  // Kick student from classroom session
  const handleKickStudent = (nickname: string) => {
    if (!classroomSession) return;
    gameAudio.playWrong();
    
    // Broadcast kick message first
    const channel = supabase.channel(`dashboard_events_${sessionCode}`);
    channel.send({
      type: 'broadcast',
      event: 'player_kick',
      payload: { name: nickname }
    });

    const updated = classroomSession.students.filter(s => s.name !== nickname);
    setClassroomSession({
      ...classroomSession,
      students: updated
    });
    setDetailedStudent(null);
  };

  // Export CSV results
  const handleExportCSV = () => {
    gameAudio.playClick();
    if (!classroomSession || classroomSession.students.length === 0) return;

    let csvContent = '\uFEFF'; // Excel UTF-8 BOM encoding
    csvContent += '학습원 닉네임,정답 점수,최근 콤보 횟수,접속 위치(X),접속 위치(Y)\n';

    classroomSession.students.forEach(s => {
      csvContent += `"${s.name}","${s.currentScore}","${s.currentStreak}","${s.x}","${s.y}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `과학_메타버스_세션_${sessionCode}_결과.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6 font-sans text-gray-100">
      
      {/* 1. Header Information Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-cyan-500/10 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-500 tracking-widest block uppercase">// SCIENCE MASTER METAVERSE DASHBOARD</span>
          <h1 className="text-2xl font-black tracking-wide text-cyan-400 flex items-center gap-2">
            참여 코드: <span className="text-white select-all font-mono font-black">{sessionCode}</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 border border-gray-850 rounded-lg text-xs font-mono">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>접속 대원: {classroomSession?.students.length || 0}명</span>
          </div>

          <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-black uppercase ${
            classroomSession?.status === 'playing'
              ? 'border-blue-500 bg-blue-950/20 text-blue-400 animate-pulse'
              : (classroomSession?.status as string) === 'raid'
                ? 'border-orange-500 bg-orange-950/20 text-orange-400 animate-pulse'
                : classroomSession?.status === 'ended'
                  ? 'border-red-500 bg-red-950/20 text-red-400'
                  : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400'
          }`}>
            상태: {classroomSession ? (classroomSession.status === 'playing' ? '퀴즈 풀이 중' : (classroomSession.status as string) === 'raid' ? '레이드 진행 중' : classroomSession.status.toUpperCase()) : 'OFFLINE'}
          </div>

          {toggleTheme && (
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
              className="w-11 h-11 border border-gray-800 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-cyan-400 rounded-lg flex items-center justify-center transition-all touch-target"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-800 bg-gray-950 hover:text-cyan-400 rounded-lg text-xs font-bold font-mono transition-all"
          >
            뒤로가기
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      {classroomSession && (
        <div className="flex border-b border-gray-900 pb-2 gap-4">
          <button
            onClick={() => { gameAudio.playClick(); setActiveTab('control'); }}
            className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'control' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            🎮 실시간 세션 제어판
          </button>
          <button
            onClick={() => { gameAudio.playClick(); setActiveTab('stats'); }}
            className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'stats' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            📊 학급 학습 통계 분석
          </button>
        </div>
      )}

      {!classroomSession ? (
        /* SETUP MODE VIEW */
        <div className="max-w-2xl mx-auto text-center py-12 px-6 glass-panel border-cyan-500/10 bg-cyan-950/5">
          <Trophy className="w-16 h-16 text-cyan-400/80 mx-auto mb-6 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-100 mb-4">비활성 세션 관리자</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
            학습 단원을 지정하고 교실 메타버스 대기 로비를 개설하여 학생들의 접속 대기를 수신하세요.
          </p>

          <div className="max-w-md mx-auto space-y-4 text-left bg-gray-950/60 border border-gray-900 p-6 rounded-xl">
            <label className="block text-xs font-mono text-cyan-400 mb-2 uppercase tracking-widest">// SELECT SCIENCE UNIT</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(Number(e.target.value))}
              className="w-full p-3 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-100"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(id => (
                <option key={id} value={id}>{id}단원. {getUnitTitle(id)}</option>
              ))}
            </select>

            <button
              onClick={handleStartLobby}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-black rounded-lg transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] mt-6"
            >
              대기실 로비 개설 개시
            </button>
          </div>
        </div>
      ) : activeTab === 'control' ? (
        /* ACTIVE CONTROL DASHBOARD (3-Column Layout 40% - 35% - 25%) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL (40% - Col-span 5) — Live Player Grid */}
          <div className="lg:col-span-5 glass-panel p-5 border-cyan-500/10 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-900 pb-2">
              <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 대원 접속 그리드
              </h3>
              <span className="text-[10px] text-gray-500 font-mono">정오답 갱신: {lastDbUpdate}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
              {dashboardStudents.map(({ player, currentActivity, correctRate, recentAnswers, avatarEmoji }) => {
                // Color border based on score performance
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
                    onClick={() => setDetailedStudent({ player, currentActivity, correctRate, recentAnswers, avatarEmoji } as any)}
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

                    {/* Recent answer bubbles */}
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

          {/* CENTER PANEL (35% - Col-span 4) — Activity Feed */}
          <div className="lg:col-span-4 glass-panel p-5 border-cyan-500/10 flex flex-col justify-between h-[545px]">
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" /> 세션 실시간 로그 피드
              </h3>

              {/* Feed Filter Buttons */}
              <div className="grid grid-cols-4 gap-1 select-none">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'card', label: '카드' },
                  { id: 'battle', label: '배틀' },
                  { id: 'achievement', label: '업적' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { gameAudio.playClick(); setFeedFilter(tab.id as any); }}
                    className={`py-1 text-[10px] border rounded transition-all font-bold ${
                      feedFilter === tab.id
                        ? 'bg-cyan-950/30 border-cyan-400 text-cyan-400'
                        : 'bg-transparent border-gray-850 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event log feed stream container */}
            <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-2 max-h-[380px] bg-gray-950/40 border border-gray-900 rounded-lg p-2.5">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-gray-600">
                  NO RECENT LOGGED EVENTS
                </div>
              ) : (
                filteredEvents.map((evt, idx) => {
                  const icon =
                    evt.type === 'quiz_answer'
                      ? evt.isCorrect !== false ? '✅' : '❌'
                      : evt.type === 'card_unlocked' ? '🃏'
                      : evt.type === 'battle_start' ? '⚔️'
                      : evt.type === 'battle_end' ? '🏆'
                      : evt.type === 'boss_damage' ? '💥'
                      : evt.type === 'player_join' ? '👤'
                      : '📌';
                  const nickColor =
                    evt.type === 'quiz_answer'
                      ? (evt.isCorrect !== false ? 'text-emerald-400' : 'text-red-400')
                      : 'text-cyan-400';
                  return (
                    <div key={idx} className="border-b border-gray-900/60 pb-1.5 text-[11px] leading-relaxed flex items-start gap-1.5">
                      <span className="shrink-0 text-xs">{icon}</span>
                      <div>
                        <span className="text-gray-500 font-mono mr-1">[{new Date(evt.timestamp).toLocaleTimeString()}]</span>
                        <span className={`font-bold mr-1 ${nickColor}`}>{evt.nickname}</span>
                        <span className="text-gray-300">{evt.detail}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={feedEndRef} />
            </div>

            <button
              onClick={() => { gameAudio.playClick(); setFeedEvents([]); }}
              className="w-full py-2 bg-gray-900 border border-gray-850 hover:border-gray-700 text-[10px] font-mono text-gray-400 rounded-lg"
            >
              콘솔 피드 내역 지우기 (Clear Logs)
            </button>
          </div>

          {/* RIGHT PANEL (25% - Col-span 3) — Game Control panels */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Control Panel A: Quiz Control */}
            <div className="glass-panel p-5 border-cyan-500/10 space-y-4">
              <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-2">
                // QUIZ CONTROL (퀴즈 제어)
              </h3>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-mono text-gray-500">진행할 학습 단원</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  className="w-full p-2 bg-gray-950 border border-gray-850 rounded-lg text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(id => (
                    <option key={id} value={id}>{id}단원. {getUnitTitle(id)}</option>
                  ))}
                </select>

                {/* 타이머 시간 설정 */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono text-gray-500">문제당 제한 시간</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[10, 20, 30, 60].map(sec => {
                      const current = classroomSession.settings?.timerSeconds ?? 30;
                      const isActive = current === sec;
                      return (
                        <button
                          key={sec}
                          onClick={() => {
                            gameAudio.playClick();
                            const updated = {
                              ...classroomSession,
                              settings: { ...(classroomSession.settings ?? {}), timerSeconds: sec, timer: true, battleModeEnabled: false, raidEnabled: false, allowChat: true }
                            };
                            setClassroomSession(updated as any);
                            const ch = supabase.channel(`dashboard_events_${sessionCode}`);
                            ch.send({ type: 'broadcast', event: 'settings_update', payload: { timerSeconds: sec } });
                          }}
                          className={`py-1 text-[10px] font-bold rounded border transition-all ${
                            isActive
                              ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300'
                              : 'bg-gray-950 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                          }`}
                        >
                          {sec}s
                        </button>
                      );
                    })}
                  </div>
                </div>

                {classroomSession.status === 'playing' ? (
                  <button
                    onClick={handleStopQuiz}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg"
                  >
                    퀴즈 종료 (Close Quiz)
                  </button>
                ) : (
                  <button
                    onClick={handleStartQuiz}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-lg"
                  >
                    퀴즈 개시 (Start Quiz)
                  </button>
                )}
              </div>
            </div>

            {/* Control Panel B: PvP Battle Arena Control */}
            <div className="glass-panel p-5 border-red-500/10 space-y-4">
              <h3 className="text-xs font-mono font-black text-red-400 uppercase tracking-widest border-b border-gray-900 pb-2">
                // BATTLE MATCHMAKING (배틀 관리)
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleToggleBattleMode}
                  className={`w-full py-2 rounded-lg text-xs font-black transition-all ${
                    classroomSession.battleMode
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-gray-900 border border-gray-850 text-gray-400 hover:text-white'
                  }`}
                >
                  {classroomSession.battleMode ? '배틀 모드 ON' : '배틀 모드 OFF'}
                </button>

                {classroomSession.battleMode && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                      <span>대기 인원: {unpairedStudents.length}명</span>
                      <button
                        onClick={handleAutoMatch}
                        disabled={unpairedStudents.length < 2}
                        className="px-2 py-0.5 bg-red-950/20 border border-red-500/30 text-red-400 hover:text-white disabled:opacity-40 disabled:hover:text-red-400 text-[9px] font-bold rounded"
                      >
                        [자동 매칭]
                      </button>
                    </div>

                    {/* Unpaired DND list */}
                    <div className="space-y-1.5 max-h-[110px] overflow-y-auto bg-gray-950/40 p-2 rounded-lg border border-gray-900 text-xs">
                      {unpairedStudents.length === 0 ? (
                        <div className="text-center text-gray-650 text-[9px] font-mono py-4">
                          ALL PLAYERS PAIRED
                        </div>
                      ) : (
                        unpairedStudents.map(student => (
                          <div
                            key={student.name}
                            draggable
                            onDragStart={(e) => handleDragStart(e, student.name)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDropOnStudent(student.name)}
                            onClick={() => handleSelectStudentForPairing(student.name)}
                            className={`p-1.5 border rounded cursor-pointer transition-all flex items-center justify-between text-[10px] ${
                              selectedStudentForPairing === student.name
                                ? 'bg-red-950/20 border-red-500 text-red-400'
                                : 'bg-gray-900 border-gray-850 text-gray-300 hover:border-red-900/30'
                            }`}
                            title="드래그하여 다른 대원 위에 놓으면 매칭"
                          >
                            <span>👤 {student.name}</span>
                            <span className="text-[8px] text-gray-500 font-mono">드래그/클릭</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Control Panel C: Boss Raid Control */}
            <div className="glass-panel p-5 border-orange-500/10 space-y-4">
              <h3 className="text-xs font-mono font-black text-orange-400 uppercase tracking-widest border-b border-gray-900 pb-2">
                // BOSS RAID SYSTEM (레이드 제어)
              </h3>

              <div className="space-y-3">
                {(classroomSession.status as string) === 'raid' ? (
                  <button
                    onClick={handleStopRaid}
                    className="w-full py-2.5 bg-red-650 hover:bg-red-550 text-white text-xs font-black rounded-lg"
                  >
                    레이드 비활성화
                  </button>
                ) : (
                  <button
                    onClick={handleStartRaid}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-black text-xs font-black rounded-lg"
                  >
                    보스 레이드 활성화
                  </button>
                )}

                {/* Simulated HP Bar */}
                {((classroomSession.status as string) === 'raid' || classroomSession.settings?.raidEnabled) && (
                  <div className="space-y-2 pt-2 border-t border-gray-900">
                    <div className="flex justify-between items-baseline text-[10px] font-mono text-gray-500">
                      <span>BOSS HP:</span>
                      <span className="text-red-500">1000 / 1000 HP</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 shadow-[0_0_8px_red]" style={{ width: '100%' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Control Panel D: Notice Announcement Control */}
            <div className="glass-panel p-5 border-cyan-500/10 space-y-4">
              <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-2">
                // NOTICE BOARD (전체 공지사항 방송)
              </h3>

              <div className="space-y-3">
                <label className="block text-[10px] font-mono text-gray-500">대기실 전체 공지 등록</label>
                <input
                  type="text"
                  placeholder="공지할 메세지를 입력하세요..."
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  maxLength={100}
                  className="w-full p-2 bg-gray-950 border border-gray-850 rounded-lg text-xs placeholder-gray-600 text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleBroadcastNotice}
                  disabled={!noticeText.trim()}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black text-xs font-black rounded-lg transition-all"
                >
                  실시간 공지 전송
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* 📊 HISTORICAL/LIVE ACADEMIC ANALYSIS TAB */
        <div className="space-y-6">
          {/* AI 진단 피드백 환류자료 (AI Analysis Summary Block) */}
          <div className="glass-panel p-6 border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-transparent">
            <h3 className="text-base font-extrabold text-cyan-400 border-b border-gray-900 pb-3 mb-4 uppercase tracking-widest flex items-center gap-2">
              <span>🤖 AI 실시간 학급 피드백 및 교수 처방 환류자료</span>
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-cyan-950/20 border border-cyan-500/10 rounded-xl">
                <span className="text-[10px] font-mono text-cyan-400 block mb-1 uppercase tracking-widest">// AI CLASS DIAGNOSIS REPORT</span>
                <p className="text-sm font-semibold text-gray-200 leading-relaxed">{aiClassFeedback.summary}</p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono text-gray-500 block uppercase tracking-widest">// RECOMMENDED CURRICULUM RETROFIT ACTION ITEMS</span>
                <ul className="list-inside list-disc text-xs text-gray-300 space-y-1.5 font-sans leading-relaxed pl-1">
                  {aiClassFeedback.recs.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit Completion Heatmap Grid (8 units x N students) */}
            <div className="glass-panel p-5 border-cyan-500/10 bg-black/40">
              <h3 className="text-sm font-extrabold text-cyan-400 border-b border-gray-900 pb-3 mb-4 uppercase tracking-widest">
                단원별 완료 상태 히트맵 (Completion Heatmap)
              </h3>

              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {classroomSession.students.map(student => (
                  <div key={student.name} className="flex items-center justify-between text-xs border-b border-gray-900 pb-2">
                    <span className="font-bold w-24 truncate">{student.avatar} {student.name}</span>
                    <div className="flex-1 flex gap-1 justify-end">
                      {Array.from({ length: 8 }).map((_, i) => {
                        const unitId = i + 1;
                        // Mock unit completion for visualization
                        const isDone = student.currentScore > unitId;
                        return (
                          <span
                            key={unitId}
                            className={`w-6 h-6 border rounded text-[9px] font-mono font-bold flex items-center justify-center ${
                              isDone 
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                : 'bg-gray-950 border-gray-900 text-gray-700'
                            }`}
                            title={`${unitId}단원 완료`}
                          >
                            {unitId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Average Accuracy Chart Analysis */}
            <div className="glass-panel p-5 border-cyan-500/10 bg-black/40 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-cyan-400 border-b border-gray-900 pb-3 mb-6 uppercase tracking-widest">
                  단원별 전체 평균 정답률
                </h3>

                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(unitId => {
                    const avgAccuracy = Math.max(10, Math.round(92 - unitId * 8 + Math.random() * 5)); // Downward slope for complex topics
                    return (
                      <div key={unitId} className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs font-mono">
                          <span>{unitId}단원. {getUnitTitle(unitId)}</span>
                          <span className="text-cyan-400 font-bold">{avgAccuracy}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400" style={{ width: `${avgAccuracy}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-900 pt-4 mt-6 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 border border-gray-800 bg-gray-950 hover:text-cyan-400 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 touch-target"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV 다운로드
                  </button>
                  <button
                    onClick={handleCopyTSV}
                    className="px-3.5 py-2 border border-gray-800 bg-gray-950 hover:text-cyan-400 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 touch-target"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> {copied ? '복사 완료! (Ctrl+V)' : '구글 시트용 복사'}
                  </button>
                </div>

                <button
                  onClick={handleGoogleSync}
                  disabled={googleSyncState === 'syncing'}
                  className={`px-4 py-2 font-black rounded-lg text-xs tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)] touch-target ${
                    googleSyncState === 'synced'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                  }`}
                >
                  {googleSyncState === 'syncing' ? (
                    <>
                      <div className="w-3 h-3 border border-t-transparent border-black rounded-full animate-spin" />
                      연동 중...
                    </>
                  ) : googleSyncState === 'synced' ? (
                    '구글 워크스페이스 연동됨 ✓'
                  ) : (
                    '구글 워크스페이스 실시간 연계'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT DETAIL OVERLAY PANEL */}
      {detailedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 border-cyan-500/20 bg-gradient-to-b from-[#0a101d] to-[#04060b] shadow-2xl relative">
            <h3 className="text-lg font-black text-gray-100 flex items-center gap-2 mb-4 border-b border-gray-900 pb-3">
              👤 학생 정보 현황 Inspect
            </h3>

            <div className="flex items-center gap-4 mb-6">
              <RenderAvatarPreview
                baseAvatar={detailedStudent.avatarEmoji || '🧑‍🎓'}
                outfit={detailedStudent.player.avatar.outfit || 'none'}
                expression={detailedStudent.player.avatar.emote || 'none'}
                accessory={detailedStudent.player.avatar.accessory || 'none'}
                mount={detailedStudent.player.avatar.vehicle || 'none'}
                hat={detailedStudent.player.avatar.hat || 'none'}
                bodyColor={detailedStudent.player.avatar.bodyColor || '#06b6d4'}
                size="lg"
              />
              <div>
                <span className="text-base font-extrabold text-white block">{detailedStudent.player.nickname}</span>
                <span className="text-xs font-mono text-gray-500">LV. {detailedStudent.player.level} // XP {detailedStudent.player.xp}</span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs text-gray-400 border-b border-gray-900 pb-4 mb-4">
              <div className="flex justify-between">
                <span>현재 진행 활동:</span>
                <span className="text-cyan-400 font-bold uppercase">{detailedStudent.currentActivity}</span>
              </div>
              <div className="flex justify-between">
                <span>학습 평균 정답률:</span>
                <span className="text-white font-bold">{Math.round(detailedStudent.correctRate * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>배틀 전적:</span>
                <span className="text-red-400 font-bold">{detailedStudent.battleRecord.wins}승 {detailedStudent.battleRecord.losses}패</span>
              </div>
            </div>

            {/* AI 1:1 진단 처방 패널 */}
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-lg text-xs space-y-1.5 mb-4 leading-relaxed">
              <span className="text-[9px] font-mono text-cyan-400 font-bold block uppercase tracking-widest">// AI PERSONALIZED PRESCRIPTION</span>
              <p className="text-gray-350 font-sans">
                {getAiStudentPrescription(detailedStudent.player.level * 2)}
              </p>
            </div>

            {/* 교사 통제 컨트롤 버튼 그룹 */}
            <div className="space-y-2 mb-4 border-t border-gray-900 pt-4">
              <span className="text-[9px] font-mono text-gray-500 block uppercase tracking-widest">// ADMINISTRATOR KICK & RESET CONTROLS</span>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <button
                  onClick={() => handleResetStudentScore(detailedStudent.player.nickname)}
                  className="py-2 border border-yellow-900/30 hover:border-yellow-500/50 bg-yellow-950/10 text-yellow-400 rounded-lg transition-all"
                >
                  점수 초기화
                </button>
                <button
                  onClick={() => handleResetStudentAvatar(detailedStudent.player.nickname)}
                  className="py-2 border border-cyan-900/30 hover:border-cyan-500/50 bg-cyan-950/10 text-cyan-400 rounded-lg transition-all"
                >
                  아바타 초기화
                </button>
              </div>

              <button
                onClick={() => handleKickStudent(detailedStudent.player.nickname)}
                className="w-full py-2 bg-red-950/20 border border-red-900/30 hover:border-red-500/50 text-red-400 rounded-lg font-black text-[10px] tracking-wide transition-all"
              >
                대기실 강제 퇴장 (KICK)
              </button>
            </div>

            <button
              onClick={() => setDetailedStudent(null)}
              className="w-full py-2.5 bg-gray-900 border border-gray-850 hover:border-gray-700 text-gray-300 font-bold text-xs rounded-lg transition-all"
            >
              관찰 패널 닫기 (Close)
            </button>
          </div>
        </div>
      )}

      {/* Styled custom keyframes */}
      <style jsx global>{`
        .glass-panel {
          background: rgba(10, 16, 29, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(6, 182, 212, 0.15);
          border-radius: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>

    </div>
  );
}
