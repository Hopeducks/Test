'use client';

import React, { useState, useMemo } from 'react';
import { useGameState } from '../../lib/game-state';
import { gameAudio } from '../../lib/audio';
import { Check, Sparkles, BookOpen, User, X } from 'lucide-react';

interface NpcQuestModalProps {
  npcName: string;
  onClose: () => void;
}

interface NpcQuestData {
  npcName: string;
  npcEmoji: string;
  unitId: number;
  questTitle: string;
  situation: string;
  keywords: string[];
  hint: string;
  rewardCoins: number;
}

const NPC_QUESTS: Record<string, NpcQuestData> = {
  '갈릴레이': {
    npcName: '갈릴레이',
    npcEmoji: '👴',
    unitId: 1,
    questTitle: '마당의 이상한 무늬 돌분석',
    situation: '우리 집 마당의 흙 속에서 나뭇잎 모양의 아주 오래된 돌무늬가 발견되었네! 이것이 대체 무엇이고, 어떻게 생겨난 돌인지 자세히 서술해 주게나.',
    keywords: ['화석', '지층', '퇴적'],
    hint: '돌 속에 찍힌 생물의 흔적은 \'화석\'이라고 부르고, 흙과 모래 같은 퇴적물이 단단한 \'지층\'이나 \'퇴적암\'으로 만들어지는 과정에서 형성된다는 것을 포함해 서술하세요.',
    rewardCoins: 80
  },
  '뉴턴': {
    npcName: '뉴턴',
    npcEmoji: '🧑‍🔬',
    unitId: 2,
    questTitle: '돋보기안경 확대경의 수수께끼',
    situation: '글씨를 확대하는 돋보기안경 렌즈를 깎고 있네. 빛이 볼록한 렌즈를 통과할 때 왜 물체가 커 보이는지 초등학생 수준에서 이해되게 원리를 설명해 줄 수 있나?',
    keywords: ['빛', '굴절'],
    hint: '볼록렌즈를 통과하면서 \'빛\'의 진행 방향이 꺾이는 현상인 \'굴절\'을 핵심 단어로 넣어 보세요.',
    rewardCoins: 85
  },
  '파스퇴르': {
    npcName: '파스퇴르',
    npcEmoji: '👨‍🔬',
    unitId: 3,
    questTitle: '사라진 물속 소금 분자 추적',
    situation: '비커에 담긴 맑은 물에 소금을 한 숟가락 넣고 유리막대로 저었더니 순식간에 보이지 않게 사라져 버렸네! 소금이 하늘나라로 간 것도 아닌데 어디로 숨었는지 설명해 주게.',
    keywords: ['용해', '용질', '용매'],
    hint: '소금이 물에 녹는 현상인 \'용해\'라는 단어와, 녹는 물질(\'용질\'), 녹이는 물질(\'용매\')의 관계를 바탕으로 서술하세요.',
    rewardCoins: 90
  },
  '나이팅게일': {
    npcName: '나이팅게일',
    npcEmoji: '👩‍⚕️',
    unitId: 4,
    questTitle: '계단 오를 때 쿵쾅거리는 몸',
    situation: '환자가 계단을 급하게 올라갔더니 숨이 헐떡이고 심장이 터질 것처럼 심하게 뛰기 시작했어. 폐(호흡)와 심장(순환)이 왜 서로 쿵짝을 맞추며 바빠지는 것인지 두 기관의 연관 구조를 말해줘.',
    keywords: ['산소', '심장', '순환'],
    hint: '몸 운동에 필요한 \'산소\'를 온몸의 근육에 공급하기 위해서, 가스 교환된 혈액을 \'심장\'이 빠르게 돌려보내는 \'순환\'의 연결 과정을 서술해 보세요.',
    rewardCoins: 95
  },
  '다윈': {
    npcName: '다윈',
    npcEmoji: '🧔',
    unitId: 5,
    questTitle: '숲속 새들이 사라지는 이유',
    situation: '숲의 일부 구역에 큰 공사를 해서 나무들을 다 베어 냈더니 곤충이 먼저 없어지더니 뒤따라 새들도 숲을 떠났네. 숲의 생물들이 도미노처럼 한꺼번에 무너져 내리는 이 과학적인 현상이 발생하는 메커니즘을 설명해 주게.',
    keywords: ['생태계', '평형', '먹이그물'],
    hint: '생물과 환경의 조화로운 상태인 \'생태계\'와 그 안의 얽히고설킨 생물 간의 사슬 관계인 \'먹이그물\'이 끊어져 \'평형\'이 깨진다는 내용을 담아보세요.',
    rewardCoins: 100
  },
  '베게너': {
    npcName: '베게너',
    npcEmoji: '🧥',
    unitId: 6,
    questTitle: '이른 아침 뿌연 안개의 원인',
    situation: '오늘 아침 기상 관측을 나가 보니 앞이 안 보일 정도로 짙은 안개와 함께 풀잎에 투명한 이슬들이 맺혀 있었소. 이것들은 도대체 하늘의 구름도 아닌데 땅 근처에서 어떻게 빚어진 것인지 원리를 알려주오.',
    keywords: ['수증기', '응결', '온도'],
    hint: '공기 중에 포함된 기체 상태의 \'수증기\'가 밤사이 \'온도\'가 내려감에 따라 액체 물방울로 변하는 \'응결\' 현상임을 밝혀 설명하세요.',
    rewardCoins: 100
  },
  '아인슈타인': {
    npcName: '아인슈타인',
    npcEmoji: '🧙',
    unitId: 7,
    questTitle: '하늘을 달리는 두 택배 드론',
    situation: '하늘에 똑같이 생긴 두 대의 택배 드론이 1km를 비행하고 있네. 어느 쪽 드론이 더 빨리 날아갔는지 알아내는 두 가지 비교 방법을 과학적으로 정의해 줄 수 있겠나?',
    keywords: ['시간', '거리', '속력'],
    hint: '같은 \'거리\'를 이동할 때는 걸린 \'시간\'을 비교하고, 혹은 일정한 시간 동안 이동한 드론의 거리를 통해 빠르기(\'속력\')를 구한다는 점을 서술하세요.',
    rewardCoins: 105
  },
  '퀴리 부인': {
    npcName: '퀴리 부인',
    npcEmoji: '👩‍🔬',
    unitId: 8,
    questTitle: '화학 약품 통의 산염기 중화 실험',
    situation: '붉은 양배추 즙을 넣은 묽은 염산 비커에 수산화나트륨 수용액을 한 방울씩 떨어뜨렸더니 붉은색이 보라색을 거쳐 초록색으로 변해갔어. 산성 수용액과 염기성 수용액을 섞을 때 일어나는 이 신기한 반응을 설명해주겠니?',
    keywords: ['중화', '성질', '반응'],
    hint: '산성과 염기성이 만나 서로의 특이한 \'성질\'을 잃어버리고 열과 물이 생기는 \'중화\' 작용 및 \'반응\'에 관해 언급해 주세요.',
    rewardCoins: 110
  }
};

export default function NpcQuestModal({ npcName, onClose }: NpcQuestModalProps) {
  const { getLocalPlayer, setLocalPlayer, progress, claimQuestReward } = useGameState();

  const quest = useMemo(() => {
    return NPC_QUESTS[npcName] || NPC_QUESTS['갈릴레이'];
  }, [npcName]);

  // 이미 최우수로 완료한 퀘스트인지 확인 (questId = 'npc_{npcName}')
  const questId = `npc_${quest.npcName}`;
  const isAlreadyClaimed = (progress.claimedQuestIds ?? []).includes(questId);

  // States
  const [answerText, setAnswerText] = useState('');
  const [result, setResult] = useState<{
    score: '최우수' | '우수' | '보통' | '미흡';
    scoreLabel: string;
    scoreColor: string;
    badgeEmoji: string;
    feedback: string;
  } | null>(null);

  const handleEvaluate = () => {
    if (!answerText.trim()) return;
    gameAudio.playClick();

    const lowerText = answerText.toLowerCase();
    
    // Count matching keywords
    let matchedCount = 0;
    const missingKeywords: string[] = [];

    quest.keywords.forEach(keyword => {
      // Allow partial matches (e.g. '퇴적' in '퇴적암' or '지층' in '지층과')
      if (lowerText.includes(keyword.toLowerCase())) {
        matchedCount++;
      } else {
        missingKeywords.push(keyword);
      }
    });

    // Score evaluation
    let score: '최우수' | '우수' | '보통' | '미흡' = '미흡';
    let scoreLabel = '노력 요함 🥉';
    let scoreColor = 'text-red-400 border-red-500/20 bg-red-950/5';
    let badgeEmoji = '❌';
    let feedback = '';

    if (matchedCount === quest.keywords.length) {
      score = '최우수';
      scoreLabel = '최우수 등급 🥇';
      scoreColor = 'text-yellow-400 border-yellow-500/30 bg-yellow-950/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      badgeEmoji = '🥇';
      feedback = isAlreadyClaimed
        ? '이미 이 퀘스트를 최우수로 완료했습니다! 보상은 최초 1회만 지급됩니다.'
        : '훌륭해요! 제시한 모든 과학 키워드를 정확하게 사용해 완벽한 과학적 답변을 서술했습니다. 대단해요!';

      if (!isAlreadyClaimed) {
        // claimQuestReward: claimedQuestIds에 기록 + 코인 지급 (중복 방지 내장)
        claimQuestReward(questId, quest.rewardCoins);
        gameAudio.playCatchSuccess();
      }

    } else if (matchedCount >= Math.ceil(quest.keywords.length / 2)) {
      score = '우수';
      scoreLabel = '우수 등급 🥈';
      scoreColor = 'text-cyan-400 border-cyan-500/20 bg-cyan-950/5';
      badgeEmoji = '🥈';
      feedback = `잘 서술했습니다! 다만 [${missingKeywords.join(', ')}] 키워드가 누락되었네요. 이를 포함하면 최우수 보상(코인 ${quest.rewardCoins}개)을 받을 수 있어요!`;

      // 우수 등급은 1회만 부분 코인 지급
      const partialQuestId = `${questId}_partial`;
      const alreadyPartial = (progress.claimedQuestIds ?? []).includes(partialQuestId);
      if (!alreadyPartial) {
        claimQuestReward(partialQuestId, Math.round(quest.rewardCoins * 0.6));
        gameAudio.playCatchSuccess();
      }

    } else if (matchedCount > 0) {
      score = '보통';
      scoreLabel = '보통 등급 🥉';
      scoreColor = 'text-amber-500 border-amber-500/10 bg-amber-950/5';
      badgeEmoji = '🥉';
      feedback = `기초 과학 사실을 잘 포착했습니다. 하지만 [${missingKeywords.join(', ')}] 같은 핵심 단어들이 빠져 설명의 전문성이 부족합니다. 힌트를 확인하고 보완해 보세요.`;
      gameAudio.playClick();

    } else {
      score = '미흡';
      scoreLabel = '노력 요함 💨';
      scoreColor = 'text-red-400 border-red-500/10 bg-red-950/5';
      badgeEmoji = '❌';
      feedback = `서술된 내용에 과학 교과 관련 핵심 단어(${quest.keywords.join(', ')})가 포함되어 있지 않습니다. 아래 힌트를 바탕으로 내용을 다시 가다듬어 보시기 바랍니다!`;
      gameAudio.playWrong();
    }

    setResult({
      score,
      scoreLabel,
      scoreColor,
      badgeEmoji,
      feedback
    });
  };

  const handleRetry = () => {
    gameAudio.playClick();
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl p-6 border-cyan-500/30 bg-gradient-to-b from-[#091122] to-[#040811] text-gray-100 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-cyan-400" />
            <h2 className="text-lg md:text-xl font-black text-cyan-400">마을 주민 NPC 과학 수행평가 서술 퀘스트</h2>
          </div>
          <button 
            onClick={() => { gameAudio.playClick(); onClose(); }}
            className="p-1 rounded bg-gray-950 border border-gray-900 hover:border-cyan-500 text-gray-500 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NPC Profile & Bubble */}
        <div className="flex items-start gap-4 mb-6 bg-cyan-950/15 border border-cyan-500/5 p-4 rounded-2xl shrink-0">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-4xl shrink-0 select-none">
            {quest.npcEmoji}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-wider block">// SCIENCE VILLAGER //</span>
              <span className="text-xs text-gray-500 font-bold bg-gray-900/80 px-2 py-0.5 rounded">UNIT {quest.unitId}</span>
            </div>
            <h3 className="text-sm font-black text-gray-100">{quest.npcName} 박사</h3>
            <p className="text-xs md:text-sm text-gray-250 italic leading-relaxed font-sans pt-1">
              &ldquo;{quest.situation}&rdquo;
            </p>
          </div>
        </div>

        {/* Results Screen */}
        {result ? (
          <div className="flex-1 space-y-6 py-4 animate-scale-up">
            
            {/* Grade card */}
            <div className={`p-5 rounded-2xl border text-center ${result.scoreColor}`}>
              <span className="text-6xl mb-2 block filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{result.badgeEmoji}</span>
              <h4 className="text-lg font-black">{result.scoreLabel}</h4>
              <p className="text-xs font-sans mt-2 max-w-md mx-auto leading-relaxed">
                {result.feedback}
              </p>
            </div>

            {/* Hint review area */}
            <div className="p-4 bg-gray-950/60 border border-gray-900 rounded-xl text-left">
              <span className="text-xs font-bold text-gray-400 block mb-1">💡 작성시 힌트 단어:</span>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">{quest.hint}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {result.score !== '최우수' && (
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white border border-gray-850 rounded-xl transition-all font-bold"
                >
                  답안 수정하기 (재조정)
                </button>
              )}
              
              <button
                onClick={() => { gameAudio.playClick(); onClose(); }}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all"
              >
                퀘스트 대화 종료
              </button>
            </div>

          </div>
        ) : (
          /* Writing Area Screen */
          <div className="flex-1 flex flex-col gap-4 animate-slide-up">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">
                ✍️ 답변 서술란 (자유롭게 문장으로 서술해 주세요)
              </label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="여기에 생각한 과학적 고민에 대한 해결책이나 설명을 작성해 주세요..."
                className="w-full h-32 p-4 bg-gray-950/80 border border-gray-850 focus:border-cyan-400/60 rounded-xl outline-none resize-none font-sans text-xs md:text-sm text-gray-150 leading-relaxed transition-all focus:shadow-[0_0_10px_rgba(6,182,212,0.05)]"
              />
            </div>

            {/* Hint Box */}
            <div className="p-3 bg-cyan-950/5 border border-cyan-500/10 rounded-xl text-left">
              <span className="text-[11px] font-bold text-cyan-400 block mb-1">💡 평가 가이드 힌트:</span>
              <p className="text-[10px] text-gray-500 leading-relaxed font-sans">{quest.hint}</p>
            </div>

            {/* Submit buttons */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => { gameAudio.playClick(); onClose(); }}
                className="flex-1 py-3.5 bg-gray-950 hover:bg-gray-900 border border-gray-850 text-gray-400 rounded-xl transition-all"
              >
                나중에 풀기
              </button>
              <button
                disabled={!answerText.trim()}
                onClick={handleEvaluate}
                className={`flex-1 py-3.5 rounded-xl font-black transition-all ${
                  answerText.trim()
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-md'
                    : 'bg-gray-900 text-gray-600 border border-gray-950 cursor-not-allowed'
                }`}
              >
                주민 답변 제출 & 채점받기
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
