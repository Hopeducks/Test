'use client';

import React from 'react';
import { ClassroomSession } from '../../../types';
import { standards } from '../../../data/standards';
import { getUnitTitle } from '../../../data/questions';
import { accuracyToHeatColor } from '../../../lib/question-pool';

interface StandardsHeatmapProps {
  classroomSession: ClassroomSession;
  onFilterByStandard: (codes: string[]) => void;
}

interface UnitAccuracy {
  unitId: number;
  rate: number;
}

function deriveUnitAccuracy(classroomSession: ClassroomSession): Map<number, UnitAccuracy> {
  const { students, activeUnitId, currentQuestionIndex } = classroomSession;
  const totalAttempted = currentQuestionIndex + (students.some(s => s.answeredCurrentQuestion) ? 1 : 0);
  const map = new Map<number, UnitAccuracy>();

  for (let u = 1; u <= 8; u++) {
    if (u === activeUnitId && totalAttempted > 0 && students.length > 0) {
      const avgScore = students.reduce((acc, s) => acc + s.currentScore, 0) / students.length;
      map.set(u, { unitId: u, rate: avgScore / totalAttempted });
    } else {
      map.set(u, { unitId: u, rate: -1 }); // -1 = 세션 데이터 없음
    }
  }
  return map;
}

const HEAT_CLASS = {
  cool: 'bg-emerald-900/60 border-emerald-500/30 text-emerald-300',
  warm: 'bg-amber-900/40 border-amber-500/30 text-amber-300',
  hot:  'bg-red-900/40   border-red-500/30   text-red-300',
  none: 'bg-gray-950/40  border-gray-800     text-gray-600',
} as const;

const DOMAINS = ['지구와 우주', '운동과 에너지', '물질', '생명'] as const;

export default function StandardsHeatmap({ classroomSession, onFilterByStandard }: StandardsHeatmapProps) {
  const unitAccuracy = deriveUnitAccuracy(classroomSession);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-extrabold text-rose-400 uppercase tracking-widest flex items-center gap-2">
          📊 성취기준별 학급 정답률 히트맵
        </h3>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/30 text-emerald-300">80%+ 양호</span>
          <span className="px-2 py-0.5 rounded bg-amber-900/40 border border-amber-500/30 text-amber-300">60~79% 주의</span>
          <span className="px-2 py-0.5 rounded bg-red-900/40 border border-red-500/30 text-red-300">~60% 취약</span>
        </div>
      </div>

      {DOMAINS.map(domain => {
        const domainStandards = standards.filter(s => s.domain === domain && s.gradeLevel === 5);
        if (domainStandards.length === 0) return null;

        const unitIds = [...new Set(domainStandards.map(s => s.unitId))];

        return (
          <div key={domain} className="glass-panel p-4 border-rose-500/10 bg-black/30">
            <div className="text-[10px] font-mono text-rose-400 uppercase tracking-widest mb-3">
              // {domain}
            </div>
            <div className="space-y-2">
              {unitIds.map(unitId => {
                const accuracy = unitAccuracy.get(unitId);
                const unitStds = domainStandards.filter(s => s.unitId === unitId);

                return (
                  <div key={unitId}>
                    <div className="text-[10px] text-gray-500 font-mono mb-1.5">
                      {unitId}단원 · {getUnitTitle(unitId)}
                      {accuracy && accuracy.rate >= 0 && (
                        <span className={`ml-2 font-bold ${
                          accuracy.rate >= 0.8 ? 'text-emerald-400' :
                          accuracy.rate >= 0.6 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          단원 평균 {Math.round(accuracy.rate * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {unitStds.map(std => {
                        const rate = accuracy?.rate ?? -1;
                        const colorKey = rate < 0 ? 'none'
                          : accuracyToHeatColor(rate);
                        const cls = HEAT_CLASS[colorKey];

                        return (
                          <button
                            key={std.code}
                            onClick={() => onFilterByStandard([std.code])}
                            title={`${std.code}: ${std.statement}\n클릭하면 이 성취기준으로 복습 퀴즈 필터 적용`}
                            className={`text-[10px] font-mono px-2 py-1 rounded border transition-all hover:brightness-125 cursor-pointer ${cls}`}
                          >
                            {std.code}
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
      })}

      {classroomSession.students.length === 0 && (
        <p className="text-xs text-gray-600 font-mono text-center py-4">
          접속된 학생이 없어 정답률 데이터가 없습니다. 퀴즈를 진행하면 히트맵이 갱신됩니다.
        </p>
      )}
    </div>
  );
}
