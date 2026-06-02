'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { gameAudio } from '../../../lib/audio';
import { ClassroomSession, StudentResponse, DashboardEvent, PlayerDashboardEntry } from '../../../types';
import { getUnitTitle, SIMULATED_CLASSMATES } from '../../../data/questions';
import { Users, Moon, Sun, Trophy } from 'lucide-react';
import { supabase, IS_OFFLINE_MODE } from '../../../lib/supabase/client';
import { RenderAvatarPreview } from '../../AvatarCustomizer';
import StudentGrid from './StudentGrid';
import ActivityFeed from './ActivityFeed';
import ControlPanels from './ControlPanels';
import StatsPanel from './StatsPanel';
import RubricPanel from './RubricPanel';

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

function getAiStudentPrescription(score: number): string {
  if (score >= 8) return '🏆 우수 대원 처방: 기본 지식이 탄탄해 대기실 도감 수집과 펫 동행으로 이미 동기가 고양되어 있습니다. 급우들의 1:1 대전 상대 혹은 멘토로 임명해 학급 참여 흥미를 주도하게 권유하세요.';
  if (score >= 5) return '📖 보통 대원 처방: 학습 흐름을 이해하나 콤보 누적이 잦고 지엽적 정의(산성/염기성 비교 등)를 혼동합니다. 퀴즈 오답 문항 복습 및 도감 상세 설명 란의 힌트 읽기를 가이드해 주세요.';
  return '🚨 집중 관리 대원 처방: 문항 추론 및 읽기 이해가 현저히 늦어 배틀 경기에서 연패할 리스크가 큽니다. 메타버스 솔로 연습 퀴즈 모드로 이전 완료 단원을 1회 더 안전하게 재풀이하도록 밀착 조치해 주세요.';
}

export default function TeacherDashboard({
  sessionCode,
  classroomSession,
  setClassroomSession,
  onBack,
  theme,
  toggleTheme,
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'control' | 'stats' | 'rubric'>('control');
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [detailedStudent, setDetailedStudent] = useState<PlayerDashboardEntry | null>(null);
  const [feedEvents, setFeedEvents] = useState<DashboardEvent[]>([]);
  const [lastDbUpdate, setLastDbUpdate] = useState<string>('방금 전');
  const [googleSyncState, setGoogleSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [copied, setCopied] = useState<boolean>(false);

  const sessionRef = useRef(classroomSession);
  useEffect(() => { sessionRef.current = classroomSession; }, [classroomSession]);

  const aiClassFeedback = useMemo(() => {
    if (!classroomSession || classroomSession.students.length === 0) {
      return {
        summary: '충분한 학습 데이터가 수집되지 않았습니다. 학생들이 대기실에 진입하고 퀴즈 풀이를 가동하면 실시간 AI 진단이 활성화됩니다.',
        recs: ['퀴즈 제어판에서 퀴즈 세션을 열어 학생들의 문제 풀이 성적을 유도하십시오.', 'PvP 1:1 대전이나 협동 레이드를 활성화하여 학급 참여율을 제고하십시오.'],
        lowestUnit: classroomSession?.activeUnitId || 1,
      };
    }
    const students = classroomSession.students;
    const avgScore = students.reduce((acc, s) => acc + s.currentScore, 0) / students.length;
    const lowestUnit = classroomSession.activeUnitId;
    if (avgScore >= 8) {
      return { summary: '🎉 [종합 진단] 학급 전반의 과학 단원 개념 이해도가 최고 등급 수준으로 무척 높습니다.', recs: ['1:1 대전 모드를 가동하여 자율적인 배틀 매칭에 참여하도록 독려하세요.', '학급 내 포켓몬 모둠별 과학 토론 및 조별 탐구 보고서 환류 지도를 처방합니다.'], lowestUnit };
    }
    if (avgScore >= 5) {
      return { summary: '📈 [종합 진단] 전반적으로 보통 수준의 성취도를 보이나, 특정 취약 개념의 정답 쏠림이 보입니다.', recs: [`현재 개설된 ${lowestUnit}단원 주요 퀴즈 단어를 2회독 이상 복습하게 안내해 주세요.`, '시각 보조 학습을 5분간 병행하면 보완에 탁월합니다.'], lowestUnit };
    }
    return { summary: '⚠️ [종합 진단] 단원 평균 성적이 지체되어 있어 기초 보강 및 밀착 피드백이 요망됩니다.', recs: ['퀴즈 타이머를 조정하여 문제를 풀 충분한 시간을 보장하십시오.', '보스 레이드를 소환해 협동 데미지로 과학 거부감을 줄이십시오.'], lowestUnit };
  }, [classroomSession]);

  // Supabase: Live activity feed
  useEffect(() => {
    if (!sessionCode) return;
    const eventChannel = supabase.channel(`dashboard_events_${sessionCode}`);
    eventChannel
      .on('broadcast', { event: 'dashboard_log' }, ({ payload }: { payload: { type: DashboardEvent['type']; playerId?: string; nickname?: string; detail?: string; isCorrect?: boolean } }) => {
        const newEvent: DashboardEvent = {
          type: payload.type,
          playerId: payload.playerId || 'unknown',
          nickname: payload.nickname || '익명',
          detail: payload.detail || '',
          timestamp: new Date().toISOString(),
          isCorrect: payload.isCorrect,
        };
        setFeedEvents(prev => [...prev.slice(-49), newEvent]);
      })
      .subscribe();
    setFeedEvents([
      { type: 'battle_end', playerId: '1', nickname: '김민준', detail: '배틀에서 승리하여 🏆 골드 크라운 왕관을 얻었습니다!', timestamp: new Date(Date.now() - 60000).toISOString() },
      { type: 'card_unlocked', playerId: '2', nickname: '이서연', detail: '희귀 카드 [암모나이트]를 포획하는 데 성공했습니다!', timestamp: new Date(Date.now() - 45000).toISOString() },
    ]);
    return () => { eventChannel.unsubscribe(); };
  }, [sessionCode]);

  // Supabase: Presence for live students
  useEffect(() => {
    if (!sessionCode) return;
    const presenceChannel = supabase.channel(`classroom_lobby_${sessionCode}`);
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const liveStudents: ClassroomSession['students'] = [];
        Object.keys(state).forEach(key => {
          const presences = state[key] as { name?: string; avatar?: string; isSimulated?: boolean; currentScore?: number; currentStreak?: number; answeredCurrentQuestion?: boolean; x?: number; y?: number; equippedCosmetics?: { outfit: string; expression: string; accessory: string; mount: string }; cp?: number }[];
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
                cp: p.cp || 0,
              });
            }
          });
        });
        if (liveStudents.length > 0 && classroomSession) {
          const existingMap = new Map(classroomSession.students.map(s => [s.name, s]));
          const mergedStudents = liveStudents.map(live => {
            const existing = existingMap.get(live.name);
            return existing ? { ...existing, x: live.x, y: live.y, equippedCosmetics: live.equippedCosmetics, cp: live.cp || existing.cp || 0 } : live;
          });
          const currentNames = classroomSession.students.map(s => s.name).sort().join(',');
          const mergedNames = mergedStudents.map(s => s.name).sort().join(',');
          if (currentNames !== mergedNames) {
            setClassroomSession({ ...classroomSession, students: mergedStudents });
          }
        }
      })
      .subscribe();
    return () => { presenceChannel.unsubscribe(); };
  }, [sessionCode, classroomSession]);

  // DB polling every 10s
  useEffect(() => {
    if (!sessionCode) return;
    const fetchSessionData = async () => {
      try {
        const { data: dbPlayers, error: playersError } = await supabase.from('players').select('*').eq('session_code', sessionCode);
        if (playersError || !dbPlayers) return;
        const { data: dbAnswers } = await supabase.from('quiz_answers').select('*').eq('session_code', sessionCode);
        const currentSession = sessionRef.current;
        if (!currentSession) return;
        const activeUnitId = currentSession.activeUnitId;
        type DbPlayer = { id: string; nickname: string; avatar?: { gender?: string; outfit?: string; expression?: string; accessory?: string; vehicle?: string }; position?: { x?: number; y?: number }; xp?: number };
        type DbAnswer = { player_id: string; unit_id: number; is_correct: boolean; id: number };
        const updatedRealStudents = (dbPlayers as DbPlayer[]).map(p => {
          const playerAnswers = ((dbAnswers || []) as DbAnswer[]).filter(a => a.player_id === p.id && a.unit_id === activeUnitId);
          const correctAnswers = playerAnswers.filter(a => a.is_correct);
          const sortedAnswers = [...playerAnswers].sort((a, b) => a.id - b.id);
          let currentStreak = 0;
          for (let i = sortedAnswers.length - 1; i >= 0; i--) {
            if (sortedAnswers[i].is_correct) currentStreak++;
            else break;
          }
          const existingStudent = currentSession.students.find(s => s.name === p.nickname);
          return {
            name: p.nickname,
            avatar: existingStudent?.avatar || (p.avatar?.gender === 'female' ? '👧' : '👦'),
            isSimulated: false,
            currentScore: correctAnswers.length,
            currentStreak,
            answeredCurrentQuestion: playerAnswers.length > 0,
            lastAnswerCorrect: sortedAnswers[sortedAnswers.length - 1]?.is_correct,
            x: existingStudent?.x || p.position?.x || 20,
            y: existingStudent?.y || p.position?.y || 15,
            equippedCosmetics: { outfit: p.avatar?.outfit || 'none', expression: p.avatar?.expression || 'none', accessory: p.avatar?.accessory || 'none', mount: p.avatar?.vehicle || 'none' },
            cp: p.xp || 0,
          };
        });
        const simulatedStudents = currentSession.students.filter(s => s.isSimulated);
        const mergedStudents: ClassroomSession['students'] = updatedRealStudents as ClassroomSession['students'];
        simulatedStudents.forEach(sim => { if (!mergedStudents.some(s => s.name === sim.name)) mergedStudents.push(sim); });
        setClassroomSession({ ...currentSession, students: mergedStudents });
        setLastDbUpdate(new Date().toLocaleTimeString('ko-KR'));
      } catch (e) {
        console.error('Failed to sync student activity records:', e);
      }
    };
    fetchSessionData();
    const intervalId = setInterval(fetchSessionData, 10000);
    return () => clearInterval(intervalId);
  }, [sessionCode]);

  // AI 봇 자동 응답 시뮬레이션 — 퀴즈 진행 중 800ms마다 일부 봇이 답변
  useEffect(() => {
    if (classroomSession?.status !== 'playing') return;
    if (!classroomSession.students.some(s => s.isSimulated && !s.answeredCurrentQuestion)) return;

    const timer = setInterval(() => {
      const current = sessionRef.current;
      if (!current || current.status !== 'playing') return;
      const hasPending = current.students.some(s => s.isSimulated && !s.answeredCurrentQuestion);
      if (!hasPending) { clearInterval(timer); return; }

      const updated = current.students.map(s => {
        if (!s.isSimulated || s.answeredCurrentQuestion) return s;
        if (Math.random() > 0.45) return s; // ~55% 확률로 이번 틱에 응답
        const correct = Math.random() < 0.75;
        return {
          ...s,
          answeredCurrentQuestion: true,
          lastAnswerCorrect: correct,
          currentScore: s.currentScore + (correct ? 1 : 0),
          currentStreak: correct ? s.currentStreak + 1 : 0,
        };
      });
      setClassroomSession({ ...current, students: updated });
    }, 800);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomSession?.status, classroomSession?.currentQuestionIndex]);

  const handleStartLobby = async () => {
    gameAudio.playClick();
    // 6자리 영문+숫자 세션 코드 생성
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Supabase game_sessions 테이블에 세션 등록 (오프라인이면 무시됨)
    await supabase.from('game_sessions').insert({
      code,
      status: 'lobby',
      active_unit_id: selectedUnitId,
    });
    setClassroomSession({
      code,
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
        { name: '최윤서', avatar: '👟', isSimulated: true, currentScore: 3, currentStreak: 0, answeredCurrentQuestion: true, lastAnswerCorrect: false, x: 25, y: 15, equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' } },
      ],
    });
  };

  const handleResetStudentScore = (nickname: string) => {
    if (!classroomSession) return;
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, students: classroomSession.students.map(s => s.name === nickname ? { ...s, currentScore: 0, currentStreak: 0, answeredCurrentQuestion: false, lastAnswerCorrect: undefined } : s) });
    setDetailedStudent(prev => prev ? { ...prev, correctRate: 0, player: { ...prev.player, xp: 0, level: 1, coins: 0 } } : null);
  };

  const handleResetStudentAvatar = (nickname: string) => {
    if (!classroomSession) return;
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, students: classroomSession.students.map(s => s.name === nickname ? { ...s, equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' } } : s) });
  };

  const handleKickStudent = (nickname: string) => {
    if (!classroomSession) return;
    gameAudio.playWrong();
    supabase.channel(`dashboard_events_${sessionCode}`).send({ type: 'broadcast', event: 'player_kick', payload: { name: nickname } });
    setClassroomSession({ ...classroomSession, students: classroomSession.students.filter(s => s.name !== nickname) });
    setDetailedStudent(null);
  };

  const handleExportCSV = () => {
    gameAudio.playClick();
    if (!classroomSession || classroomSession.students.length === 0) return;
    const totalAttempted = classroomSession.currentQuestionIndex +
      (classroomSession.students.some(s => s.answeredCurrentQuestion) ? 1 : 0);
    const unitId = classroomSession.activeUnitId;
    const header = '﻿학습원 닉네임,아바타,단원 ID,단원명,정답 점수,정답률(%),최근 콤보 횟수,시뮬레이션 여부\n';
    const rows = classroomSession.students.map(s => {
      const accuracy = totalAttempted > 0
        ? Math.round((s.currentScore / totalAttempted) * 100)
        : 0;
      return `"${s.name}","${s.avatar}","${unitId}","${getUnitTitle(unitId)}","${s.currentScore}","${accuracy}","${s.currentStreak}","${s.isSimulated ? 'Y' : 'N'}"`;
    });
    const csv = header + rows.join('\n') + '\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `과학_메타버스_세션_${sessionCode}_결과.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTSV = () => {
    gameAudio.playClick();
    if (!classroomSession || classroomSession.students.length === 0) return;
    const totalAttempted = classroomSession.currentQuestionIndex +
      (classroomSession.students.some(s => s.answeredCurrentQuestion) ? 1 : 0);
    const unitId = classroomSession.activeUnitId;
    let tsv = `학습원 닉네임\t단원\t정답 점수\t정답률(%)\t최근 콤보 횟수\n`;
    classroomSession.students.forEach(s => {
      const accuracy = totalAttempted > 0
        ? Math.round((s.currentScore / totalAttempted) * 100)
        : 0;
      tsv += `${s.name}\t${unitId}단원\t${s.currentScore}\t${accuracy}\t${s.currentStreak}\n`;
    });
    navigator.clipboard.writeText(tsv).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleGoogleSync = () => {
    if (googleSyncState === 'syncing') return;
    gameAudio.playClick();
    setGoogleSyncState('syncing');
    setTimeout(() => {
      gameAudio.playCorrect();
      setGoogleSyncState('synced');
      setFeedEvents(prev => [...prev.slice(-49), { type: 'achievement', playerId: 'system', nickname: '구글연계', detail: '학급 실시간 평가 데이터가 Google Workspace에 동기화되었습니다.', timestamp: new Date().toISOString() }]);
    }, 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6 font-sans text-gray-100">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-cyan-500/10 pb-4 gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-500 tracking-widest block uppercase">// SCIENCE MASTER METAVERSE DASHBOARD</span>
          <h1 className="text-2xl font-black tracking-wide text-cyan-400 flex items-center gap-2">
            참여 코드: <span className="text-white select-all font-mono font-black">{sessionCode}</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {IS_OFFLINE_MODE && (
            <span className="px-2.5 py-1.5 bg-amber-950/50 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold rounded-lg">
              🔌 OFFLINE MODE
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 border border-gray-850 rounded-lg text-xs font-mono">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>접속 대원: {classroomSession?.students.length || 0}명</span>
          </div>
          <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-black uppercase ${
            classroomSession?.status === 'playing' ? 'border-blue-500 bg-blue-950/20 text-blue-400 animate-pulse'
            : (classroomSession?.status as string) === 'raid' ? 'border-orange-500 bg-orange-950/20 text-orange-400 animate-pulse'
            : classroomSession?.status === 'ended' ? 'border-red-500 bg-red-950/20 text-red-400'
            : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400'
          }`}>
            상태: {classroomSession ? (classroomSession.status === 'playing' ? '퀴즈 풀이 중' : (classroomSession.status as string) === 'raid' ? '레이드 진행 중' : classroomSession.status.toUpperCase()) : 'OFFLINE'}
          </div>
          {toggleTheme && (
            <button onClick={toggleTheme} className="w-11 h-11 border border-gray-800 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-cyan-400 rounded-lg flex items-center justify-center transition-all">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          )}
          <button onClick={onBack} className="px-4 py-2 border border-gray-800 bg-gray-950 hover:text-cyan-400 rounded-lg text-xs font-bold font-mono transition-all">
            뒤로가기
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      {classroomSession && (
        <div className="flex border-b border-gray-900 pb-2 gap-4">
          {(['control', 'stats', 'rubric'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { gameAudio.playClick(); setActiveTab(tab); }}
              className={`px-4 py-1.5 text-xs font-bold border-b-2 transition-all ${activeTab === tab ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {tab === 'control' ? '🎮 실시간 세션 제어판' : tab === 'stats' ? '📊 학급 학습 통계 분석' : '📋 단원 루브릭'}
            </button>
          ))}
        </div>
      )}

      {!classroomSession ? (
        /* Setup View */
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
            <button onClick={handleStartLobby} className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-black rounded-lg transition-all mt-6">
              대기실 로비 개설 개시
            </button>
          </div>
        </div>
      ) : activeTab === 'control' ? (
        /* Control Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <StudentGrid classroomSession={classroomSession} sessionCode={sessionCode} lastDbUpdate={lastDbUpdate} setDetailedStudent={setDetailedStudent} />
          <ActivityFeed feedEvents={feedEvents} setFeedEvents={setFeedEvents} />
          <ControlPanels classroomSession={classroomSession} setClassroomSession={setClassroomSession} selectedUnitId={selectedUnitId} setSelectedUnitId={setSelectedUnitId} sessionCode={sessionCode} setFeedEvents={setFeedEvents} />
        </div>
      ) : activeTab === 'stats' ? (
        /* Stats Tab */
        <StatsPanel classroomSession={classroomSession} aiClassFeedback={aiClassFeedback} onExportCSV={handleExportCSV} onCopyTSV={handleCopyTSV} onGoogleSync={handleGoogleSync} googleSyncState={googleSyncState} copied={copied} />
      ) : (
        /* Rubric Tab */
        <div className="max-w-xl">
          <RubricPanel activeUnitId={classroomSession.activeUnitId} />
        </div>
      )}

      {/* Student Detail Overlay */}
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
              <div className="flex justify-between"><span>현재 진행 활동:</span><span className="text-cyan-400 font-bold uppercase">{detailedStudent.currentActivity}</span></div>
              <div className="flex justify-between"><span>학습 평균 정답률:</span><span className="text-white font-bold">{Math.round(detailedStudent.correctRate * 100)}%</span></div>
              <div className="flex justify-between"><span>배틀 전적:</span><span className="text-red-400 font-bold">{detailedStudent.battleRecord.wins}승 {detailedStudent.battleRecord.losses}패</span></div>
            </div>
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-lg text-xs space-y-1.5 mb-4 leading-relaxed">
              <span className="text-[9px] font-mono text-cyan-400 font-bold block uppercase tracking-widest">// AI PERSONALIZED PRESCRIPTION</span>
              <p className="text-gray-350 font-sans">{getAiStudentPrescription(detailedStudent.player.level * 2)}</p>
            </div>
            <div className="space-y-2 mb-4 border-t border-gray-900 pt-4">
              <span className="text-[9px] font-mono text-gray-500 block uppercase tracking-widest">// ADMINISTRATOR KICK & RESET CONTROLS</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <button onClick={() => handleResetStudentScore(detailedStudent.player.nickname)} className="py-2 border border-yellow-900/30 hover:border-yellow-500/50 bg-yellow-950/10 text-yellow-400 rounded-lg transition-all">점수 초기화</button>
                <button onClick={() => handleResetStudentAvatar(detailedStudent.player.nickname)} className="py-2 border border-cyan-900/30 hover:border-cyan-500/50 bg-cyan-950/10 text-cyan-400 rounded-lg transition-all">아바타 초기화</button>
              </div>
              <button onClick={() => handleKickStudent(detailedStudent.player.nickname)} className="w-full py-2 bg-red-950/20 border border-red-900/30 hover:border-red-500/50 text-red-400 rounded-lg font-black text-[10px] tracking-wide transition-all">
                대기실 강제 퇴장 (KICK)
              </button>
            </div>
            <button onClick={() => setDetailedStudent(null)} className="w-full py-2.5 bg-gray-900 border border-gray-850 hover:border-gray-700 text-gray-300 font-bold text-xs rounded-lg transition-all">
              관찰 패널 닫기 (Close)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
