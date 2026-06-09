'use client';

import React, { useMemo } from 'react';
import { standards, STANDARD_DOMAINS, StandardDomain } from '../../../data/standards';
import { countQuestions, QuestionFilter } from '../../../lib/question-pool';
import { getUnitTitle } from '../../../data/questions';
import { gameAudio } from '../../../lib/audio';

interface StandardsBoardProps {
  filter: QuestionFilter;
  onFilterChange: (next: QuestionFilter) => void;
}

const DOMAIN_COLORS: Record<StandardDomain, { border: string; bg: string; text: string; badge: string }> = {
  '운동과 에너지': { border: 'border-blue-500/30',   bg: 'bg-blue-950/20',   text: 'text-blue-300',   badge: 'bg-blue-900/50 text-blue-200' },
  '물질':         { border: 'border-violet-500/30', bg: 'bg-violet-950/20', text: 'text-violet-300', badge: 'bg-violet-900/50 text-violet-200' },
  '생명':         { border: 'border-emerald-500/30',bg: 'bg-emerald-950/20',text: 'text-emerald-300',badge: 'bg-emerald-900/50 text-emerald-200' },
  '지구와 우주':  { border: 'border-amber-500/30',  bg: 'bg-amber-950/20',  text: 'text-amber-300',  badge: 'bg-amber-900/50 text-amber-200' },
};

const DIFFICULTY_CHIPS: { key: 'easy' | 'medium' | 'hard'; label: string; color: string }[] = [
  { key: 'easy',   label: '쉬움',  color: 'bg-teal-900/40 text-teal-300 border-teal-600/40' },
  { key: 'medium', label: '보통',  color: 'bg-blue-900/40 text-blue-300 border-blue-600/40' },
  { key: 'hard',   label: '어려움', color: 'bg-rose-900/40 text-rose-300 border-rose-600/40' },
];

// 사용 가능한 학년 목록 — standards 데이터에서 동적 파생 (코드 무수정 확장)
const AVAILABLE_GRADE_LEVELS: number[] = [...new Set(standards.map(s => s.gradeLevel))].sort();

const GRADE_LABELS: Record<number, string> = {
  5: '5학년',
  6: '6학년 심화',
};

export default function StandardsBoard({ filter, onFilterChange }: StandardsBoardProps) {
  const activeCodes = new Set(filter.standardCodes ?? []);
  const activeDiffs = new Set(filter.difficulties ?? []);
  const activeGrades = new Set(filter.gradeLevels ?? []);

  // 현재 필터 기준 출제 가능 문항 수
  const previewCount = useMemo(() => countQuestions(filter), [filter]);

  const toggleStandard = (code: string) => {
    gameAudio.playClick();
    const next = new Set(activeCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onFilterChange({ ...filter, standardCodes: [...next] });
  };

  const toggleGrade = (grade: number) => {
    gameAudio.playClick();
    const next = new Set(activeGrades);
    if (next.has(grade)) next.delete(grade);
    else next.add(grade);
    onFilterChange({ ...filter, gradeLevels: [...next] });
  };

  const toggleDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
    gameAudio.playClick();
    const next = new Set(activeDiffs);
    if (next.has(diff)) next.delete(diff);
    else next.add(diff);
    const diffs = [...next] as ('easy' | 'medium' | 'hard')[];
    onFilterChange({ ...filter, difficulties: diffs });
  };

  const handleClearAll = () => {
    gameAudio.playClick();
    onFilterChange({ count: filter.count });
  };

  const hasSelection = activeCodes.size > 0 || activeDiffs.size > 0 || activeGrades.size > 0;

  return (
    <div className="space-y-4">
      {/* 헤더 + 미리보기 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest">
          // 📐 성취기준 보드
        </h3>
        {hasSelection && (
          <button
            onClick={handleClearAll}
            className="text-[10px] font-mono text-gray-500 hover:text-rose-400 transition-colors"
          >
            선택 초기화
          </button>
        )}
      </div>

      {/* 출제 풀 미리보기 */}
      <div className="p-3 bg-gray-950 border border-cyan-500/20 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-mono text-gray-400">현재 출제 풀</span>
          <span className={`text-sm font-black font-mono ${previewCount > 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            {previewCount}문항
          </span>
        </div>
        {!hasSelection ? (
          <p className="text-[10px] text-gray-600">성취기준·학년·난이도를 선택하면 출제 풀이 변경됩니다.</p>
        ) : (
          <div className="flex flex-wrap gap-1 mt-1">
            {[...activeGrades].map(g => (
              <span key={g} className="text-[9px] font-mono bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 px-1.5 py-0.5 rounded">
                {GRADE_LABELS[g] ?? `${g}학년`}
              </span>
            ))}
            {[...activeCodes].map(code => (
              <span key={code} className="text-[9px] font-mono bg-cyan-900/30 text-cyan-400 border border-cyan-700/30 px-1.5 py-0.5 rounded">
                {code}
              </span>
            ))}
            {([...activeDiffs] as string[]).map(d => (
              <span key={d} className="text-[9px] font-mono bg-violet-900/30 text-violet-400 border border-violet-700/30 px-1.5 py-0.5 rounded">
                {d === 'easy' ? '쉬움' : d === 'medium' ? '보통' : '어려움'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 학년 칩 */}
      {AVAILABLE_GRADE_LEVELS.length > 1 && (
        <div>
          <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">학년 필터</div>
          <div className="flex gap-2 flex-wrap">
            {AVAILABLE_GRADE_LEVELS.map(grade => (
              <button
                key={grade}
                onClick={() => toggleGrade(grade)}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                  activeGrades.has(grade)
                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40 ring-1 ring-offset-1 ring-offset-black ring-current'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                }`}
              >
                {GRADE_LABELS[grade] ?? `${grade}학년`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 난이도 칩 */}
      <div>
        <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">난이도 필터</div>
        <div className="flex gap-2 flex-wrap">
          {DIFFICULTY_CHIPS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleDifficulty(key)}
              className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                activeDiffs.has(key)
                  ? color + ' ring-1 ring-offset-1 ring-offset-black ring-current'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 도메인별 성취기준 카드 목록 */}
      <div className="space-y-4">
        {STANDARD_DOMAINS.map(domain => {
          const domainStds = standards.filter(s => s.domain === domain);
          const colors = DOMAIN_COLORS[domain];
          return (
            <div key={domain}>
              <div className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-2 ${colors.text}`}>
                {domain}
              </div>
              <div className="space-y-1.5">
                {domainStds.map(std => {
                  const isActive = activeCodes.has(std.code);
                  const qCount = countQuestions({ unitIds: [std.unitId] });
                  const unitTitle = getUnitTitle(std.unitId);
                  return (
                    <button
                      key={std.code}
                      onClick={() => toggleStandard(std.code)}
                      className={`w-full text-left rounded-lg border p-2.5 transition-all group ${
                        isActive
                          ? `${colors.border} ${colors.bg} ring-1 ring-inset ring-cyan-500/30`
                          : 'border-gray-800 bg-gray-950/50 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className={`mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-sm border text-[9px] flex items-center justify-center font-bold ${
                            isActive ? 'bg-cyan-500 border-cyan-500 text-black' : 'border-gray-600 text-transparent'
                          }`}>
                            ✓
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-mono font-black ${isActive ? colors.text : 'text-gray-500'}`}>
                                {std.code}
                              </span>
                              <span className="text-[9px] text-gray-600 truncate">{unitTitle}</span>
                            </div>
                            <p className={`text-[11px] leading-relaxed ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                              {std.statement}
                            </p>
                          </div>
                        </div>
                        <span className={`flex-shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded ${colors.badge}`}>
                          {qCount}문항
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
