'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { gameAudio } from '../../../lib/audio';

interface QuizQuitModalProps {
  currentNumber: number; // 1-based 현재 문제 번호
  total: number;
  score: number;
  onResume: () => void;
  onQuit: () => void;
}

export default function QuizQuitModal({ currentNumber, total, score, onResume, onQuit }: QuizQuitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6 border-red-500/30 bg-gradient-to-b from-[#180a0a] to-[#0a0505] shadow-2xl relative">
        <h2 className="text-2xl font-black text-red-400 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
          퀴즈를 중단하시겠습니까?
        </h2>

        <p className="text-gray-300 text-base leading-relaxed mb-6 font-medium">
          현재 {currentNumber}/{total} 문제 완료 · {score}문제 정답
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => {
              gameAudio.playClick();
              onResume();
            }}
            className="flex-1 py-3 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white font-bold rounded-lg transition-all touch-target"
          >
            계속 풀기
          </button>

          <button
            onClick={() => {
              gameAudio.playClick();
              onQuit();
            }}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] touch-target"
          >
            퀴즈 중단하기
          </button>
        </div>
      </div>
    </div>
  );
}
