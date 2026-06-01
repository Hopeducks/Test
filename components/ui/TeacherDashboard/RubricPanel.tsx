'use client';

import React, { useState } from 'react';
import { rubrics, getRubric } from '../../../data/rubrics';
import { gameAudio } from '../../../lib/audio';

interface RubricPanelProps {
  activeUnitId: number;
}

const LEVEL_COLORS = {
  1: { border: 'border-blue-500/40',   bg: 'bg-blue-950/20',   text: 'text-blue-300' },
  2: { border: 'border-amber-500/40',  bg: 'bg-amber-950/20',  text: 'text-amber-300' },
  3: { border: 'border-purple-500/40', bg: 'bg-purple-950/20', text: 'text-purple-300' },
} as const;

export default function RubricPanel({ activeUnitId }: RubricPanelProps) {
  const [selectedUnit, setSelectedUnit] = useState(activeUnitId);
  const rubric = getRubric(selectedUnit);

  return (
    <div className="glass-panel p-4 space-y-4">
      <h3 className="text-xs font-mono font-black text-teal-400 uppercase tracking-widest border-b border-gray-900 pb-2">
        // RUBRIC VIEWER (평가 루브릭)
      </h3>

      <select
        value={selectedUnit}
        onChange={e => { gameAudio.playClick(); setSelectedUnit(Number(e.target.value)); }}
        className="w-full p-1.5 bg-gray-950 border border-gray-800 rounded text-xs font-mono text-gray-300"
      >
        {rubrics.map(r => (
          <option key={r.unitId} value={r.unitId}>{r.unitId}단원. {r.unitName}</option>
        ))}
      </select>

      {rubric && (
        <div className="space-y-2">
          {rubric.levels.map(level => {
            const colors = LEVEL_COLORS[level.level];
            return (
              <div key={level.level} className={`rounded-lg border p-3 space-y-1 ${colors.border} ${colors.bg}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{level.labelEmoji}</span>
                  <span className={`text-xs font-mono font-bold ${colors.text}`}>
                    Level {level.level} — {level.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">{level.description}</p>
                {level.exampleAnswer && (
                  <p className="text-[10px] text-gray-500 italic border-t border-gray-800 pt-1 mt-1">
                    예시: &ldquo;{level.exampleAnswer}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
