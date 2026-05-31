'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cards } from '../data/cards';
import { gameAudio } from '../lib/audio';
import { Sparkles } from 'lucide-react';

interface CardUnlockAnimProps {
  cardId: string;
  onContinue: () => void;
}

export default function CardUnlockAnim({ cardId, onContinue }: CardUnlockAnimProps) {
  const card = cards.find((c) => c.id === cardId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showButton, setShowButton] = useState(false);

  // Determine rarity colors
  const isLegendary = card?.rarity === 'legendary';
  const isRare = card?.rarity === 'rare';
  
  const neonColor = isLegendary 
    ? '#f59e0b' // Amber/Gold
    : isRare 
      ? '#3b82f6' // Electric Blue
      : '#00e5ff'; // Neon Cyan

  useEffect(() => {
    // Play throw sound at start
    gameAudio.playThrow();

    // Auto-reveal after a small delay
    const flipTimer = setTimeout(() => {
      setIsFlipped(true);
      gameAudio.playCatchSuccess();
      triggerSparkles();
    }, 1200);

    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 2500);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(buttonTimer);
    };
  }, [cardId]);

  // Particle System
  const triggerSparkles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = isLegendary 
      ? ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'] 
      : isRare 
        ? ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff']
        : ['#00e5ff', '#22d3ee', '#67e8f9', '#ffffff'];

    // Create particles
    const particleCount = 150;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 12;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.01 + Math.random() * 0.02,
        gravity: 0.05,
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.forEach((p) => {
        if (p.alpha > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity; // add slight gravity
          p.alpha -= p.decay;

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          // Add glow effect to particles
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        }
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  };

  if (!card) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white font-sans">
        <p>카드를 찾을 수 없습니다.</p>
        <button onClick={onContinue} className="mt-4 px-6 py-3 bg-cyan-500 rounded-lg text-black font-semibold">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#030712]/95 backdrop-blur-md">
      {/* Background Particles Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Header Announcement */}
      <div className="absolute top-12 text-center z-10 select-none animate-bounce">
        <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-widest ${
          isLegendary ? 'text-amber-400 text-gold-glow' : 'text-cyan-400 text-neon-glow'
        }`}>
          {isLegendary ? '👑 전설 카드 해금! 👑' : '✨ 새로운 카드 획득! ✨'}
        </h2>
        <p className="text-gray-400 text-lg md:text-xl mt-2 font-mono-numbers">
          {isLegendary ? 'LEGENDARY DISCOVERY' : 'NEW POKEDEX DATA UNLOCKED'}
        </p>
      </div>

      {/* 3D Card Container */}
      <div className="relative w-[340px] h-[480px] md:w-[380px] md:h-[530px] perspective-[1500px] z-10">
        <div
          className={`w-full h-full duration-[1200ms] transform-style-3d relative ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Back (Silhouette) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl bg-gray-900 border-2 border-cyan-500/30 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
            {/* Holographic lines */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_45%,rgba(6,182,212,0.1)_50%,transparent_55%)] bg-[length:200%_200%] animate-[shimmer_3s_infinite_linear]" />
            <div className="w-32 h-32 rounded-full border-4 border-dashed border-cyan-500/20 flex items-center justify-center mb-6 animate-[spin_20s_infinite_linear]">
              <span className="text-cyan-400 text-6xl font-bold font-mono">?</span>
            </div>
            <div className="h-8 w-48 bg-cyan-950/40 rounded border border-cyan-500/20 animate-pulse flex items-center justify-center">
              <span className="text-cyan-400/40 text-xs font-mono tracking-widest">SCANNING SYSTEM</span>
            </div>
          </div>

          {/* Card Front (Revealed Card) */}
          <div
            className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl flex flex-col overflow-hidden bg-gradient-to-b from-[#0b0f19] to-[#050811] border-2 shadow-2xl p-6 ${
              isLegendary 
                ? 'border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.35)]' 
                : isRare 
                  ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                  : 'border-cyan-400 shadow-[0_0_25px_rgba(0,229,255,0.25)]'
            }`}
          >
            {/* Rarity & Card ID Badge */}
            <div className="flex justify-between items-center mb-4">
              <span className={`text-xs px-2.5 py-1 rounded font-black tracking-widest uppercase border ${
                isLegendary 
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300' 
                  : isRare 
                    ? 'bg-blue-950/80 border-blue-500 text-blue-300'
                    : 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
              }`}>
                {card.rarity || 'common'}
              </span>
              <span className="text-xs font-mono text-gray-500">#{card.id.toUpperCase()}</span>
            </div>

            {/* Emoji Display Wrapper */}
            <div className={`w-full aspect-[4/3] rounded-xl flex items-center justify-center relative mb-4 border overflow-hidden ${
              isLegendary 
                ? 'bg-gradient-to-br from-amber-950/20 to-black border-amber-950' 
                : isRare 
                  ? 'bg-gradient-to-br from-blue-950/20 to-black border-blue-950'
                  : 'bg-gradient-to-br from-cyan-950/20 to-black border-cyan-950'
            }`}>
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--color-neon-blue)_0%,transparent_70%)]" />
              <span className="text-7xl md:text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] select-none">
                {card.image}
              </span>
            </div>

            {/* Card Name */}
            <h3 className={`text-2xl md:text-3xl font-black text-center mb-3 tracking-wide ${
              isLegendary ? 'text-amber-400' : isRare ? 'text-blue-400' : 'text-cyan-400'
            }`}>
              {card.name}
            </h3>

            {/* Card Divider */}
            <div className={`h-[1px] w-full my-2 ${
              isLegendary ? 'bg-amber-500/20' : isRare ? 'bg-blue-500/20' : 'bg-cyan-500/20'
            }`} />

            {/* Description (minimum 20px+ font size for classrooms) */}
            <div className="flex-1 overflow-y-auto pr-1">
              <p className="text-gray-200 text-[19px] md:text-[21px] font-medium leading-relaxed tracking-wide text-justify">
                {card.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className={`absolute bottom-12 transition-all duration-700 transform z-20 ${
        showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      }`}>
        <button
          onClick={() => {
            gameAudio.playClick();
            onContinue();
          }}
          className={`flex items-center gap-3 px-10 py-4 rounded-xl text-black font-extrabold text-xl tracking-wider uppercase transition-all transform hover:scale-105 active:scale-95 touch-target shadow-lg ${
            isLegendary
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:shadow-amber-500/40'
              : 'bg-gradient-to-r from-cyan-400 to-cyan-300 hover:shadow-cyan-400/40'
          }`}
        >
          <Sparkles className="w-6 h-6 animate-spin" />
          계속하기 (Continue)
        </button>
      </div>

      {/* CSS Utilities for Card Flipping and Shimmer (using global styles/animations fallback) */}
      <style jsx global>{`
        .perspective-1500 {
          perspective: 1500px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
