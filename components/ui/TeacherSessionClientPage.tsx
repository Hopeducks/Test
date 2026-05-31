'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useGameState from '../../lib/game-state';
import TeacherDashboard from './TeacherDashboard';
import TeacherPasswordGate from './TeacherPasswordGate';
import { supabase } from '../../lib/supabase-client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { gameAudio } from '../../lib/audio';

interface TeacherSessionClientPageProps {
  code: string;
}

export default function TeacherSessionClientPage({ code }: TeacherSessionClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherKey = searchParams.get('key');
  const { classroomSession, setClassroomSession, classroomStudents, setClassroomStudents } = useGameState();

  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const sessionCode = code.toUpperCase();

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'light' | 'dark';
      if (saved) {
        setTheme(saved);
      }
    }
  }, []);

  const toggleTheme = () => {
    gameAudio.playClick();
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  // Validate session code and teacher key credentials against Supabase / localStorage fallbacks
  useEffect(() => {
    if (!sessionCode) return;

    const verifyCredentials = async () => {
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('code', sessionCode)
          .single();

        if (error || !data) {
          // If session doesn't exist, check local storage mock db
          const mockDataStr = localStorage.getItem('mock_db_game_sessions');
          const mockSessions = mockDataStr ? JSON.parse(mockDataStr) : [];
          const matchedSession = mockSessions.find((s: any) => s.code === sessionCode);

          if (matchedSession) {
            // Verify key matches
            if (matchedSession.teacher_id === teacherKey) {
              setClassroomSession(matchedSession);
              setVerified(true);
            } else {
              setVerified(false);
            }
          } else {
            setVerified(false);
          }
        } else {
          // Verify supabase record
          if (data.teacher_id === teacherKey) {
            // Map table fields to local ClassroomSession format
            setClassroomSession({
              activeUnitId: data.unit_id,
              status: data.status,
              currentQuestionIndex: data.current_question_index,
              dynamicQuestionIds: data.question_ids || [],
              questionStartTime: Number(data.question_start_time),
              battleMode: data.battle_mode,
              activeBattles: data.active_battles || [],
              students: data.students || []
            } as any);
            setVerified(true);
          } else {
            setVerified(false);
          }
        }
      } catch (err) {
        console.error('Verification error:', err);
        setVerified(false);
      } finally {
        setLoading(false);
      }
    };

    verifyCredentials();
  }, [sessionCode, teacherKey, setClassroomSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span>교사 세션 보안 자격 검증 중...</span>
      </div>
    );
  }

  if (verified === false) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative font-sans text-gray-100">
        <div className="w-full max-w-md bg-[#180a0a]/80 border border-red-500/20 rounded-3xl p-8 backdrop-blur-md text-center space-y-6">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto animate-bounce" />
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-red-500">보안 인증 실패</h1>
            <p className="text-xs font-mono text-gray-500 uppercase">// ACCESS DENIED // INVALID TEACHER KEY</p>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed">
            제공된 교사 관리 인증키(`key`)가 해당 세션 코드 정보와 일치하지 않거나 세션이 파괴되었습니다. 키가 손상되었는지 확인하시고 세션을 다시 개설해 주세요.
          </p>

          <button
            onClick={() => {
              gameAudio.playClick();
              router.push('/teacher/create');
            }}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg"
          >
            새로운 세션 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <TeacherPasswordGate>
      <main className={`min-h-screen ${theme === 'dark' ? 'dark-theme' : 'light-theme'} font-sans relative overflow-x-hidden p-4 flex flex-col justify-between`}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 z-40" />

        {classroomSession && (
          <TeacherDashboard
            sessionCode={sessionCode}
            classroomSession={classroomSession}
            setClassroomSession={setClassroomSession}
            classroomStudents={classroomStudents}
            setClassroomStudents={setClassroomStudents}
            onBack={() => {
              router.push('/');
            }}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}
      </main>
    </TeacherPasswordGate>
  );
}
