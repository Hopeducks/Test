'use client';

import React, { useEffect, useState } from 'react';
import { useGameState } from '../lib/game-state';
import { cards } from '../data/cards';
import { getUnitQuestions } from '../data/questions';
import { UNITS } from './PokedexHome';
import { gameAudio } from '../lib/audio';
import CardUnlockAnim from './CardUnlockAnim';
import { Award, RefreshCw, Share2, Sparkles, CheckCircle, MapPin, BookOpen } from 'lucide-react';

interface LegendaryBroadcastData {
  playerName: string;
  playerAvatar: string;
  cardName: string;
  cardEmoji: string;
}

interface UnitCompleteProps {
  unitId: number;
  score: number;
  newlyUnlockedCardIds: string[];
  onRestart: () => void;
  onGoHome: () => void;
  onGoLobby?: () => void;
  onReviewWrongAnswers?: (questionIds: string[]) => void;
  onLegendaryBroadcast?: (data: LegendaryBroadcastData) => void;
}

export default function UnitComplete({
  unitId,
  score,
  newlyUnlockedCardIds,
  onRestart,
  onGoHome,
  onGoLobby,
  onReviewWrongAnswers,
  onLegendaryBroadcast,
}: UnitCompleteProps) {
  const { progress, unlockCard, completeUnit, studentName, studentAvatar } = useGameState();

  // Compute wrong answers specific to this unit
  const unitQuestionIds = new Set(getUnitQuestions(unitId).map(q => q.id));
  const unitWrongAnswerIds = (progress.wrongAnswers ?? []).filter(id => unitQuestionIds.has(id));
  const { unlockedCardIds, unitHighScores } = progress;

  const [showLegendaryUnlock, setShowLegendaryUnlock] = useState(false);
  const [legendaryCardId, setLegendaryCardId] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [resultCode, setResultCode] = useState('');

  const unitInfo = UNITS.find((u) => u.id === unitId);
  const legendaryCard = cards.find((c) => c.unitId === unitId && c.rarity === 'legendary');

  // Load and check high score and legendary unlock
  useEffect(() => {
    // 1. Check if new high score
    const previousHighScore = unitHighScores[unitId] || 0;
    if (score > previousHighScore) {
      setIsNewHighScore(true);
    }

    // 2. Save the completion and score in game state
    completeUnit(unitId, score);

    // 3. Complete unit (10 questions solved) -> Unlock legendary evolution card
    if (legendaryCard) {
      const isNewUnlock = unlockCard(legendaryCard.id);
      if (isNewUnlock) {
        setLegendaryCardId(legendaryCard.id);
        // Play special legendary unlock cue or handle delayed trigger
        setTimeout(() => {
          setShowLegendaryUnlock(true);
        }, 1000);

        // Send via the channel owned by app/page.tsx to avoid killing the shared listener
        onLegendaryBroadcast?.({
          playerName: studentName || '학생',
          playerAvatar: studentAvatar || '⚡',
          cardName: legendaryCard.name,
          cardEmoji: legendaryCard.image,
        });
      }
    }

    // Play complete sound
    gameAudio.playCatchSuccess();

    // 4. Generate Base64 response code for teacher import
    const studentResponseData = {
      name: studentName || '학생',
      avatar: studentAvatar || '⚡',
      completedUnits: [unitId],
      unitScores: { [unitId]: score * 10 },
      unlockedCardsCount: newlyUnlockedCardIds.length + (legendaryCard ? 1 : 0),
      lastActive: new Date().toISOString(),
      answers: {} // Simple answers log summary
    };
    try {
      const code = btoa(encodeURIComponent(JSON.stringify(studentResponseData)));
      setResultCode(code);
    } catch (e) {
      console.error('Failed to generate result code', e);
    }
  }, [unitId, score, studentName, studentAvatar, newlyUnlockedCardIds, legendaryCard]);

  // Total stats for sharing
  const totalCards = 80;
  const unlockedCount = unlockedCardIds.length;
  const completionPercentage = Math.round((unlockedCount / totalCards) * 100);

  const handleShare = () => {
    gameAudio.playClick();
    
    // Construct share summary
    const cardsText = newlyUnlockedCardIds.length > 0 
      ? newlyUnlockedCardIds.map(id => cards.find(c => c.id === id)?.name || '').filter(Boolean).join(', ')
      : '없음';

    const legendaryText = legendaryCardId 
      ? `\n👑 전설 진화 카드 획득: [${legendaryCard?.name || ''}] 해금!`
      : '';

    const shareText = `⚡ 과학 마스터 도감 ⚡\n[${unitInfo?.id}단원. ${unitInfo?.title}] 완료!\n학습 점수: ${score} / 10 문제 정답!${legendaryText}\n도감 수집도: ${unlockedCount}장 (${completionPercentage}% 완성)\n재미있는 퀴즈로 과학 개념을 마스터해보세요!`;

    navigator.clipboard.writeText(shareText).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-slide-up relative">
      {/* Epic Legendary Card Unlock Overlay */}
      {showLegendaryUnlock && legendaryCardId && (
        <CardUnlockAnim
          cardId={legendaryCardId}
          onContinue={() => setShowLegendaryUnlock(false)}
        />
      )}

      {/* Main Results Panel */}
      <div className="glass-panel p-6 md:p-10 border-cyan-500/20 text-center relative overflow-hidden bg-gradient-to-b from-[#0c1221] to-[#040710]">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,var(--color-neon-blue)_0%,transparent_70%)]" />

        {/* Header */}
        <div className="text-sm font-mono text-cyan-500 tracking-widest uppercase mb-1">
          UNIT CLEARANCE REPORT
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide mb-6">
          {unitInfo?.title} 완료!
        </h1>

        {/* Score Ring / Display */}
        <div className="relative w-44 h-44 mx-auto mb-6 flex flex-col items-center justify-center rounded-full border-4 border-cyan-500/10 shadow-[0_0_20px_rgba(0,229,255,0.05)]">
          <div className="absolute inset-0 rounded-full border-4 border-dashed border-cyan-400/40 animate-[spin_40s_infinite_linear]" />
          
          <div className="text-xs font-mono text-cyan-500 tracking-widest uppercase mb-1">
            SCORE
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black font-mono-numbers text-cyan-400 text-neon-glow">
              {score}
            </span>
            <span className="text-2xl text-gray-500 font-bold">/</span>
            <span className="text-2xl text-gray-400 font-bold font-mono-numbers">10</span>
          </div>

          <div className="text-xs text-gray-400 mt-1 font-bold">
            {score === 10 ? '👑 PERFECT! 👑' : score >= 8 ? '🌟 EXCELLENT!' : score >= 5 ? '👍 GOOD JOB!' : '📚 RETRY & LEARN'}
          </div>
        </div>

        {/* High Score Celebration Banner */}
        {isNewHighScore && (
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full font-bold text-sm tracking-wide mb-8 animate-bounce shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Award className="w-5 h-5 fill-current" />
            최고 기록 경신! (NEW HIGH SCORE)
          </div>
        )}

        {/* Newly Unlocked Cards Container */}
        <div className="glass-panel p-6 border-cyan-500/10 bg-gray-950/40 text-left mb-8 max-w-xl mx-auto">
          <h3 className="text-sm font-mono text-cyan-400 tracking-widest uppercase mb-4 flex items-center gap-2 border-b border-cyan-500/10 pb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            획득한 도감 카드 (Card Rewards)
          </h3>

          <div className="space-y-4">
            {/* Regular Card Rewards */}
            {newlyUnlockedCardIds.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {newlyUnlockedCardIds.map((id) => {
                  const card = cards.find((c) => c.id === id);
                  if (!card) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 p-3 bg-cyan-950/10 border border-cyan-500/20 rounded-lg hover:border-cyan-400 transition-colors"
                    >
                      <span className="text-3xl">{card.image}</span>
                      <div>
                        <div className="text-sm font-black text-white">{card.name}</div>
                        <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">
                          {card.rarity || 'common'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm font-medium">
                이번 퀴즈에서 새로 해금한 일반 카드가 없습니다. (이미 다 해금했거나 정답을 맞추지 못했습니다.)
              </p>
            )}

            {/* Legendary Complete Reward */}
            {legendaryCard && (
              <div className="border-t border-cyan-500/10 pt-4 mt-4">
                <div className="text-xs font-mono text-amber-400 tracking-widest uppercase mb-2">
                  UNIT COMPLETION REWARD (전설 진화 완료 보상)
                </div>
                <div className="flex items-center gap-4 p-3 bg-amber-950/20 border border-amber-500/40 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <span className="text-5xl animate-pulse">{legendaryCard.image}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-amber-400">{legendaryCard.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black border border-amber-500/30 bg-amber-950/30 text-amber-400 tracking-widest uppercase">
                        LEGENDARY
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      퀴즈 10문제를 모두 풀어 단원을 클리어하여 해금된 전설의 생물/현상 카드입니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wrong Answer Review Banner */}
        {unitWrongAnswerIds.length > 0 && onReviewWrongAnswers && (
          <div className="mb-6 p-4 bg-orange-950/30 border border-orange-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 max-w-xl mx-auto">
            <div className="text-left">
              <p className="text-orange-300 font-black text-sm">📝 이 단원 오답이 {unitWrongAnswerIds.length}문제 있어요</p>
              <p className="text-gray-400 text-xs mt-0.5">오답 복습으로 완전히 이해하고 넘어가세요!</p>
            </div>
            <button
              onClick={() => { gameAudio.playClick(); onReviewWrongAnswers(unitWrongAnswerIds); }}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-lg transition-all touch-target text-sm"
            >
              <BookOpen className="w-4 h-4" />
              오답 복습하기
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center max-w-md mx-auto">
          <button
            onClick={() => {
              console.log("UnitComplete: '다시 도전하기' clicked");
              try {
                gameAudio.playClick();
              } catch (e) {
                console.warn("Audio feedback error:", e);
              }
              try {
                onRestart();
              } catch (e) {
                console.error("onRestart callback error:", e);
              }
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-cyan-950/40 border border-cyan-400/40 hover:border-cyan-400 hover:bg-cyan-950/80 text-cyan-300 hover:text-white font-extrabold text-lg rounded-xl transition-all touch-target"
          >
            <RefreshCw className="w-5 h-5" />
            다시 도전하기
          </button>

          {onGoLobby && (
            <button
              onClick={() => {
                console.log("UnitComplete: '로비로 이동' clicked");
                try {
                  gameAudio.playClick();
                } catch (e) {
                  console.warn("Audio feedback error:", e);
                }
                try {
                  onGoLobby();
                } catch (e) {
                  console.error("onGoLobby callback error:", e);
                }
              }}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-purple-950/40 border border-purple-400/40 hover:border-purple-400 hover:bg-purple-950/80 text-purple-300 hover:text-white font-extrabold text-lg rounded-xl transition-all touch-target"
            >
              <MapPin className="w-5 h-5" />
              로비로 이동
            </button>
          )}
        </div>

        {/* Share & Teacher Code Section */}
        <div className="mt-8 border-t border-cyan-500/10 pt-6 max-w-md mx-auto space-y-4">
          <button
            onClick={() => {
              console.log("UnitComplete: '학습 결과 복사하여 공유하기' clicked");
              try {
                handleShare();
              } catch (e) {
                console.error("handleShare error:", e);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-950 hover:bg-cyan-950/30 border border-gray-800 hover:border-cyan-500/30 text-gray-300 hover:text-cyan-400 rounded-lg transition-all text-base touch-target font-bold"
          >
            <Share2 className="w-5 h-5" />
            학습 결과 복사하여 공유하기 (SNS)
          </button>
          
          {showCopied && (
            <div className="text-xs text-emerald-400 font-mono animate-pulse flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              클립보드에 SNS 공유 텍스트가 복사되었습니다!
            </div>
          )}

          <div className="border border-dashed border-cyan-500/20 bg-cyan-950/5 p-4 rounded-lg space-y-2">
            <span className="block text-[10px] font-mono text-cyan-400 uppercase tracking-widest text-left font-bold">
              // TEACHER IMPORT CODE (교사용 제출 코드)
            </span>
            <p className="text-[11px] text-gray-400 text-left leading-normal">
              선생님께 퀴즈 응답 데이터를 제출하려면 아래 코드를 복사하여 선생님 대시보드에 붙여넣으세요.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={resultCode}
                className="flex-1 bg-gray-950 border border-gray-800 text-[10px] text-cyan-400 font-mono px-3 py-2 rounded focus:outline-none"
              />
              <button
                onClick={() => {
                  console.log("UnitComplete: '교사용 제출 코드 복사' clicked");
                  try {
                    gameAudio.playClick();
                  } catch (e) {
                    console.warn("Audio feedback error:", e);
                  }
                  try {
                    navigator.clipboard.writeText(resultCode).then(() => {
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }).catch((err) => {
                      console.error("Clipboard API write failed:", err);
                    });
                  } catch (e) {
                    console.error("Clipboard copy error:", e);
                  }
                }}
                className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400 font-bold text-xs rounded transition-all touch-target"
              >
                복사
              </button>
            </div>
            {codeCopied && (
              <div className="text-xs text-emerald-400 font-mono animate-pulse flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                교사용 제출 코드가 클립보드에 복사되었습니다!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
