'use client';

import React, { useState } from 'react';
import { ShortQuestion } from '../../../types';

interface ShortAnswerRendererProps {
  question: ShortQuestion;
  isAnswered: boolean;
  onAnswer: (isCorrect: boolean) => void;
}

function normalizeKorean(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '');
}

export default function ShortAnswerRenderer({ question, isAnswered, onAnswer }: ShortAnswerRendererProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState<{ value: string; correct: boolean } | null>(null);

  const handleSubmit = () => {
    if (!input.trim() || isAnswered) return;
    const normalized = normalizeKorean(input);
    const isCorrect = question.acceptedAnswers.some(ans =>
      normalizeKorean(ans) === normalized || normalized.includes(normalizeKorean(ans))
    );
    setSubmitted({ value: input.trim(), correct: isCorrect });
    onAnswer(isCorrect);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAnswered}
          placeholder="정답을 입력하세요..."
          maxLength={50}
          className={`flex-1 px-4 py-3 rounded-xl border text-base font-bold transition-all outline-none ${
            submitted
              ? submitted.correct
                ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                : 'border-red-500 bg-red-950/20 text-red-300'
              : 'border-gray-700 bg-gray-950/50 text-white focus:border-cyan-400'
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={isAnswered || !input.trim()}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-black rounded-xl transition-all"
        >
          제출
        </button>
      </div>
      {submitted && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-bold ${
          submitted.correct
            ? 'border-emerald-500/50 bg-emerald-950/10 text-emerald-400'
            : 'border-red-500/50 bg-red-950/10 text-red-400'
        }`}>
          {submitted.correct ? '✅ 정답입니다!' : `❌ 오답. 정답: ${question.correctAnswer}`}
        </div>
      )}
      {!isAnswered && (
        <p className="text-[11px] text-gray-500 font-mono text-center">Enter 키 또는 제출 버튼으로 답안을 제출하세요</p>
      )}
    </div>
  );
}
