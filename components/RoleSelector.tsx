'use client';

import React, { useState } from 'react';
import { gameAudio } from '../lib/audio';
import { User, ShieldAlert, ChevronRight } from 'lucide-react';

interface RoleSelectorProps {
  onSelectStudent: (name: string, avatar: string, sessionCode: string) => void;
  onSelectTeacher: () => void;
}

const AVATARS = [
  { char: '⚡', label: '전기' },
  { char: '🔥', label: '불꽃' },
  { char: '💧', label: '물' },
  { char: '🌱', label: '풀' },
  { char: '🦖', label: '공룡' },
  { char: '🔬', label: '현미경' },
  { char: '🌋', label: '화산' },
  { char: '🛸', label: '우주선' },
  { char: '⭐', label: '별' },
  { char: '🧬', label: '유전자' },
];

export default function RoleSelector({ onSelectStudent, onSelectTeacher }: RoleSelectorProps) {
  const [mode, setMode] = useState<'select' | 'student-profile' | 'student-code' | 'teacher-password'>('select');
  const [studentName, setStudentName] = useState('');
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [selectedNumber, setSelectedNumber] = useState<number>(1);
  const [selectedAvatar, setSelectedAvatar] = useState('⚡');
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionCodeInput, setSessionCodeInput] = useState('');
  const [sessionCodeError, setSessionCodeError] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState('');
  const [teacherPin, setTeacherPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSelectRole = (role: 'student' | 'teacher') => {
    gameAudio.playClick();
    if (role === 'teacher') {
      const isVerified = typeof window !== 'undefined' && sessionStorage.getItem('teacher_verified') === 'true';
      if (isVerified) {
        onSelectTeacher();
      } else {
        setTeacherPin('');
        setPinError('');
        setMode('teacher-password');
      }
    } else {
      setMode('student-profile');
    }
  };

  const handlePinKeyPress = (num: string) => {
    gameAudio.playClick();
    setPinError('');
    if (teacherPin.length < 4) {
      setTeacherPin(prev => prev + num);
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (teacherPin === '2026') {
      gameAudio.playCorrect();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('teacher_verified', 'true');
      }
      onSelectTeacher();
    } else {
      gameAudio.playWrong();
      setPinError('비밀번호가 올바르지 않습니다.');
      setTeacherPin('');
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    gameAudio.playClick();

    const trimmed = studentName.trim();
    if (!trimmed) {
      setErrorMsg('이름 또는 닉네임을 입력해주세요.');
      return;
    }
    if (trimmed.length > 10) {
      setErrorMsg('이름은 10자 이내로 입력해주세요.');
      return;
    }

    const formattedName = `${selectedClass}반 ${selectedNumber}번 ${trimmed}`;
    setPendingName(formattedName);
    setPendingAvatar(selectedAvatar);
    setSessionCodeInput('');
    setSessionCodeError('');
    setMode('student-code');
  };

  const handleSessionCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = sessionCodeInput.trim().toUpperCase();
    if (!code) {
      setSessionCodeError('참여 코드를 입력해주세요.');
      return;
    }
    if (code.length < 4) {
      setSessionCodeError('올바른 참여 코드를 입력해주세요.');
      return;
    }
    gameAudio.playCorrect();
    localStorage.setItem('science_pokedex_player_session_code', code);
    onSelectStudent(pendingName, pendingAvatar, code);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-cyan-400 tracking-wider mb-3 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          과학 마스터 도감
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          과학 지식으로 세상을 탐험하세요!
        </p>
      </div>

      {mode === 'select' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Student Role Card */}
          <button
            onClick={() => handleSelectRole('student')}
            className="group relative glass-panel p-8 text-left border-cyan-500/20 bg-gradient-to-b from-cyan-950/10 to-transparent hover:border-cyan-400/50 hover:bg-cyan-950/20 active:scale-[0.98] transition-all flex flex-col justify-between min-h-[250px] touch-target"
          >
            {/* Glowing Corner */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400/40 group-hover:bg-cyan-400 rounded-bl" />
            
            <div>
              <div className="w-14 h-14 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-cyan-400 transition-colors">
                학생 모드 (Student)
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                퀴즈 세션에 참가하고 수집용 카드를 모아 자신만의 과학 마스터 포켓몬 도감을 완성하세요.
              </p>
            </div>

            <div className="mt-6 flex items-center text-cyan-400 text-sm font-bold gap-1">
              학생으로 입장 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Teacher Role Card */}
          <button
            onClick={() => handleSelectRole('teacher')}
            className="group relative glass-panel p-8 text-left border-amber-500/20 bg-gradient-to-b from-amber-950/10 to-transparent hover:border-amber-500/50 hover:bg-amber-950/20 active:scale-[0.98] transition-all flex flex-col justify-between min-h-[250px] touch-target"
          >
            {/* Glowing Corner */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-amber-400/40 group-hover:bg-amber-400 rounded-bl" />

            <div>
              <div className="w-14 h-14 rounded-lg bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-amber-400 transition-colors">
                교사 / 관리자 모드 (Teacher)
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                퀴즈 세션을 생성하여 학생들의 제출 현황과 응답 결과를 실시간 모니터링하고 학급 성적 데이터를 CSV로 관리하세요.
              </p>
            </div>

            <div className="mt-6 flex items-center text-amber-400 text-sm font-bold gap-1">
              교사로 입장 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {mode === 'student-profile' && (
        /* Student Profile Registration Card */
        <div className="w-full max-w-lg glass-panel p-8 border-cyan-500/30 bg-gray-950/50 shadow-2xl relative text-left">
          <div className="absolute top-0 left-0 w-8 h-1 bg-cyan-400" />
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
            <User className="w-6 h-6" /> 학생 프로필 등록
          </h2>

          <form onSubmit={handleStudentSubmit} className="space-y-6">
            {/* 과학 아바타 선택 */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 tracking-wider">
                나만의 과학 아바타 선택
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVATARS.map(({ char, label }) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => { gameAudio.playClick(); setSelectedAvatar(char); }}
                    className={`py-2.5 bg-gray-900 border rounded-lg text-center text-2xl transition-all ${
                      selectedAvatar === char
                        ? 'border-cyan-500 bg-cyan-950/30 shadow-[0_0_10px_rgba(6,182,212,0.3)] scale-105'
                        : 'border-gray-800 hover:border-gray-600'
                    }`}
                    title={label}
                  >
                    {char}
                    <span className="text-[10px] font-bold block mt-0.5 text-gray-400">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 반/번호 선택 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-wider">
                  반 선택
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    gameAudio.playClick();
                    setSelectedClass(Number(e.target.value));
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500 text-sm font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                    <option key={c} value={c}>{c}반</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-wider">
                  번호 선택
                </label>
                <select
                  value={selectedNumber}
                  onChange={(e) => {
                    gameAudio.playClick();
                    setSelectedNumber(Number(e.target.value));
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-500 text-sm font-bold"
                >
                  {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}번</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nickname Input */}
            <div>
              <label htmlFor="student-name" className="block text-xs font-bold text-gray-450 mb-2 uppercase tracking-wider">
                이름 또는 닉네임 입력 (최대 10자)
              </label>
              <input
                id="student-name"
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="예: 홍길동"
                maxLength={10}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-base font-bold transition-all"
                autoFocus
              />
              {errorMsg && (
                <p className="text-red-500 text-xs font-mono mt-1.5 flex items-center gap-1">
                  ⚠ {errorMsg}
                </p>
              )}
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-900">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playClick();
                  setMode('select');
                  setErrorMsg('');
                }}
                className="flex-1 py-3 border border-gray-850 hover:bg-gray-900 text-gray-400 hover:text-gray-200 rounded-lg text-base font-bold transition-all touch-target"
              >
                뒤로가기
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-black rounded-lg text-base tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] touch-target"
              >
                입장하기
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'student-code' && (
        <div className="w-full max-w-md glass-panel p-8 border-cyan-500/30 bg-gray-950/50 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🔑</div>
            <h2 className="text-xl font-black text-cyan-400">참여 코드 입력</h2>
            <p className="text-xs font-mono text-gray-500 mt-1">교사에게 받은 6자리 코드를 입력하세요</p>
          </div>
          <form onSubmit={handleSessionCodeSubmit} className="space-y-4">
            <input
              type="text"
              value={sessionCodeInput}
              onChange={e => { setSessionCodeInput(e.target.value.toUpperCase()); setSessionCodeError(''); }}
              placeholder="예: A1B2C3"
              maxLength={8}
              autoFocus
              className="w-full px-4 py-3 bg-gray-900 border border-cyan-500/30 rounded-lg text-center text-2xl font-black font-mono text-cyan-400 tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-cyan-400"
            />
            {sessionCodeError && <p className="text-red-400 text-xs text-center font-mono">{sessionCodeError}</p>}
            <button type="submit" className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-lg transition-all">
              입장하기
            </button>
            <button type="button" onClick={() => setMode('student-profile')} className="w-full py-2 text-gray-500 hover:text-gray-300 text-xs font-mono transition-all">
              ← 이름 입력으로 돌아가기
            </button>
          </form>
        </div>
      )}

      {mode === 'teacher-password' && (
        /* Teacher PIN Verification Card */
        <div className="w-full max-w-md glass-panel p-8 border-amber-500/30 bg-gray-950/50 shadow-2xl relative text-center space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_10px_rgba(245,158,11,0.6)]" />

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-amber-500">교사용 비밀번호 입력</h2>
            <p className="text-xs text-gray-500">
              교사용 4자리 PIN을 입력하세요
            </p>
          </div>

          <div className="flex justify-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                  idx < teacherPin.length
                    ? 'bg-amber-400 border-amber-400 scale-110 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'bg-transparent border-gray-700'
                }`}
              />
            ))}
          </div>

          {pinError && (
            <p className="text-red-500 text-xs font-mono text-center animate-shake">
              ⚠ {pinError}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 w-60 mx-auto font-mono text-gray-200">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinKeyPress(num)}
                className="h-11 bg-gray-900 border border-gray-800 hover:border-amber-500/30 hover:bg-amber-950/10 font-bold rounded-lg text-base active:scale-95 transition-all flex items-center justify-center touch-target"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { gameAudio.playClick(); setTeacherPin(''); setPinError(''); }}
              className="h-11 bg-red-950/20 border border-red-900/30 hover:border-red-500/30 text-red-400 font-bold rounded-lg text-xs active:scale-95 transition-all flex items-center justify-center touch-target"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handlePinKeyPress('0')}
              className="h-11 bg-gray-900 border border-gray-800 hover:border-amber-500/30 hover:bg-amber-950/10 font-bold rounded-lg text-base active:scale-95 transition-all flex items-center justify-center touch-target"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => { gameAudio.playClick(); setTeacherPin(prev => prev.slice(0, -1)); }}
              className="h-11 bg-gray-900 border border-gray-800 hover:border-amber-500/30 hover:bg-amber-950/10 text-gray-400 rounded-lg active:scale-95 transition-all flex items-center justify-center touch-target"
            >
              ←
            </button>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-900">
            <button
              type="button"
              onClick={() => {
                gameAudio.playClick();
                setMode('select');
                setTeacherPin('');
                setPinError('');
              }}
              className="flex-1 py-2.5 border border-gray-850 hover:bg-gray-900 text-gray-400 rounded-lg text-xs font-bold transition-all touch-target"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => handlePinSubmit()}
              disabled={teacherPin.length < 4}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black font-black rounded-lg text-xs tracking-wider transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)] touch-target"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
