'use client';

import React from 'react';
import { useGameState } from '../../lib/game-state';
import { Question, isMCQuestion, isOXQuestion, isShortQuestion, isMatchingQuestion } from '../../types';
import { cards } from '../../data/cards';
import { questions } from '../../data/questions';
import { ArrowLeft, BookOpen, Star, Printer, AlertCircle, CheckCircle, Trophy, Target } from 'lucide-react';

const UNITS = [
  { id: 1, title: '지층과 화석', icon: '🪨' },
  { id: 2, title: '빛의 성질', icon: '🔍' },
  { id: 3, title: '용해와 용액', icon: '🧪' },
  { id: 4, title: '우리 몸의 구조와 기능', icon: '🫁' },
  { id: 5, title: '생물과 환경', icon: '🌲' },
  { id: 6, title: '날씨와 우리 생활', icon: '⛅' },
  { id: 7, title: '물체의 운동', icon: '🏃' },
  { id: 8, title: '산과 염기', icon: '💧' },
];

function getCorrectAnswerText(q: Question): string {
  if (isMCQuestion(q)) return q.options[q.correctIndex];
  if (isOXQuestion(q)) return q.correctIndex === 0 ? 'O (맞다)' : 'X (틀리다)';
  if (isShortQuestion(q)) return q.correctAnswer;
  if (isMatchingQuestion(q)) return q.pairs.map(p => `${p.left} → ${p.right}`).join(' / ');
  return '';
}

interface MyPageProps {
  onBack: () => void;
}

export default function MyPage({ onBack }: MyPageProps) {
  const { progress, studentName, studentAvatar, removeWrongAnswer } = useGameState();
  const { unlockedCardIds, completedUnits, unitHighScores, coins, trainerXp, wrongAnswers } = progress;

  const totalCards = 80;
  const xp = trainerXp ?? 0;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;

  const recentCards = [...unlockedCardIds]
    .reverse()
    .slice(0, 6)
    .map(id => cards.find(c => c.id === id))
    .filter(Boolean) as typeof cards;

  const wrongQuestions = (wrongAnswers ?? [])
    .slice(0, 10)
    .map(id => questions.find(q => q.id === id))
    .filter(Boolean) as Question[];

  const scoredUnits = UNITS.filter(u => unitHighScores[u.id] !== undefined);
  const bestUnit = scoredUnits.reduce<typeof UNITS[0] | null>((best, u) => {
    if (!best) return u;
    return (unitHighScores[u.id] ?? 0) > (unitHighScores[best.id] ?? 0) ? u : best;
  }, null);
  const avgAccuracy = scoredUnits.length > 0
    ? Math.round(scoredUnits.reduce((sum, u) => sum + Math.round((unitHighScores[u.id] ?? 0) * 10), 0) / scoredUnits.length)
    : 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-slide-up space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 print:hidden">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 hover:text-white hover:border-gray-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-black text-cyan-400 tracking-wide">내 학습 기록</h1>
        <button
          onClick={() => window.print()}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white text-xs font-bold rounded-lg transition-all"
        >
          <Printer className="w-3.5 h-3.5" /> 학부모 리포트 출력
        </button>
      </div>
      <div className="hidden print:block print:mb-4">
        <h1 className="text-2xl font-black">과학 마스터 도감 — 학습 리포트</h1>
        <p className="text-sm text-gray-600">학생명: {studentName || '(미설정)'} | 출력일: {new Date().toLocaleDateString('ko-KR')}</p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel p-6 border-cyan-500/20 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="text-6xl shrink-0">{studentAvatar || '🎒'}</div>
        <div className="flex-1 w-full space-y-3">
          <div>
            <p className="text-xs font-mono text-gray-500 uppercase">TRAINER</p>
            <h2 className="text-xl font-black text-white">{studentName || '과학 탐험가'}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-950/60 rounded-lg p-3 border border-gray-800">
              <p className="text-lg font-black text-yellow-400">Lv.{level}</p>
              <p className="text-[10px] text-gray-500 font-mono">LEVEL</p>
            </div>
            <div className="bg-gray-950/60 rounded-lg p-3 border border-gray-800">
              <p className="text-lg font-black text-amber-400">{coins ?? 0}</p>
              <p className="text-[10px] text-gray-500 font-mono">COINS</p>
            </div>
            <div className="bg-gray-950/60 rounded-lg p-3 border border-gray-800">
              <p className="text-lg font-black text-purple-400">{unlockedCardIds.length}/{totalCards}</p>
              <p className="text-[10px] text-gray-500 font-mono">CARDS</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
              <span>XP</span><span>{xpInLevel}/100</span>
            </div>
            <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                style={{ width: `${xpInLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Summary */}
      <div className="glass-panel p-5 border-yellow-500/10 space-y-4">
        <h3 className="text-sm font-extrabold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
          <Trophy className="w-4 h-4" /> 학습 성취 요약
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-400">{completedUnits.length}<span className="text-sm text-gray-500 font-normal">/8</span></p>
            <p className="text-[10px] text-gray-500 mt-0.5">완료 단원</p>
            <div className="flex gap-0.5 justify-center mt-2">
              {UNITS.map(u => (
                <div
                  key={u.id}
                  className={`w-2 h-2 rounded-full ${completedUnits.includes(u.id) ? 'bg-emerald-400' : 'bg-gray-800'}`}
                />
              ))}
            </div>
          </div>
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-cyan-400">{avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">평균 정답률</p>
            {avgAccuracy > 0 && (
              <div className="mt-2 h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${avgAccuracy >= 80 ? 'bg-emerald-400' : avgAccuracy >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${avgAccuracy}%` }}
                />
              </div>
            )}
          </div>
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-purple-400">{unlockedCardIds.length}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">보유 카드</p>
            <div className="mt-2 h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(unlockedCardIds.length / totalCards) * 100}%` }} />
            </div>
          </div>
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl">{bestUnit ? bestUnit.icon : '—'}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">최고의 단원</p>
            {bestUnit && (
              <p className="text-[9px] text-yellow-300 mt-0.5 leading-tight font-bold">{bestUnit.title}</p>
            )}
          </div>
        </div>
      </div>

      {/* Journey Map */}
      <div className="glass-panel p-5 border-cyan-500/10 space-y-4">
        <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <Target className="w-4 h-4" /> 학습 여정
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {UNITS.map(unit => {
            const isComplete = completedUnits.includes(unit.id);
            const highScore = unitHighScores[unit.id] ?? 0;
            const accuracy = Math.round(highScore * 10);
            const isAttempted = accuracy > 0;
            const unitCards = unlockedCardIds.filter(id => id.startsWith(`u${unit.id}_`));
            const totalUnitCards = cards.filter(c => c.unitId === unit.id).length;

            return (
              <div
                key={unit.id}
                className={`relative rounded-xl border p-3 transition-all ${
                  isComplete
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : isAttempted
                    ? 'border-cyan-500/30 bg-cyan-950/10'
                    : 'border-gray-800 bg-gray-950/30 opacity-50'
                }`}
              >
                <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${
                  isComplete
                    ? 'bg-emerald-500 border-emerald-400 text-white'
                    : isAttempted
                    ? 'bg-cyan-700 border-cyan-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-600'
                }`}>
                  {unit.id}
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xl shrink-0">{unit.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold leading-tight ${
                      isComplete ? 'text-emerald-300' : isAttempted ? 'text-gray-200' : 'text-gray-600'
                    }`}>
                      {unit.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isComplete && (
                        <span className="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold rounded">
                          CLEAR
                        </span>
                      )}
                      {isAttempted && (
                        <span className={`text-[10px] font-black ${
                          accuracy >= 80 ? 'text-emerald-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {accuracy}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isAttempted && (
                  <div className="mt-2 h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                )}
                <p className={`text-[9px] font-mono mt-1 ${isAttempted ? 'text-gray-600' : 'text-gray-700'}`}>
                  카드 {unitCards.length}/{totalUnitCards}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Cards */}
      {recentCards.length > 0 && (
        <div className="glass-panel p-5 border-cyan-500/10 space-y-4">
          <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Star className="w-4 h-4" /> 최근 해금 카드
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recentCards.map(card => (
              <div
                key={card.id}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-2 text-center ${
                  card.rarity === 'legendary'
                    ? 'border-amber-400/50 bg-amber-950/20'
                    : card.rarity === 'rare' || card.rarity === 'epic'
                    ? 'border-purple-500/30 bg-purple-950/20'
                    : 'border-gray-800 bg-gray-950/50'
                }`}
              >
                <span className="text-2xl">{card.emoji}</span>
                <p className="text-[9px] font-bold text-gray-400 mt-1 leading-tight line-clamp-2">{card.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wrong Answer Notes */}
      {wrongQuestions.length > 0 && (
        <div className="glass-panel p-5 border-red-500/10 space-y-4 print:border print:border-gray-300">
          <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> 오답 노트 ({wrongQuestions.length}문항)
          </h3>
          <div className="space-y-3">
            {wrongQuestions.map(q => {
              const unitInfo = UNITS.find(u => u.id === q.unitId);
              return (
                <div key={q.id} className="bg-gray-950/60 border border-red-900/30 rounded-xl p-3 space-y-2">
                  {unitInfo && (
                    <p className="text-[9px] font-mono text-gray-600">{unitInfo.icon} {unitInfo.id}단원 · {unitInfo.title}</p>
                  )}
                  <p className="text-xs font-bold text-white leading-relaxed">{q.question}</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-300">{getCorrectAnswerText(q)}</p>
                  </div>
                  {q.explanation && (
                    <p className="text-[10px] text-gray-500 leading-relaxed">{q.explanation}</p>
                  )}
                  <button
                    onClick={() => removeWrongAnswer(q.id)}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-500/40 px-2 py-0.5 rounded transition-all print:hidden"
                  >
                    학습 완료 ✓
                  </button>
                </div>
              );
            })}
          </div>
          {(wrongAnswers?.length ?? 0) > 10 && (
            <p className="text-[10px] font-mono text-gray-600">+{(wrongAnswers?.length ?? 0) - 10}개 문항이 더 있습니다.</p>
          )}
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full py-3 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-bold rounded-xl transition-all print:hidden"
      >
        ← 홈으로 돌아가기
      </button>
    </div>
  );
}
