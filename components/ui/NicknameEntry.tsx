'use client';

import React, { useState } from 'react';
import { Player } from '../../types';
import { supabase } from '../../lib/supabase-client';
import { joinSession } from '../../lib/supabase/edge-functions';
import { gameAudio } from '../../lib/audio';
import { User, KeyRound, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

import useGameState from '../../lib/game-state';

interface NicknameEntryProps {
  sessionCode: string;
  onJoinSuccess: (player: Player) => void;
  onCancel?: () => void;
}

export default function NicknameEntry({ sessionCode, onJoinSuccess, onCancel }: NicknameEntryProps) {
  const { setStudentProfile } = useGameState();
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'남' | '여'>('남');
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [selectedNumber, setSelectedNumber] = useState<number>(1);
  const [selectedAvatar, setSelectedAvatar] = useState('👦');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenderChange = (newGender: '남' | '여') => {
    gameAudio.playClick();
    setGender(newGender);
    setSelectedAvatar(newGender === '남' ? '👦' : '👧');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = nickname.trim();
    if (!trimmed) {
      setErrorMsg('이름을 입력해 주세요.');
      return;
    }

    if (trimmed.length > 8) {
      setErrorMsg('이름은 최대 8자까지 입력 가능합니다.');
      return;
    }

    const formattedName = `${selectedClass}반 ${selectedNumber}번 ${trimmed}`;

    setLoading(true);
    gameAudio.playClick();

    try {
      // 1. Check for duplicate nicknames in the current session via Supabase players query
      const { data: duplicatePlayers, error: checkError } = await supabase
        .from('players')
        .select('id')
        .eq('session_code', sessionCode)
        .eq('nickname', formattedName);

      if (checkError) {
        throw new Error('중복 닉네임 검사 중 오류가 발생했습니다.');
      }

      if (duplicatePlayers && duplicatePlayers.length > 0) {
        setErrorMsg('이미 이 세션에 참가 중인 대원 번호/이름입니다.');
        setLoading(false);
        return;
      }

      // 2. Call joinSession edge function (which registers player in Database / Local Storage)
      const { player } = await joinSession(sessionCode, formattedName);

      // Save student profile to local state (which updates local storage and gameAudio profile)
      setStudentProfile(formattedName, selectedAvatar);

      // 3. Callback to parent passing the received player object
      onJoinSuccess(player);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : '세션 참가에 실패했습니다. 코드를 다시 확인해 주세요.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md p-8 border-cyan-500/30 bg-gradient-to-b from-[#090f1d] to-[#040812] shadow-2xl relative">
        {/* Glow decoration */}
        <div className="absolute top-0 left-0 w-16 h-[2px] bg-cyan-400" />
        <div className="absolute top-0 left-0 w-[2px] h-16 bg-cyan-400" />

        <div className="mb-6">
          <div className="w-12 h-12 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-100 tracking-wider">
            메타버스 닉네임 등록
          </h2>
          <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-widest">
            // REGISTRATION FOR SESSION: {sessionCode}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Code Info */}
          <div className="p-3 bg-gray-950 border border-cyan-500/5 rounded-lg flex items-center gap-3">
            <KeyRound className="w-4 h-4 text-cyan-500 shrink-0" />
            <div className="text-left font-mono">
              <span className="text-[9px] text-gray-500 block">접속 교실 세션 코드</span>
              <span className="text-sm font-bold text-cyan-400">{sessionCode}</span>
            </div>
          </div>

          {/* 학급 정보 선택 (반, 번호, 성별) */}
          <div className="grid grid-cols-3 gap-3 text-left">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                성별
              </label>
              <div className="flex bg-gray-950 border border-gray-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleGenderChange('남')}
                  className={`flex-1 py-1 text-[10px] font-black rounded transition-all ${
                    gender === '남'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  남
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderChange('여')}
                  className={`flex-1 py-1 text-[10px] font-black rounded transition-all ${
                    gender === '여'
                      ? 'bg-pink-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  여
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                반 선택
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  gameAudio.playClick();
                  setSelectedClass(Number(e.target.value));
                }}
                className="w-full px-2 py-1.5 bg-gray-955 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-400 text-xs font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                  <option key={c} value={c}>
                    {c}반
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                번호 선택
              </label>
              <select
                value={selectedNumber}
                onChange={(e) => {
                  gameAudio.playClick();
                  setSelectedNumber(Number(e.target.value));
                }}
                className="w-full px-2 py-1.5 bg-gray-955 border border-gray-800 rounded-lg text-gray-100 focus:outline-none focus:border-cyan-400 text-xs font-bold"
              >
                {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}번
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Avatar Sub-Selector based on Gender */}
          <div className="text-left">
            <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              아바타 캐릭터 선택
            </label>
            <div className="flex gap-3">
              {gender === '남' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playClick();
                      setSelectedAvatar('👦');
                    }}
                    className={`flex-1 py-1.5 bg-gray-955 border rounded-lg text-center text-xl transition-all ${
                      selectedAvatar === '👦'
                        ? 'border-cyan-450 bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        : 'border-gray-800 text-gray-450'
                    }`}
                  >
                    👦 <span className="text-[9px] font-bold block mt-0.5 text-gray-400">소년</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playClick();
                      setSelectedAvatar('🧑');
                    }}
                    className={`flex-1 py-1.5 bg-gray-955 border rounded-lg text-center text-xl transition-all ${
                      selectedAvatar === '🧑'
                        ? 'border-cyan-450 bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        : 'border-gray-800 text-gray-450'
                    }`}
                  >
                    🧑 <span className="text-[9px] font-bold block mt-0.5 text-gray-400">청년</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playClick();
                      setSelectedAvatar('👧');
                    }}
                    className={`flex-1 py-1.5 bg-gray-955 border rounded-lg text-center text-xl transition-all ${
                      selectedAvatar === '👧'
                        ? 'border-cyan-450 bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        : 'border-gray-800 text-gray-450'
                    }`}
                  >
                    👧 <span className="text-[9px] font-bold block mt-0.5 text-gray-400">소녀</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playClick();
                      setSelectedAvatar('👩');
                    }}
                    className={`flex-1 py-1.5 bg-gray-955 border rounded-lg text-center text-xl transition-all ${
                      selectedAvatar === '👩'
                        ? 'border-cyan-450 bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        : 'border-gray-800 text-gray-450'
                    }`}
                  >
                    👩 <span className="text-[9px] font-bold block mt-0.5 text-gray-400">여성</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Nickname Input */}
          <div className="text-left">
            <label htmlFor="nickname" className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
              탐사 대원 이름 입력 (최대 8자)
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="예: 홍길동"
              maxLength={8}
              disabled={loading}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-base font-bold transition-all"
              autoFocus
            />
            {errorMsg && (
              <div className="text-red-400 text-xs font-medium mt-2 flex items-center gap-1.5 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-cyan-500/10">
            {onCancel && (
              <button
                type="button"
                onClick={() => {
                  gameAudio.playClick();
                  onCancel();
                }}
                disabled={loading}
                className="flex-1 py-3 border border-gray-850 hover:bg-gray-900 text-gray-400 hover:text-gray-200 rounded-lg text-xs font-bold transition-all"
              >
                뒤로가기
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black rounded-lg text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  동기화 중...
                </>
              ) : (
                <>
                  시작
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
