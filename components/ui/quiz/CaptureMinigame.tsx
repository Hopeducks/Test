'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ItemInventory } from '../../../types';
import { cards } from '../../../data/cards';
import { gameAudio } from '../../../lib/audio';

export type BallType = 'monsterBall' | 'superBall' | 'ultraBall' | 'masterBall';
// 몬스터볼은 무한이라 소모되지 않음 → 소모 대상은 나머지 볼로 한정
export type ConsumableBall = Exclude<BallType, 'monsterBall'>;

// 포획 트랙 폭(800px) 기준 각 볼의 CATCH ZONE 너비
function getBallWidth(type: BallType): number {
  if (type === 'superBall') return 180;
  if (type === 'ultraBall') return 240;
  if (type === 'masterBall') return 800;
  return 120;
}

// 포지션 판정을 통과했을 때 추가로 적용되는 볼 종류별 성공 확률
function getBallCatchRate(type: BallType): number {
  if (type === 'masterBall') return 1.0;
  if (type === 'ultraBall') return 0.85;
  if (type === 'superBall') return 0.70;
  return 0.50; // monsterBall
}

interface CaptureMinigameProps {
  cardId: string;
  ballItems: ItemInventory | undefined;
  /** 포획 성공 시 부모가 카드 해금 + 신규 해금 목록 추가 */
  onSuccess: (cardId: string) => void;
  /** 포획 실패 시 부모가 DB 해금 롤백 */
  onFail: (cardId: string) => void;
  /** 몬스터볼 외 볼 소모 처리 */
  onConsumeBall: (ballType: ConsumableBall) => void;
  /** 결과 확인 후 다음 문제로 진행 */
  onContinue: () => void;
}

export default function CaptureMinigame({
  cardId,
  ballItems,
  onSuccess,
  onFail,
  onConsumeBall,
  onContinue,
}: CaptureMinigameProps) {
  const [greenZoneLeft, setGreenZoneLeft] = useState(100); // 0px ~ (800 - ballWidth)
  const [captureStatus, setCaptureStatus] = useState<'aiming' | 'success' | 'fail'>('aiming');
  const [selectedBallType, setSelectedBallType] = useState<BallType>('monsterBall');
  const captureAnimRef = useRef<number | null>(null);
  const captureStartTimeRef = useRef<number | null>(null);

  const card = cards.find(c => c.id === cardId);

  // ── 조준 게이지 오실레이션 애니메이션 ──────────────────────────────
  useEffect(() => {
    if (captureStatus !== 'aiming') {
      if (captureAnimRef.current) cancelAnimationFrame(captureAnimRef.current);
      return;
    }

    const animateGreenZone = (timestamp: number) => {
      if (!captureStartTimeRef.current) captureStartTimeRef.current = timestamp;
      const elapsedSeconds = (timestamp - captureStartTimeRef.current) / 1000;

      const ballWidth = getBallWidth(selectedBallType);
      const maxLeft = Math.max(0, 800 - ballWidth);

      const speed = 200; // px/s
      const period = maxLeft > 0 ? (2 * maxLeft) / speed : 1;
      const omega = (2 * Math.PI) / period;

      const leftPos = maxLeft > 0 ? (maxLeft / 2) + (maxLeft / 2) * Math.sin(omega * elapsedSeconds) : 0;

      setGreenZoneLeft(leftPos);
      captureAnimRef.current = requestAnimationFrame(animateGreenZone);
    };

    captureAnimRef.current = requestAnimationFrame(animateGreenZone);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerCaptureAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (captureAnimRef.current) cancelAnimationFrame(captureAnimRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureStatus, selectedBallType]);

  const consumeBallIfNeeded = () => {
    if (selectedBallType === 'monsterBall') return;
    const ball: ConsumableBall = selectedBallType; // 가드 이후 좁혀진 타입
    onConsumeBall(ball);
    const remaining = (ballItems?.[ball] || 1) - 1;
    if (remaining <= 0) {
      setSelectedBallType('monsterBall');
    }
  };

  const triggerCaptureAction = () => {
    if (captureStatus !== 'aiming') return;
    if (captureAnimRef.current) cancelAnimationFrame(captureAnimRef.current);

    // 포획 침은 트랙 정중앙(400px)에 고정
    const targetPoint = 400;
    const ballWidth = getBallWidth(selectedBallType);

    const inZone = targetPoint >= greenZoneLeft && targetPoint <= greenZoneLeft + ballWidth;
    const catchRate = getBallCatchRate(selectedBallType);
    const isSuccess = inZone && Math.random() < catchRate;

    if (isSuccess) {
      gameAudio.playCatchSuccess();
      setCaptureStatus('success');
      consumeBallIfNeeded();
      onSuccess(cardId);
    } else {
      gameAudio.playWrong();
      setCaptureStatus('fail');
      consumeBallIfNeeded();
      onFail(cardId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-gradient-to-b from-[#18110a] to-[#050302] border border-amber-500/30 rounded-3xl p-8 text-center relative shadow-2xl overflow-hidden flex flex-col items-center">

        {/* Ambient Background Glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,transparent_60%)] pointer-events-none" />

        <h2 className="text-3xl md:text-4xl font-black text-amber-400 mb-2 tracking-wide font-sans animate-pulse filter drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          ✨ 희귀 카드 포획 찬스! ✨
        </h2>
        <p className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest mb-10">
          // CHANCE TO CAPTURE RARE SCIENCE CARD // PRESS SPACE OR TAP TO CATCH
        </p>

        {/* 3D Card Display Area */}
        <div className="w-56 h-72 relative perspective-1000 mb-10 select-none">
          <div className={`w-full h-full relative duration-700 preserve-3d transition-transform ${
            captureStatus === 'success' ? 'rotate-y-180' : ''
          }`}>
            {/* Card Front (Silhouette or Hidden Card before catch) */}
            <div className="absolute inset-0 backface-hidden bg-gray-900/60 border-2 border-dashed border-amber-500/20 rounded-2xl flex flex-col items-center justify-center p-4">
              <div className={`text-7xl mb-4 opacity-35 ${
                captureStatus === 'fail' ? 'scale-90 rotate-12 filter grayscale contrast-200' : 'animate-pulse'
              }`}>
                {card?.emoji || '❓'}
              </div>
              {captureStatus === 'fail' && (
                <div className="absolute inset-0 bg-red-950/20 flex items-center justify-center">
                  <span className="text-red-500 text-5xl font-black rotate-12 border-4 border-red-500 px-3 py-1 rounded-xl">ESCAPE</span>
                </div>
              )}
              <span className="text-xs text-gray-500 font-mono">RARE ENCOUNTER</span>
            </div>

            {/* Card Back (Flipped showing Card Details on Success) */}
            <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-b from-[#1b1e2a] to-[#090b11] border-2 border-amber-400 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="text-[9px] font-mono text-amber-400 font-bold uppercase">RARE CARD</span>
                <span className="text-xs font-mono font-bold text-amber-400">POWER {card?.power || 60}</span>
              </div>
              <div className="text-6xl text-center my-4">{card?.emoji}</div>
              <div className="text-center">
                <h4 className="text-sm font-black text-white">{card?.name}</h4>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{card?.description}</p>
              </div>
            </div>
          </div>

          {/* Particle Burst Elements on Success */}
          {captureStatus === 'success' && (
            <div className="absolute inset-0 pointer-events-none z-30">
              {Array.from({ length: 12 }).map((_, i) => {
                const tx = (Math.random() - 0.5) * 300;
                const ty = (Math.random() - 0.5) * 300;
                return (
                  <div
                    key={i}
                    className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      animation: 'scatter-out 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
                      ['--tx' as string]: `${tx}px`,
                      ['--ty' as string]: `${ty}px`,
                    } as React.CSSProperties}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Slider Minigame Interface */}
        {captureStatus === 'aiming' ? (
          <div className="w-full max-w-[800px] space-y-6 flex flex-col items-center">

            {/* Pokéball Selector */}
            <div className="flex justify-center gap-3 mb-2">
              {[
                { key: 'monsterBall', name: '몬스터볼', emoji: '🔴', count: '∞' as const },
                { key: 'superBall', name: '수퍼볼', emoji: '🔵', count: ballItems?.superBall ?? 0 },
                { key: 'ultraBall', name: '하이퍼볼', emoji: '🟡', count: ballItems?.ultraBall ?? 0 },
                { key: 'masterBall', name: '마스터볼', emoji: '🟣', count: ballItems?.masterBall ?? 0 },
              ].map(ball => {
                const isSelected = selectedBallType === ball.key;
                const isAvailable = ball.count === '∞' || Number(ball.count) > 0;

                return (
                  <button
                    key={ball.key}
                    disabled={!isAvailable}
                    onClick={() => {
                      gameAudio.playClick();
                      setSelectedBallType(ball.key as BallType);
                    }}
                    className={`p-3 border rounded-xl flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-amber-950/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : isAvailable
                          ? 'bg-gray-900/60 border-gray-850 hover:border-gray-700 text-gray-300 hover:scale-102 active:scale-98'
                          : 'bg-gray-950/25 border-gray-950 text-gray-600 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xl">{ball.emoji}</span>
                    <div className="text-left leading-none">
                      <span className="text-xs font-bold block">{ball.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">소지: {ball.count}개</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Easing sliding track */}
            <div className="w-[800px] h-10 bg-gray-950/80 border border-gray-850 rounded-xl relative flex items-center p-[2px] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] overflow-hidden">

              {/* Moving Target Catch Zone */}
              <div
                style={{ left: `${greenZoneLeft}px`, width: `${getBallWidth(selectedBallType)}px` }}
                className="absolute top-[2px] bottom-[2px] bg-gradient-to-r from-emerald-500/20 via-emerald-400/50 to-emerald-500/20 border border-emerald-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all duration-16 ease-linear"
              >
                <span className="text-[9px] font-black text-emerald-300 font-mono tracking-wider animate-pulse">CATCH ZONE</span>
              </div>

              {/* Fixed Pointer Indicator in the exact center (400px) */}
              <div className="absolute left-[397px] w-1.5 h-12 bg-amber-400 border border-white z-20 shadow-[0_0_8px_rgba(245,158,11,1)] rounded-full" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={triggerCaptureAction}
                className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black text-lg font-black rounded-2xl tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] btn-cyber transition-all hover:scale-105 active:scale-95 touch-target"
              >
                포획하기 (SPACE BAR / TAP)
              </button>
              <span className="text-xs text-gray-500 font-mono">가운데 노란 게이지 침이 녹색 영역 안에 머무를 때 멈추세요!</span>
            </div>

          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-2xl font-black tracking-wide">
              {captureStatus === 'success' ? (
                <span className="text-green-400">🎉 포획 성공! 도감 카드가 해금되었습니다!</span>
              ) : (
                <span className="text-red-500">💨 이번엔 놓쳤어! 다음에 도전해봐</span>
              )}
            </div>

            <button
              onClick={onContinue}
              className="px-8 py-3 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 font-black rounded-xl btn-cyber transition-all touch-target"
            >
              다음 퀴즈로 진행하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
