'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { gameAudio } from '../../lib/audio';

// ── 타입 정의 ──────────────────────────────────────────
interface LegendaryAnnouncementProps {
  playerName: string;
  playerAvatar: string;
  cardName: string;
  cardEmoji: string;
  onClose: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  delay: number;
}

// ── 파티클 생성 ────────────────────────────────────────
const PARTICLE_COLORS: readonly string[] = [
  '#fbbf24', '#f59e0b', '#d97706', '#fcd34d',
  '#fef3c7', '#fffbeb', '#f97316', '#fb923c',
] as const;

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 10,
    y: 50 + (Math.random() - 0.5) * 10,
    angle: (360 / count) * i + Math.random() * 30,
    speed: 120 + Math.random() * 180,
    size: 4 + Math.random() * 8,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    delay: Math.random() * 0.3,
  }));
}

// ── 상수 ───────────────────────────────────────────────
const AUTO_CLOSE_MS = 5000;
const PARTICLE_COUNT = 12;

export default function LegendaryAnnouncement({
  playerName,
  playerAvatar,
  cardName,
  cardEmoji,
  onClose,
}: LegendaryAnnouncementProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles] = useState<Particle[]>(() => createParticles(PARTICLE_COUNT));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 입장 애니메이션 + 사운드
  useEffect(() => {
    // Trigger entry animation on next frame
    const raf = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    gameAudio.playCatchSuccess();

    return () => cancelAnimationFrame(raf);
  }, []);

  // 자동 닫기 타이머
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      handleClose();
    }, AUTO_CLOSE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Wait for exit animation to complete
    setTimeout(() => {
      onClose();
    }, 400);
  }, [onClose]);

  const handleOverlayClick = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    handleClose();
  }, [handleClose]);

  return (
    <div
      className={`
        fixed inset-0 z-[60] flex items-center justify-center
        cursor-pointer select-none overflow-hidden
        transition-opacity duration-400
        ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
      onClick={handleOverlayClick}
      role="dialog"
      aria-label="전설의 카드 획득 알림"
    >
      {/* ── 배경 그라디언트 ────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(120, 53, 15, 0.9) 0%, rgba(0, 0, 0, 0.95) 70%)',
        }}
      />

      {/* ── 파티클 버스트 ──────────────────────────── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: isVisible
              ? `particleBurst 1.8s ${p.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
              : 'none',
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0)',
            // CSS custom properties via style for the animation
            ['--px-angle' as string]: `${p.angle}deg`,
            ['--px-speed' as string]: `${p.speed}px`,
          }}
        />
      ))}

      {/* ── 메인 컨텐츠 ───────────────────────────── */}
      <div
        className={`
          relative z-10 flex flex-col items-center text-center px-8 py-10
          transition-all duration-500
          ${isVisible
            ? 'scale-100 translate-y-0'
            : 'scale-50 translate-y-8'
          }
        `}
        style={{
          transitionTimingFunction: isVisible
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' // bounce easing
            : 'ease-in',
        }}
      >
        {/* 상단 장식 라인 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-amber-400/60" />
          <span className="text-amber-400/80 text-[10px] font-mono tracking-[0.3em] uppercase">
            legendary unlock
          </span>
          <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-amber-400/60" />
        </div>

        {/* 카드 이모지 (빛나는 효과) */}
        <div className="relative mb-8">
          {/* 외부 글로우 링 */}
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
              transform: 'scale(2.5)',
            }}
          />

          {/* 회전하는 글로우 링 */}
          <div
            className="absolute -inset-6 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(251, 191, 36, 0.4), transparent, rgba(245, 158, 11, 0.4), transparent)',
              animation: 'spinGlow 3s linear infinite',
            }}
          />

          {/* 카드 이모지 본체 */}
          <div
            className="relative text-8xl leading-none"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.6)) drop-shadow(0 0 60px rgba(245, 158, 11, 0.3))',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          >
            {cardEmoji}
          </div>

          {/* 시머 오버레이 */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
            style={{
              animation: 'shimmerPass 2.5s ease-in-out infinite',
              background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.3) 45%, rgba(255, 255, 255, 0.1) 50%, transparent 55%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* 플레이어 정보 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{playerAvatar}</span>
          <span className="text-lg font-bold text-amber-200 tracking-wide">
            {playerName}
          </span>
        </div>

        {/* 획득 메시지 */}
        <h2
          className="text-xl font-black tracking-wider mb-3"
          style={{
            background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 30%, #fbbf24 60%, #fef3c7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {playerName} 님이 전설의 카드를 획득했습니다!
        </h2>

        {/* 카드 이름 */}
        <div className="relative px-6 py-3 rounded-lg border border-amber-500/30 bg-amber-950/30 backdrop-blur-sm">
          <p
            className="text-2xl font-black tracking-widest"
            style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 40%, #f59e0b 70%, #fcd34d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {cardName}
          </p>
          {/* 작은 글로우 장식 */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        </div>

        {/* 닫기 안내 */}
        <p className="mt-6 text-[10px] text-amber-200/40 font-mono tracking-wider animate-pulse">
          아무 곳이나 클릭하여 닫기
        </p>
      </div>

      {/* ── CSS 애니메이션 ──────────────────────────── */}
      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% {
            filter: drop-shadow(0 0 30px rgba(251, 191, 36, 0.6))
                    drop-shadow(0 0 60px rgba(245, 158, 11, 0.3));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 45px rgba(251, 191, 36, 0.8))
                    drop-shadow(0 0 80px rgba(245, 158, 11, 0.5));
            transform: scale(1.05);
          }
        }

        @keyframes spinGlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes shimmerPass {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes particleBurst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(0deg)
                       translateX(0px);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3)
                       rotate(calc(var(--px-angle) + 180deg))
                       translateX(var(--px-speed));
          }
        }

        .duration-400 {
          transition-duration: 400ms;
        }
      `}</style>
    </div>
  );
}
