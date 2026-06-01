'use client';

import React, { useState } from 'react';
import { OXQuestion } from '../../../types';

interface OXRendererProps {
  question: OXQuestion;
  isAnswered: boolean;
  btnCorrectStyle: string;
  btnIncorrectStyle: string;
  onAnswer: (selectedIndex: 0 | 1) => void;
}

export default function OXRenderer({ question, isAnswered, btnCorrectStyle, btnIncorrectStyle, onAnswer }: OXRendererProps) {
  const [selected, setSelected] = useState<0 | 1 | null>(null);

  const handleClick = (idx: 0 | 1) => {
    if (isAnswered) return;
    setSelected(idx);
    onAnswer(idx);
  };

  const getStyle = (idx: 0 | 1) => {
    if (!isAnswered) {
      return idx === 0
        ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/40 text-emerald-300'
        : 'bg-red-950/20 border-red-500/40 hover:border-red-400 hover:bg-red-950/40 text-red-300';
    }
    if (idx === question.correctIndex) return btnCorrectStyle;
    if (selected === idx) return btnIncorrectStyle;
    return 'border-gray-900 text-gray-600 opacity-40';
  };

  return (
    <div className="grid grid-cols-2 gap-6 mt-4">
      {([0, 1] as const).map(idx => (
        <button
          key={idx}
          disabled={isAnswered}
          onClick={() => handleClick(idx)}
          className={`min-h-[120px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 touch-target btn-cyber ${getStyle(idx)}`}
        >
          <span className="text-6xl">{idx === 0 ? '⭕' : '❌'}</span>
          <span className="text-xl font-black">{idx === 0 ? '맞다 (O)' : '틀리다 (X)'}</span>
        </button>
      ))}
    </div>
  );
}
