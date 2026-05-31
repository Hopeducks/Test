'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gameAudio } from '../../../lib/audio';
import { supabase } from '../../../lib/supabase-client';
import { 
  Play, 
  Download, 
  Users, 
  HelpCircle,
  Database,
  ArrowLeft,
  Key
} from 'lucide-react';
import TeacherPasswordGate from '../../../components/ui/TeacherPasswordGate';

export default function TeacherCreatePage() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState('');
  const [nicknamesText, setNicknamesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCode = () => {
    gameAudio.playClick();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSessionCode(code);
    
    // Generate unique teacher key
    const uniqueKey = 'teacher_key_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setGeneratedKey(uniqueKey);
  };

  const handleDownloadKey = () => {
    if (!generatedKey || !sessionCode) return;
    gameAudio.playClick();

    const fileContent = `과학 마스터 메타버스 교사용 세션 보안키\n========================================\n접속 세션 코드: ${sessionCode}\n교사 관리 인증키: ${generatedKey}\n\n주의: 이 파일은 교사 대시보드 복원 및 권한 증명용이므로 타인에게 누설하지 마세요.`;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `과학_메타버스_세션_${sessionCode}_교사키.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSession = async () => {
    if (!sessionCode || !generatedKey) {
      setError('먼저 세션 코드를 발급해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    // Split nickname list by comma/newline
    const names = nicknamesText
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    try {
      // Create session in Supabase / Local Storage fallback db
      const sessionData = {
        code: sessionCode,
        teacher_id: generatedKey,
        unit_id: 1, // Default to Unit 1
        status: 'lobby',
        current_question_index: 0,
        question_start_time: 0,
        battle_mode: false,
        settings: {
          timer: true,
          timerSeconds: 30,
          battleModeEnabled: false,
          raidEnabled: false,
          allowChat: true
        },
        students: names.map(name => ({
          name,
          avatar: '⚡',
          isSimulated: false,
          currentScore: 0,
          currentStreak: 0,
          answeredCurrentQuestion: false,
          x: 20,
          y: 15,
          equippedCosmetics: { outfit: 'none', expression: 'none', accessory: 'none', mount: 'none' }
        }))
      };

      await supabase.from('game_sessions').insert(sessionData);

      // Save credentials locally as well
      localStorage.setItem(`teacher_session_key_${sessionCode}`, generatedKey);

      gameAudio.playCatchSuccess();
      
      // Redirect to `/teacher/[code]?key=[teacherKey]`
      router.push(`/teacher/${sessionCode}?key=${generatedKey}`);
    } catch (e) {
      console.error(e);
      setError('세션 생성 도중 데이터베이스 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherPasswordGate>
      <main className="min-h-screen bg-[#030712] text-gray-100 flex flex-col justify-center items-center p-4 relative font-sans">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 z-40" />

        <div className="w-full max-w-xl bg-[#0a101d]/80 border border-cyan-500/20 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative">
          <button
            onClick={() => { router.push('/'); }}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 font-mono text-xs transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 홈으로 (BACK)
          </button>

          <div className="text-center space-y-2 mb-8">
            <Database className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
            <h1 className="text-2xl font-black tracking-wide text-gray-100">신규 메타버스 교실 개설</h1>
            <p className="text-xs font-mono text-cyan-400/60 uppercase tracking-widest">// START A NEW INTERACTIVE SESSION</p>
          </div>

          <div className="space-y-6">
            
            {/* Step 1: Generate code & Download key */}
            <div className="p-4 bg-gray-950/80 border border-gray-900 rounded-xl space-y-4">
              <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4" /> 1단계: 세션 보안인증 정보 생성
              </h3>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  readOnly
                  placeholder="코드 자동 생성"
                  value={sessionCode}
                  className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm font-bold text-center font-mono text-white"
                />
                <button
                  onClick={handleGenerateCode}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-lg transition-all"
                >
                  코드 발급
                </button>
              </div>

              {generatedKey && (
                <div className="flex items-center justify-between p-3 bg-cyan-950/10 border border-cyan-500/10 rounded-lg">
                  <div className="text-left">
                    <span className="text-[9px] text-gray-500 block font-mono">TEACHER KEY</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">{generatedKey}</span>
                  </div>
                  <button
                    onClick={handleDownloadKey}
                    className="px-3 py-1.5 bg-gray-900 border border-gray-800 text-[10px] text-gray-300 font-bold rounded-md flex items-center gap-1 hover:border-cyan-500/30"
                  >
                    <Download className="w-3.5 h-3.5" /> 파일 다운로드
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Upload Nickname list */}
            <div className="p-4 bg-gray-950/80 border border-gray-900 rounded-xl space-y-3">
              <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 2단계: 학급 학생 명단 등록 (선택)
              </h3>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                사전에 등록할 학생 닉네임 목록을 쉼표(,) 또는 엔터로 구분하여 아래 텍스트 상자에 입력하세요. 미입력 시 익명 입장을 전면 수락합니다.
              </p>
              <textarea
                placeholder="예: 김민준, 이서연, 박지호, 최윤서..."
                value={nicknamesText}
                onChange={(e) => setNicknamesText(e.target.value)}
                rows={3}
                className="w-full p-3 bg-gray-900 border border-gray-800 rounded-lg text-xs placeholder-gray-600 focus:outline-none focus:border-cyan-400 font-sans"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-mono text-center">⚠ {error}</p>
            )}

            <button
              disabled={loading || !sessionCode || !generatedKey}
              onClick={handleCreateSession}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-black text-base rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
            >
              {loading ? '세션 생성 중...' : '메타버스 세션 시작하기 (Start)'}
            </button>

          </div>
        </div>
      </main>
    </TeacherPasswordGate>
  );
}
