'use client';

import React, { useState } from 'react';
import { Trophy, Download, FileSpreadsheet, ClipboardPaste, CheckCircle } from 'lucide-react';
import { ClassroomSession } from '../../../types';
import { getUnitTitle } from '../../../data/questions';
import StandardsHeatmap from './StandardsHeatmap';

interface ImportPreview {
  name: string;
  avatar: string;
  unitId: number;
  score: number;
  unlockedCardsCount: number;
}

interface StatsPanelProps {
  classroomSession: ClassroomSession;
  aiClassFeedback: { summary: string; recs: string[]; lowestUnit: number };
  onExportCSV: () => void;
  onCopyTSV: () => void;
  onGoogleSync: () => void;
  onImportStudent: (name: string, avatar: string, score: number) => void;
  googleSyncState: 'idle' | 'syncing' | 'synced';
  copied: boolean;
  onFilterByStandard?: (codes: string[]) => void;
}

export default function StatsPanel({
  classroomSession,
  aiClassFeedback,
  onExportCSV,
  onCopyTSV,
  onGoogleSync,
  onImportStudent,
  googleSyncState,
  copied,
  onFilterByStandard,
}: StatsPanelProps) {
  const [importCode, setImportCode] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState('');
  const [importAdded, setImportAdded] = useState(false);

  const handleDecodeCode = () => {
    try {
      const raw = JSON.parse(decodeURIComponent(atob(importCode.trim())));
      const unitId: number = Array.isArray(raw.completedUnits) && raw.completedUnits.length > 0
        ? raw.completedUnits[0]
        : 1;
      const rawScore: number = raw.unitScores?.[unitId] ?? 0;
      setImportPreview({
        name: String(raw.name || '학생'),
        avatar: String(raw.avatar || '🧑'),
        unitId,
        score: Math.round(rawScore / 10),
        unlockedCardsCount: Number(raw.unlockedCardsCount ?? 0),
      });
      setImportError('');
      setImportAdded(false);
    } catch {
      setImportError('코드 형식이 올바르지 않습니다. 학생 화면에서 복사한 코드인지 확인하세요.');
      setImportPreview(null);
    }
  };

  const handleAddStudent = () => {
    if (!importPreview) return;
    onImportStudent(importPreview.name, importPreview.avatar, importPreview.score);
    setImportAdded(true);
    setTimeout(() => {
      setImportCode('');
      setImportPreview(null);
      setImportAdded(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* 세션 랭킹 */}
      <div className="glass-panel p-5 border-amber-500/10">
        <h3 className="text-sm font-extrabold text-amber-400 border-b border-gray-900 pb-2 mb-4 uppercase tracking-widest flex items-center gap-2">
          <Trophy className="w-4 h-4" /> 세션 내 학생 랭킹
        </h3>
        <div className="space-y-2">
          {[...classroomSession.students]
            .map(s => ({
              name: s.name,
              avatar: s.avatar,
              cards: (s as { unlockedCardsCount?: number }).unlockedCardsCount ?? 0,
              score: s.currentScore ?? 0,
              completedUnits: ((s as { completedUnits?: number[] }).completedUnits ?? []).length,
            }))
            .sort((a, b) => b.cards !== a.cards ? b.cards - a.cards : b.score - a.score)
            .map((s, idx) => (
              <div key={s.name} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs ${
                idx === 0 ? 'border-amber-500/30 bg-amber-950/10' :
                idx === 1 ? 'border-gray-600/30 bg-gray-900/30' :
                idx === 2 ? 'border-amber-800/30 bg-amber-950/5' :
                'border-gray-900 bg-gray-950/20'
              }`}>
                <span className="w-6 text-center font-black shrink-0 text-sm">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                </span>
                <span className="text-lg shrink-0">{s.avatar}</span>
                <span className="flex-1 font-bold text-gray-200 truncate">{s.name}</span>
                <span className="text-purple-400 font-bold">{s.cards}장</span>
                <span className="text-emerald-400 font-bold">{s.score}점</span>
              </div>
            ))
          }
          {classroomSession.students.length === 0 && (
            <p className="text-xs text-gray-600 font-mono text-center py-4">접속된 학생이 없습니다.</p>
          )}
        </div>
      </div>

      {/* AI 진단 피드백 */}
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
        {/* Completion Heatmap */}
        <div className="glass-panel p-5 border-cyan-500/10 bg-black/40">
          <h3 className="text-sm font-extrabold text-cyan-400 border-b border-gray-900 pb-3 mb-4 uppercase tracking-widest">
            단원별 완료 상태 히트맵 (Completion Heatmap)
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {classroomSession.students.map(student => {
              const totalAttempted = classroomSession.currentQuestionIndex +
                (student.answeredCurrentQuestion ? 1 : 0);
              const accuracy = totalAttempted > 0
                ? Math.round((student.currentScore / totalAttempted) * 100)
                : 0;
              return (
                <div key={student.name} className="space-y-1 border-b border-gray-900 pb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold w-24 truncate">{student.avatar} {student.name}</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {student.currentScore}점 ({accuracy}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-mono ${
                      student.answeredCurrentQuestion
                        ? student.lastAnswerCorrect ? 'text-emerald-500' : 'text-red-500'
                        : 'text-gray-700'
                    }`}>
                      {student.answeredCurrentQuestion
                        ? student.lastAnswerCorrect ? '✓' : '✗'
                        : '…'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accuracy Chart */}
        <div className="glass-panel p-5 border-cyan-500/10 bg-black/40 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-cyan-400 border-b border-gray-900 pb-3 mb-6 uppercase tracking-widest">
              단원별 전체 평균 정답률
            </h3>
            <div className="space-y-3">
              {(() => {
                const { students, activeUnitId, currentQuestionIndex } = classroomSession;
                const totalAttempted = currentQuestionIndex +
                  (students.some(s => s.answeredCurrentQuestion) ? 1 : 0);
                const avgScore = students.length > 0
                  ? students.reduce((acc, s) => acc + s.currentScore, 0) / students.length
                  : 0;
                const sessionAccuracy = totalAttempted > 0
                  ? Math.round((avgScore / totalAttempted) * 100)
                  : 0;
                return [1, 2, 3, 4, 5, 6, 7, 8].map(unitId => {
                  const isActive = unitId === activeUnitId;
                  const accuracy = isActive ? sessionAccuracy : 0;
                  return (
                    <div key={unitId} className="space-y-1">
                      <div className="flex justify-between items-baseline text-xs font-mono">
                        <span className={isActive ? 'text-gray-200' : 'text-gray-700'}>
                          {unitId}단원. {getUnitTitle(unitId)}
                        </span>
                        <span className={`font-bold ${isActive ? 'text-cyan-400' : 'text-gray-700'}`}>
                          {isActive ? `${accuracy}%` : '—'}
                        </span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden border ${
                        isActive ? 'bg-gray-950 border-gray-800' : 'bg-gray-950/50 border-gray-900'
                      }`}>
                        <div
                          className={`h-full transition-all duration-700 ${
                            isActive ? 'bg-cyan-400' : 'bg-gray-800'
                          }`}
                          style={{ width: `${isActive ? accuracy : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="border-t border-gray-900 pt-4 mt-6 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              <button onClick={onExportCSV} className="px-3.5 py-2 border border-gray-800 bg-gray-950 hover:text-cyan-400 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 touch-target">
                <Download className="w-3.5 h-3.5" /> CSV 다운로드
              </button>
              <button onClick={onCopyTSV} className="px-3.5 py-2 border border-gray-800 bg-gray-950 hover:text-cyan-400 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 touch-target">
                <FileSpreadsheet className="w-3.5 h-3.5" /> {copied ? '복사 완료! (Ctrl+V)' : '구글 시트용 복사'}
              </button>
            </div>
            <button
              onClick={onGoogleSync}
              disabled={googleSyncState === 'syncing'}
              className={`px-4 py-2 font-black rounded-lg text-xs tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)] touch-target ${
                googleSyncState === 'synced' ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-cyan-500 hover:bg-cyan-400 text-black'
              }`}
            >
              {googleSyncState === 'syncing' ? (
                <><div className="w-3 h-3 border border-t-transparent border-black rounded-full animate-spin" />연동 중...</>
              ) : googleSyncState === 'synced' ? '구글 워크스페이스 연동됨 ✓' : '구글 워크스페이스 실시간 연계'}
            </button>
          </div>
        </div>
      </div>

      {/* E-2: 성취기준별 히트맵 */}
      {onFilterByStandard && (
        <div className="glass-panel p-5 border-rose-500/10">
          <StandardsHeatmap
            classroomSession={classroomSession}
            onFilterByStandard={onFilterByStandard}
          />
        </div>
      )}

      {/* 학생 오프라인 제출 코드 수집 */}
      <div className="glass-panel p-5 border-purple-500/10">
        <h3 className="text-sm font-extrabold text-purple-400 border-b border-gray-900 pb-2 mb-4 uppercase tracking-widest flex items-center gap-2">
          <ClipboardPaste className="w-4 h-4" /> 학생 오프라인 제출 코드 수집
        </h3>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          학생이 퀴즈 완료 후 복사한 <span className="text-purple-400 font-bold">교사용 제출 코드</span>를 붙여넣으면 학급 명단에 수동 등록할 수 있습니다. 오프라인 환경 또는 Supabase 미연동 상황에서 활용하세요.
        </p>
        <div className="space-y-3">
          <textarea
            value={importCode}
            onChange={(e) => { setImportCode(e.target.value); setImportPreview(null); setImportError(''); }}
            placeholder="학생 화면 → 퀴즈 완료 → 교사용 제출 코드 복사 → 여기에 붙여넣기 (Ctrl+V)"
            rows={3}
            className="w-full bg-gray-950 border border-gray-800 focus:border-purple-500/50 text-[11px] text-cyan-300 font-mono px-3 py-2 rounded-lg resize-none focus:outline-none transition-colors"
          />
          <button
            onClick={handleDecodeCode}
            disabled={!importCode.trim()}
            className="px-4 py-2 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 font-bold text-xs rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            코드 읽기
          </button>

          {importError && (
            <p className="text-xs text-red-400 font-mono">{importError}</p>
          )}

          {importPreview && (
            <div className="p-4 bg-purple-950/10 border border-purple-500/20 rounded-lg space-y-3">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block">// DECODED STUDENT RESULT</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-2xl">{importPreview.avatar}</span>
                <div>
                  <span className="font-bold text-gray-100 block">{importPreview.name}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {importPreview.unitId}단원 · {getUnitTitle(importPreview.unitId)} · 정답 {importPreview.score}/10점 · 카드 {importPreview.unlockedCardsCount}장
                  </span>
                </div>
              </div>
              <button
                onClick={handleAddStudent}
                disabled={importAdded}
                className={`w-full py-2 font-black text-xs rounded-lg transition-all touch-target ${
                  importAdded
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {importAdded ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> 학급 명단에 추가 완료
                  </span>
                ) : '학급 명단에 추가'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
