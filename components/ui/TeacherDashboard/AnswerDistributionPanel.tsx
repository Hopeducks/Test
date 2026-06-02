'use client';

import React from 'react';
import { ClassroomSession, isMCQuestion, isOXQuestion } from '../../../types';
import { questions } from '../../../data/questions';

interface AnswerDistributionPanelProps {
  classroomSession: ClassroomSession;
}

export default function AnswerDistributionPanel({ classroomSession }: AnswerDistributionPanelProps) {
  const { students, currentQuestionIndex, questionIds } = classroomSession;
  const totalStudents = students.length;

  const currentQuestionId = questionIds?.[currentQuestionIndex];
  const currentQuestion = currentQuestionId
    ? questions.find(q => q.id === currentQuestionId) ?? null
    : null;

  const answered = students.filter(s => s.answeredCurrentQuestion);
  const correct = answered.filter(s => s.lastAnswerCorrect === true);
  const wrong = answered.filter(s => s.lastAnswerCorrect === false);
  const notAnswered = students.filter(s => !s.answeredCurrentQuestion);

  const responseRate = totalStudents > 0 ? Math.round((answered.length / totalStudents) * 100) : 0;
  const correctRate = answered.length > 0 ? Math.round((correct.length / answered.length) * 100) : 0;

  // Distribute wrong answers across incorrect options (simulation approximation)
  let optionCounts: number[] = [];
  let optionLabels: string[] = [];
  let correctOptionIdx = -1;

  if (currentQuestion && isMCQuestion(currentQuestion)) {
    optionCounts = [0, 0, 0, 0];
    optionLabels = ['①', '②', '③', '④'];
    correctOptionIdx = currentQuestion.correctIndex;
    optionCounts[correctOptionIdx] += correct.length;
    const wrongOptions = ([0, 1, 2, 3] as const).filter(i => i !== correctOptionIdx);
    wrong.forEach((_, idx) => {
      optionCounts[wrongOptions[idx % wrongOptions.length]]++;
    });
  } else if (currentQuestion && isOXQuestion(currentQuestion)) {
    optionCounts = [0, 0];
    optionLabels = ['⭕ O', '❌ X'];
    correctOptionIdx = currentQuestion.correctIndex;
    optionCounts[correctOptionIdx] += correct.length;
    optionCounts[1 - correctOptionIdx] += wrong.length;
  }

  const maxCount = Math.max(1, ...optionCounts);

  return (
    <div className="glass-panel p-4 space-y-4 border-blue-500/10">
      <h3 className="text-xs font-mono font-black text-blue-400 uppercase tracking-widest border-b border-gray-900 pb-2 flex items-center justify-between">
        <span>// LIVE ANSWER DISTRIBUTION</span>
        <span className="text-gray-600 font-normal">
          문제 {currentQuestionIndex + 1} / {questionIds?.length ?? 10}
        </span>
      </h3>

      {/* Response rate */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline text-xs font-mono">
          <span className="text-gray-400">응답률</span>
          <span className="text-blue-400 font-bold">
            {answered.length} / {totalStudents}명 ({responseRate}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 transition-all duration-500"
            style={{ width: `${responseRate}%` }}
          />
        </div>
      </div>

      {/* Correct / Wrong split */}
      {answered.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
            <div className="text-2xl font-black text-emerald-400">{correct.length}</div>
            <div className="text-[10px] font-mono text-emerald-600">
              정답 ({correctRate}%)
            </div>
          </div>
          <div className="p-2.5 bg-red-950/30 border border-red-500/20 rounded-lg">
            <div className="text-2xl font-black text-red-400">{wrong.length}</div>
            <div className="text-[10px] font-mono text-red-600">
              오답 ({100 - correctRate}%)
            </div>
          </div>
        </div>
      )}

      {/* Option distribution bar chart */}
      {optionCounts.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            선택지 분포 (추정)
          </span>
          {optionCounts.map((count, i) => {
            const isCorrect = i === correctOptionIdx;
            return (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className={isCorrect ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                    {optionLabels[i]} {isCorrect && '✓'}
                  </span>
                  <span className={isCorrect ? 'text-emerald-400' : 'text-gray-500'}>
                    {count}명
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCorrect ? 'bg-emerald-400' : 'bg-red-600/60'
                    }`}
                    style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Not yet answered */}
      {notAnswered.length > 0 && (
        <div className="text-[10px] font-mono text-gray-700 leading-relaxed">
          <span className="text-gray-500">미응답: </span>
          {notAnswered.slice(0, 6).map(s => s.name).join(', ')}
          {notAnswered.length > 6 && ` 외 ${notAnswered.length - 6}명`}
        </div>
      )}

      {totalStudents === 0 && (
        <p className="text-[10px] text-gray-700 font-mono text-center py-2">
          학생이 없습니다
        </p>
      )}
    </div>
  );
}
