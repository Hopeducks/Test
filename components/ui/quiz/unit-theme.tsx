import React from 'react';

export interface UnitTheme {
  name: string;
  bgGradient: string;
  cardBg: string;
  accentGlow: string;
  textColor: string;
  btnStyle: string;
  btnCorrect: string;
  btnIncorrect: string;
  overlayHtml?: React.ReactNode;
}

export function getUnitTheme(unitId: number): UnitTheme {
  switch (unitId) {
    case 1:
      return {
        name: '지층과 화석',
        bgGradient: 'from-stone-900 to-amber-950',
        cardBg: 'bg-stone-950/80 border-stone-750/30',
        accentGlow: 'shadow-[0_0_15px_rgba(120,113,108,0.15)]',
        textColor: 'text-stone-400',
        btnStyle: 'border-stone-500/20 hover:border-stone-450 hover:bg-stone-900/30 text-stone-200 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-stone-400 via-stone-600 to-transparent" />
        )
      };
    case 2:
      return {
        name: '빛의 성질',
        bgGradient: 'from-yellow-950 via-gray-950 to-amber-950',
        cardBg: 'bg-black/80 border-yellow-500/20',
        accentGlow: 'shadow-[0_0_20px_rgba(234,179,8,0.15)]',
        textColor: 'text-yellow-400',
        btnStyle: 'border-yellow-500/20 hover:border-yellow-450 hover:bg-yellow-950/20 text-yellow-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[2px] h-full bg-gradient-to-b from-yellow-400 via-amber-500 to-transparent blur-[1px] animate-pulse" />
            <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-yellow-300 via-transparent to-transparent blur-[0.5px]" />
          </div>
        )
      };
    case 3:
      return {
        name: '용해와 용액',
        bgGradient: 'from-blue-950 to-indigo-950',
        cardBg: 'bg-indigo-950/50 border-blue-500/20 backdrop-blur-md',
        accentGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
        textColor: 'text-blue-400',
        btnStyle: 'border-blue-500/20 hover:border-blue-400 hover:bg-blue-950/20 text-blue-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.08] overflow-hidden">
            <div className="absolute bottom-4 left-4 w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '4s' }} />
            <div className="absolute bottom-10 left-36 w-4 h-4 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '6s' }} />
            <div className="absolute bottom-6 left-72 w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '5s' }} />
            <div className="absolute bottom-20 right-12 w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
          </div>
        )
      };
    case 4:
      return {
        name: '우리 몸의 구조와 기능',
        bgGradient: 'from-purple-950 to-fuchsia-950',
        cardBg: 'bg-purple-950/70 border-fuchsia-500/20',
        accentGlow: 'shadow-[0_0_15px_rgba(217,70,239,0.15)]',
        textColor: 'text-fuchsia-400',
        btnStyle: 'border-fuchsia-500/20 hover:border-fuchsia-400 hover:bg-fuchsia-950/20 text-fuchsia-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
            <div className="w-full h-full bg-[linear-gradient(90deg,transparent_49%,rgba(217,70,239,0.2)_50%,transparent_51%)] bg-[length:40px_40px] animate-pulse" />
          </div>
        )
      };
    case 5:
      return {
        name: '생물과 환경',
        bgGradient: 'from-emerald-950 to-stone-900',
        cardBg: 'bg-stone-950/70 border-emerald-500/20',
        accentGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
        textColor: 'text-emerald-400',
        btnStyle: 'border-emerald-500/20 hover:border-emerald-400 hover:bg-emerald-950/20 text-emerald-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] overflow-hidden">
            <span className="absolute top-10 left-12 text-base text-emerald-500 animate-pulse select-none opacity-40">🍃</span>
            <span className="absolute bottom-20 right-16 text-sm text-emerald-400 animate-bounce select-none opacity-30">🌱</span>
          </div>
        )
      };
    case 6:
      return {
        name: '날씨와 우리 생활',
        bgGradient: 'from-cyan-950 to-slate-900',
        cardBg: 'bg-slate-950/70 border-cyan-500/20',
        accentGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        textColor: 'text-cyan-400',
        btnStyle: 'border-cyan-500/20 hover:border-cyan-400 hover:bg-cyan-950/20 text-cyan-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.15),transparent)] animate-pulse" />
          </div>
        )
      };
    case 7:
      return {
        name: '물체의 운동',
        bgGradient: 'from-slate-800 to-zinc-950',
        cardBg: 'bg-zinc-950/80 border-slate-600/30',
        accentGlow: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
        textColor: 'text-slate-400',
        btnStyle: 'border-slate-500/20 hover:border-slate-400 hover:bg-slate-900/30 text-slate-200 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] overflow-hidden">
            <div className="absolute top-1/3 left-0 w-full h-[1px] bg-white animate-pulse" />
            <div className="absolute top-2/3 left-0 w-full h-[1px] bg-slate-400" />
          </div>
        )
      };
    case 8:
      return {
        name: '산과 염기',
        bgGradient: 'from-red-950 to-purple-950',
        cardBg: 'bg-purple-950/40 border-red-500/20 backdrop-blur-sm',
        accentGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        textColor: 'text-red-400',
        btnStyle: 'border-red-500/20 hover:border-red-400 hover:bg-red-950/20 text-red-100 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
        overlayHtml: (
          <div className="absolute inset-0 pointer-events-none opacity-[0.06] overflow-hidden">
            <div className="absolute bottom-4 left-12 w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute bottom-12 left-48 w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '1.2s' }} />
            <div className="absolute bottom-8 right-24 w-4.5 h-4.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }} />
          </div>
        )
      };
    default:
      return {
        name: '과학 퀴즈',
        bgGradient: 'from-[#0b0f19] to-[#04060c]',
        cardBg: 'bg-[#090f1d]/60 border-cyan-500/10',
        accentGlow: 'shadow-[0_0_15px_rgba(6,182,212,0.1)]',
        textColor: 'text-cyan-400',
        btnStyle: 'border-cyan-500/10 hover:border-cyan-400/40 bg-gray-950/30 hover:bg-cyan-950/10 text-gray-250 hover:text-white',
        btnCorrect: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
        btnIncorrect: 'border-red-500 bg-red-950/40 text-red-300',
      };
  }
}
