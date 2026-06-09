'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '../design-system';
import { gameAudio } from '../../../lib/audio';
import { ClassroomSession, DashboardEvent, TournamentMatch, TournamentBracket } from '../../../types';
import TournamentBracketView from '../TournamentBracketView';
import AnswerDistributionPanel from './AnswerDistributionPanel';
import { getUnitTitle, getUnitQuestions } from '../../../data/questions';
import { questions } from '../../../data/questions';
import { selectQuestions, hasActiveFilter, QuestionFilter } from '../../../lib/question-pool';
import { cards } from '../../../data/cards';
import { supabase } from '../../../lib/supabase-client';

// AI 봇 스폰용 이름·아바타 풀 (60명 지원)
const BOT_NAMES = [
  '김지우','이민준','박서아','최하준','정서윤','강도윤','조아윤','윤하은','장시우','한지아',
  '임주원','오예준','서유나','신건우','권다은','배민서','황지호','안수연','류하은','고준서',
  '문지원','차예린','유정원','나도현','엄하늘','성민재','홍수아','전준혁','남지윤','심이준',
  '곽도원','변서윤','노하린','탁민준','위지유','편수민','채하윤','진서우','국민서','봉지아',
  '경하준','선예빈','태수아','사이준','아지민','파도윤','마하은','라준서','다이서','가민준',
  '나예슬','다하늘','라민재','마서준','바지아','사예준','아민서','자이준','차하은','타준혁',
];
const BOT_AVATARS = [
  '⚡','🔥','🌱','💧','🦖','⭐','🛸','🔬','🌋','🧬',
  '🎯','🚀','🌈','🔭','🧩','🎮','🦋','🐉','🌊','🧊',
  '🎸','🏆','🎭','🌟','🦄','🐬','🦊','🐼','🦁','🐯',
];

interface ControlPanelsProps {
  classroomSession: ClassroomSession;
  setClassroomSession: (session: ClassroomSession | null) => void;
  selectedUnitId: number;
  setSelectedUnitId: (id: number) => void;
  sessionCode: string;
  setFeedEvents: React.Dispatch<React.SetStateAction<DashboardEvent[]>>;
  activeFilter?: QuestionFilter;
}

export default function ControlPanels({
  classroomSession,
  setClassroomSession,
  selectedUnitId,
  setSelectedUnitId,
  sessionCode,
  setFeedEvents,
  activeFilter = {},
}: ControlPanelsProps) {
  const [draggedStudentName, setDraggedStudentName] = useState<string | null>(null);
  const [selectedStudentForPairing, setSelectedStudentForPairing] = useState<string | null>(null);
  const [noticeText, setNoticeText] = useState('');

  const unpairedStudents = useMemo(() => {
    const pairedNames = new Set<string>();
    classroomSession.activeBattles?.forEach(b => {
      pairedNames.add(b.player1);
      pairedNames.add(b.player2);
    });
    return classroomSession.students.filter(s => !pairedNames.has(s.name));
  }, [classroomSession]);

  const handleStartQuiz = () => {
    gameAudio.playClick();
    // B-4/D2: 성취기준 필터가 활성화된 경우 selectQuestions를 사용해
    // 필터 조건에 맞는 문항으로 questionIds를 구성한다.
    // 필터가 없으면 기존 단원 기반 셔플 경로를 유지한다.
    let questionIds: string[];
    if (hasActiveFilter(activeFilter)) {
      const result = selectQuestions({
        ...activeFilter,
        count: 10,
      });
      questionIds = result.questions.map(q => q.id);
    } else {
      const pool = getUnitQuestions(classroomSession.activeUnitId);
      questionIds = [...pool]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map(q => q.id);
    }
    setClassroomSession({
      ...classroomSession,
      status: 'playing',
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      questionIds,
    });
  };

  const handleStopQuiz = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, status: 'lobby' });
  };

  const handleStartRaid = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, status: 'raid' as ClassroomSession['status'] });
  };

  const handleStopRaid = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, status: 'lobby' });
  };

  const handleStartRaidScaled = () => {
    gameAudio.playClick();
    const N = classroomSession.students.length || 1;
    const raidBossMaxHp = Math.max(500, N * 150);
    setClassroomSession({ ...classroomSession, status: 'raid' as ClassroomSession['status'], raidBossMaxHp });
  };

  const handleStartTournament = () => {
    gameAudio.playClick();
    const names = classroomSession.students.map(s => s.name);
    if (names.length < 2) return;
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const matches: TournamentMatch[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      matches.push({ p1: shuffled[i], p2: shuffled[i + 1], winner: null, status: 'pending' });
    }
    if (shuffled.length % 2 === 1) {
      const last = shuffled[shuffled.length - 1];
      matches.push({ p1: last, p2: 'BYE', winner: last, status: 'done' });
    }
    const bracket: TournamentBracket = {
      rounds: [{ matches }],
      currentRoundIdx: 0,
      champion: null,
    };
    setClassroomSession({ ...classroomSession, status: 'tournament', tournament: bracket });
  };

  const handleStopTournament = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, status: 'lobby', tournament: undefined });
  };

  const handleToggleTimeAttack = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, timeAttackMode: !classroomSession.timeAttackMode });
  };

  const handleAdvanceTournament = (roundIdx: number, matchIdx: number, winner: string) => {
    if (!classroomSession.tournament) return;
    gameAudio.playClick();
    const bracket = classroomSession.tournament;
    const updatedRounds = bracket.rounds.map((r, ri) =>
      ri !== roundIdx ? r : {
        matches: r.matches.map((m, mi) =>
          mi !== matchIdx ? m : { ...m, winner, status: 'done' as const }
        )
      }
    );
    const currentRound = updatedRounds[roundIdx];
    const allDone = currentRound.matches.every(m => m.status === 'done');

    if (allDone) {
      const winners = currentRound.matches
        .map(m => m.winner)
        .filter((w): w is string => w !== null && w !== 'BYE');
      if (winners.length === 1) {
        setClassroomSession({
          ...classroomSession,
          tournament: { ...bracket, rounds: updatedRounds, champion: winners[0] },
        });
      } else {
        const nextMatches: TournamentMatch[] = [];
        for (let i = 0; i < winners.length - 1; i += 2) {
          nextMatches.push({ p1: winners[i], p2: winners[i + 1], winner: null, status: 'pending' });
        }
        if (winners.length % 2 === 1) {
          const last = winners[winners.length - 1];
          nextMatches.push({ p1: last, p2: 'BYE', winner: last, status: 'done' });
        }
        setClassroomSession({
          ...classroomSession,
          tournament: {
            rounds: [...updatedRounds, { matches: nextMatches }],
            currentRoundIdx: roundIdx + 1,
            champion: null,
          },
        });
      }
    } else {
      setClassroomSession({ ...classroomSession, tournament: { ...bracket, rounds: updatedRounds } });
    }
  };

  const handleToggleBattleMode = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, battleMode: !classroomSession.battleMode });
  };

  const handleSpawnAIStudents = (count: number) => {
    gameAudio.playClick();
    const existingNames = new Set(classroomSession.students.map(s => s.name));
    const newStudents: ClassroomSession['students'] = [];
    for (let i = 0; i < BOT_NAMES.length && newStudents.length < count; i++) {
      const name = BOT_NAMES[i];
      if (existingNames.has(name)) continue;
      newStudents.push({
        name,
        avatar: BOT_AVATARS[i % BOT_AVATARS.length],
        isSimulated: true,
        currentScore: 0,
        currentStreak: 0,
        answeredCurrentQuestion: false,
        x: 10 + Math.floor(i / 8) * 7,
        y: 10 + (i % 8) * 4,
        equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' },
      });
    }
    if (newStudents.length === 0) return;
    setClassroomSession({ ...classroomSession, students: [...classroomSession.students, ...newStudents] });
  };

  const handleClearAIStudents = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, students: classroomSession.students.filter(s => !s.isSimulated) });
  };

  const handleDragStart = (e: React.DragEvent, name: string) => {
    setDraggedStudentName(name);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnStudent = (targetName: string) => {
    if (!draggedStudentName || draggedStudentName === targetName) return;
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
      p2Answered: false,
    };
    setClassroomSession({ ...classroomSession, activeBattles: [...(classroomSession.activeBattles || []), newBattle] });
    setDraggedStudentName(null);
    gameAudio.playClick();
  };

  const handleSelectStudentForPairing = (name: string) => {
    if (!selectedStudentForPairing) {
      setSelectedStudentForPairing(name);
      gameAudio.playClick();
    } else {
      if (selectedStudentForPairing === name) { setSelectedStudentForPairing(null); return; }
      const newBattle = {
        battleId: `battle_${Date.now()}_${selectedStudentForPairing}_vs_${name}`,
        player1: selectedStudentForPairing,
        player2: name,
        p1CardId: cards[0].id,
        p2CardId: cards[1].id,
        p1Hp: 100,
        p2Hp: 100,
        status: 'fighting' as const,
        currentQuestionId: questions[0].id,
        p1Answered: false,
        p2Answered: false,
      };
      setClassroomSession({ ...classroomSession, activeBattles: [...(classroomSession.activeBattles || []), newBattle] });
      setSelectedStudentForPairing(null);
      gameAudio.playClick();
    }
  };

  const handleAutoMatch = () => {
    if (unpairedStudents.length < 2) return;
    gameAudio.playClick();
    const shuffled = [...unpairedStudents].sort(() => Math.random() - 0.5);
    const newPairs: NonNullable<ClassroomSession['activeBattles']> = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newPairs.push({
        battleId: `battle_${Date.now()}_${shuffled[i].name}_vs_${shuffled[i+1].name}`,
        player1: shuffled[i].name,
        player2: shuffled[i+1].name,
        p1CardId: cards[0].id,
        p2CardId: cards[1].id,
        p1Hp: 100,
        p2Hp: 100,
        status: 'fighting' as const,
        currentQuestionId: questions[Math.floor(Math.random() * questions.length)].id,
        p1Answered: false,
        p2Answered: false,
      });
    }
    setClassroomSession({ ...classroomSession, activeBattles: [...(classroomSession.activeBattles || []), ...newPairs] });
  };

  const handleBroadcastNotice = () => {
    if (!noticeText.trim()) return;
    gameAudio.playClick();
    const channel = supabase.channel(`dashboard_events_${sessionCode}`);
    channel.send({ type: 'broadcast', event: 'teacher_notice', payload: { text: noticeText.trim() } });
    setFeedEvents(prev => [...prev.slice(-49), {
      type: 'achievement',
      playerId: 'system',
      nickname: '공지사항',
      detail: `[전체 방송 공지]: "${noticeText.trim()}"`,
      timestamp: new Date().toISOString(),
    }]);
    setNoticeText('');
  };

  return (
    <div className="lg:col-span-3 space-y-6">
      {/* Quiz Control */}
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
                      const settings = { timer: true, timerSeconds: sec, battleModeEnabled: false, raidEnabled: false, allowChat: true, ...(classroomSession.settings ?? {}) };
                      setClassroomSession({ ...classroomSession, settings: { ...settings, timerSeconds: sec } });
                      supabase.channel(`dashboard_events_${sessionCode}`).send({ type: 'broadcast', event: 'settings_update', payload: { timerSeconds: sec } });
                    }}
                    className={`py-1 text-[10px] font-bold rounded border transition-all ${
                      isActive ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-gray-950 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}
            </div>
          </div>
          {classroomSession.status === 'playing' ? (
            <Button variant="danger" size="lg" onClick={handleStopQuiz} className="w-full">퀴즈 종료 (Close Quiz)</Button>
          ) : (
            <Button variant="primary" size="lg" onClick={handleStartQuiz} className="w-full">퀴즈 개시 (Start Quiz)</Button>
          )}
        </div>
      </div>

      {/* AI Student Spawn */}
      <div className="glass-panel p-5 border-green-500/10 space-y-4">
        <h3 className="text-xs font-mono font-black text-green-400 uppercase tracking-widest border-b border-gray-900 pb-2 flex items-center justify-between">
          <span>// AI CLASSROOM SIMULATOR</span>
          <span className="text-gray-600 font-normal">{classroomSession.students.filter(s => s.isSimulated).length}명 봇</span>
        </h3>
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-gray-500">AI 학생 스폰 (실제 학생 없이 데모 가능)</div>
          <div className="grid grid-cols-3 gap-2">
            {([15, 30, 60] as const).map(count => (
              <button
                key={count}
                onClick={() => handleSpawnAIStudents(count)}
                className="py-2 bg-green-950/30 border border-green-500/30 hover:bg-green-950/50 text-green-300 text-xs font-bold rounded-lg transition-all"
              >
                +{count}명
              </button>
            ))}
          </div>
          {classroomSession.students.some(s => s.isSimulated) && (
            <button
              onClick={handleClearAIStudents}
              className="w-full py-1.5 bg-gray-950 border border-gray-800 hover:border-red-500/40 text-gray-500 hover:text-red-400 text-[10px] font-mono rounded-lg transition-all"
            >
              AI 봇 전체 제거
            </button>
          )}
        </div>
      </div>

      {/* Battle Matchmaking */}
      <div className="glass-panel p-5 border-red-500/10 space-y-4">
        <h3 className="text-xs font-mono font-black text-red-400 uppercase tracking-widest border-b border-gray-900 pb-2">
          // BATTLE MATCHMAKING (배틀 관리)
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleToggleBattleMode}
            className={`w-full py-2 rounded-lg text-xs font-black transition-all ${
              classroomSession.battleMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-900 border border-gray-850 text-gray-400 hover:text-white'
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
                  className="px-2 py-0.5 bg-red-950/20 border border-red-500/30 text-red-400 hover:text-white disabled:opacity-40 text-[9px] font-bold rounded"
                >
                  [자동 매칭]
                </button>
              </div>
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto bg-gray-950/40 p-2 rounded-lg border border-gray-900 text-xs">
                {unpairedStudents.length === 0 ? (
                  <div className="text-center text-gray-650 text-[9px] font-mono py-4">ALL PLAYERS PAIRED</div>
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

      {/* Boss Raid */}
      <div className="glass-panel p-5 border-orange-500/10 space-y-4">
        <h3 className="text-xs font-mono font-black text-orange-400 uppercase tracking-widest border-b border-gray-900 pb-2">
          // BOSS RAID SYSTEM (레이드 제어)
        </h3>
        <div className="space-y-3">
          {(classroomSession.status as string) === 'raid' ? (
            <button onClick={handleStopRaid} className="w-full py-2.5 bg-red-650 hover:bg-red-550 text-white text-xs font-black rounded-lg">
              레이드 비활성화
            </button>
          ) : (
            <button onClick={handleStartRaidScaled} className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-black text-xs font-black rounded-lg">
              보스 레이드 활성화 (HP 자동 계산)
            </button>
          )}
          {((classroomSession.status as string) === 'raid' || classroomSession.settings?.raidEnabled) && (
            <div className="space-y-2 pt-2 border-t border-gray-900">
              <div className="flex justify-between items-baseline text-[10px] font-mono text-gray-500">
                <span>BOSS HP:</span>
                <span className="text-red-500">
                  {classroomSession.raidBossMaxHp ?? Math.max(500, classroomSession.students.length * 150)} HP
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 shadow-[0_0_8px_red]" style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 게임 모드 */}
      <div className="glass-panel p-5 border-purple-500/10 space-y-4">
        <h3 className="text-xs font-mono font-black text-purple-400 uppercase tracking-widest border-b border-gray-900 pb-2">
          // GAME MODES (게임 모드)
        </h3>
        <div className="space-y-3">
          {/* 타임어택 토글 */}
          <button
            onClick={handleToggleTimeAttack}
            className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-colors ${
              classroomSession.timeAttackMode
                ? 'bg-yellow-950/50 border-yellow-500/60 text-yellow-300'
                : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-yellow-500/40 hover:text-yellow-200'
            }`}
          >
            ⚡ 타임어택 {classroomSession.timeAttackMode ? 'ON — 속도 보너스 활성' : 'OFF'}
          </button>
          {/* 토너먼트 */}
          {classroomSession.status === 'tournament' ? (
            <button
              onClick={handleStopTournament}
              className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold bg-red-950/50 border border-red-500/40 text-red-300 hover:bg-red-900/50"
            >
              🏆 토너먼트 종료
            </button>
          ) : (
            <button
              onClick={handleStartTournament}
              disabled={classroomSession.students.length < 2}
              className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold bg-purple-950/50 border border-purple-500/40 text-purple-200 hover:bg-purple-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🏆 토너먼트 시작 ({classroomSession.students.length}명 → 브래킷 생성)
            </button>
          )}
          {/* 브래킷 뷰 */}
          {classroomSession.status === 'tournament' && classroomSession.tournament && (
            <TournamentBracketView
              bracket={classroomSession.tournament}
              isTeacher
              onMatchWinner={handleAdvanceTournament}
            />
          )}
        </div>
      </div>

      {/* Live Answer Distribution — 퀴즈 진행 중에만 표시 */}
      {classroomSession.status === 'playing' && (
        <AnswerDistributionPanel classroomSession={classroomSession} />
      )}

      {/* Notice Board */}
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
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black text-xs font-black rounded-lg transition-all"
          >
            실시간 공지 전송
          </button>
        </div>
      </div>
    </div>
  );
}
