'use client';

import React, { useState, useMemo } from 'react';
import { MatchingQuestion } from '../../../types';

interface MatchingRendererProps {
  question: MatchingQuestion;
  isAnswered: boolean;
  onAnswer: (isCorrect: boolean) => void;
}

export default function MatchingRenderer({ question, isAnswered, onAnswer }: MatchingRendererProps) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [connections, setConnections] = useState<Record<number, number>>({});

  const shuffledRight = useMemo(() => {
    const indices = question.pairs.map((_, i) => i);
    return [...indices].sort(() => Math.random() - 0.5);
  }, [question.id]);

  const handleLeftClick = (idx: number) => {
    if (isAnswered) return;
    setSelectedLeft(idx === selectedLeft ? null : idx);
  };

  const handleRightClick = (shuffledIdx: number) => {
    if (isAnswered || selectedLeft === null) return;
    const rightIdx = shuffledRight[shuffledIdx];
    setConnections(prev => ({ ...prev, [selectedLeft]: rightIdx }));
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    const allCorrect = question.pairs.every((_, i) => connections[i] === i);
    onAnswer(allCorrect);
  };

  const allConnected = Object.keys(connections).length === question.pairs.length;

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">개념</p>
          {question.pairs.map((pair, i) => (
            <button
              key={i}
              onClick={() => handleLeftClick(i)}
              disabled={isAnswered}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all ${
                selectedLeft === i ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300'
                : i in connections ? 'border-emerald-500/50 bg-emerald-950/10 text-emerald-300'
                : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
              }`}
            >
              {pair.left}
              {i in connections && !isAnswered && <span className="ml-2 text-[10px] text-gray-500">→ 연결됨</span>}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">설명</p>
          {shuffledRight.map((rightIdx, shuffledIdx) => {
            const isConnected = Object.values(connections).includes(rightIdx);
            const isCorrectPair = isAnswered && Object.entries(connections).some(([li, ri]) => Number(ri) === rightIdx && Number(li) === rightIdx);
            return (
              <button
                key={shuffledIdx}
                onClick={() => handleRightClick(shuffledIdx)}
                disabled={isAnswered || isConnected}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                  isAnswered
                    ? isCorrectPair ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300' : 'border-red-500/50 bg-red-950/10 text-red-400'
                  : isConnected ? 'border-gray-700 bg-gray-950/20 text-gray-600 opacity-50'
                  : selectedLeft !== null ? 'border-amber-500/40 bg-amber-950/10 text-amber-300 hover:border-amber-400 cursor-pointer'
                  : 'border-gray-800 bg-gray-950/40 text-gray-300'
                }`}
              >
                {question.pairs[rightIdx].right}
              </button>
            );
          })}
        </div>
      </div>
      {!isAnswered && allConnected && (
        <button onClick={handleSubmit} className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all">
          채점하기 ✓
        </button>
      )}
      {!isAnswered && !allConnected && (
        <p className="text-[11px] text-gray-500 font-mono text-center">
          왼쪽 개념 클릭 → 오른쪽 설명 클릭으로 연결 ({Object.keys(connections).length}/{question.pairs.length} 연결됨)
        </p>
      )}
    </div>
  );
}
