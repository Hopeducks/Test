'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Key, CornerDownLeft, Delete } from 'lucide-react';
import { gameAudio } from '../../lib/audio';

interface TeacherPasswordGateProps {
  children: React.ReactNode;
}

export default function TeacherPasswordGate({ children }: TeacherPasswordGateProps) {
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check session storage on mount (client-side only)
    if (typeof window !== 'undefined') {
      const isVerified = sessionStorage.getItem('teacher_verified') === 'true';
      setVerified(isVerified);
    }
    setLoading(false);
  }, []);

  const handleKeyPress = (num: string) => {
    gameAudio.playClick();
    setError(null);
    if (password.length < 4) {
      setPassword(prev => prev + num);
    }
  };

  const handleDelete = () => {
    gameAudio.playClick();
    setPassword(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    gameAudio.playClick();
    setPassword('');
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === '2026') {
      gameAudio.playCorrect();
      sessionStorage.setItem('teacher_verified', 'true');
      setVerified(true);
      setError(null);
    } else {
      gameAudio.playWrong();
      setError('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-cyan-400 font-mono text-sm space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-cyan-400 animate-spin" />
        <span>보안 게이트 활성화 중...</span>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative font-sans text-gray-100">
        {/* Subtle scanline background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 z-40" />

        <div className="w-full max-w-md bg-[#0a101d]/90 border border-cyan-500/25 rounded-3xl p-8 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.15)] text-center space-y-6 relative overflow-hidden z-50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.8)]" />

          <div className="space-y-2">
            <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-gray-100">교사 / 관리자 잠금</h1>
            <p className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest leading-none">
              // SECURE ACCESS ONLY // ENTER ADMINISTRATOR PIN
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN Dots visualization */}
            <div className="flex justify-center gap-4 py-2">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                    idx < password.length
                      ? 'bg-cyan-400 border-cyan-400 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                      : 'bg-transparent border-gray-700'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-xs font-mono text-center animate-shake">
                ⚠ {error}
              </p>
            )}

            {/* Custom Interactive Numpad */}
            <div className="grid grid-cols-3 gap-3 w-64 mx-auto font-mono">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-12 bg-gray-900/60 border border-gray-800 hover:border-cyan-500/30 hover:bg-cyan-950/10 text-white font-bold rounded-xl text-lg transition-all active:scale-95 flex items-center justify-center touch-target"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 bg-red-950/20 border border-red-900/30 hover:border-red-500/30 text-red-400 font-bold rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center uppercase tracking-wider touch-target"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-12 bg-gray-900/60 border border-gray-800 hover:border-cyan-500/30 hover:bg-cyan-950/10 text-white font-bold rounded-xl text-lg transition-all active:scale-95 flex items-center justify-center touch-target"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-12 bg-gray-900/60 border border-gray-800 hover:border-cyan-500/30 hover:bg-cyan-950/10 text-gray-400 rounded-xl transition-all active:scale-95 flex items-center justify-center touch-target"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={password.length < 4}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-black text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-1.5"
            >
              <Key className="w-4 h-4" /> 인증 확인 (CONFIRM)
            </button>
          </form>
        </div>

        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
