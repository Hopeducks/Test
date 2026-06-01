// ── 아바타 / 코스튬 ──────────────────────────────────
export interface AvatarConfig {
  bodyColor: string               // hex
  outfit: CostumeId | null        // 의상
  accessory: CostumeId | null     // 악세서리 (안경, 모자 등)
  vehicle: CostumeId | null       // 탈 것 (로켓, 비행접시, 잠수함)
  hat?: CostumeId | null           // 모자
  badge?: CostumeId | null         // 배지
  title?: CostumeId | null         // 칭호
  emote?: EmoteId | null           // 현재 감정 표현
  petId?: string | null            // 펫 도감 카드 ID
}

export type CostumeId = string    // e.g. 'outfit_scientist', 'vehicle_rocket'
export type EmoteId = 'wave' | 'cheer' | 'think' | 'celebrate' | 'sad'

export interface CostumeItem {
  id: CostumeId
  name: string                    // 한국어
  category: 'outfit' | 'accessory' | 'vehicle' | 'hat' | 'badge' | 'pet' | 'title'
  rarity: 'common' | 'rare' | 'legendary'
  unlockCondition: UnlockCondition
  price?: number                  // 코인으로 구매 가능한 경우
  spriteKey: string               // Phaser texture key
  stats?: {
    hp?: number;
    attack?: number;
    defense?: number;
  }
}

export type UnlockCondition =
  | { type: 'achievement'; achievementId: string }
  | { type: 'unit_complete'; unitId: number }
  | { type: 'level'; level: number }
  | { type: 'purchase'; coinCost: number }
  | { type: 'default' }

// ── 플레이어 ─────────────────────────────────────────
export interface Player {
  id: string
  nickname: string
  sessionCode: string
  avatar: AvatarConfig
  position: { x: number; y: number }
  xp: number
  level: number
  coins: number
  unlockedCards: string[]
  unlockedCostumes: CostumeId[]
  achievements: string[]
}

// ── 게임 세션 ─────────────────────────────────────────
export interface GameSession {
  code: string
  status: 'lobby' | 'quiz' | 'battle' | 'raid' | 'ended'
  activeUnitId: number | null
  bossHp: number
  bossMaxHp: number
  battlePairs: BattlePair[]
  settings: SessionSettings
}

export interface SessionSettings {
  timer: boolean
  timerSeconds: number            // 기본 30초
  battleModeEnabled: boolean
  raidEnabled: boolean
  allowChat: boolean
}

export interface BattlePair {
  p1Id: string
  p2Id: string
  status: 'waiting' | 'fighting' | 'done'
  winnerId?: string
}

// ── 메타버스 좌표 / 이동 ─────────────────────────────
export interface PlayerPosition {
  playerId: string
  x: number
  y: number
  direction: 'up' | 'down' | 'left' | 'right' | 'idle'
  animFrame: number               // Phaser 스프라이트 프레임
  emote: EmoteId | null
}

// ── 퀴즈 ─────────────────────────────────────────────
interface BaseQuestion {
  id: string;
  unitId: number;
  question: string;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  cardReward?: string;
}

export interface MCQuestion extends BaseQuestion {
  type?: 'mc';   // optional for backward compat with existing 320 questions
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
}

export interface OXQuestion extends BaseQuestion {
  type: 'ox';
  correctIndex: 0 | 1;  // 0=O(맞다), 1=X(틀리다)
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  pairs: { left: string; right: string }[];
}

export interface ShortQuestion extends BaseQuestion {
  type: 'short';
  correctAnswer: string;       // 대표 정답 (설명 표시용)
  acceptedAnswers: string[];   // 채점 키워드 배열
}

export type Question = MCQuestion | OXQuestion | MatchingQuestion | ShortQuestion;

// ── 퀴즈 타입 가드 ───────────────────────────────────
export function isMCQuestion(q: Question): q is MCQuestion {
  return (q as MCQuestion).options !== undefined;
}
export function isOXQuestion(q: Question): q is OXQuestion { return q.type === 'ox'; }
export function isMatchingQuestion(q: Question): q is MatchingQuestion { return q.type === 'matching'; }
export function isShortQuestion(q: Question): q is ShortQuestion { return q.type === 'short'; }

// ── 카드 ─────────────────────────────────────────────
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Card {
  id: string
  name: string
  emoji: string
  rarity: CardRarity
  unitId: number
  description: string
  power: number                   // 배틀에서 사용하는 공격력 (5~100)
  type: 'attack' | 'defense' | 'special'
  specialEffect?: string          // legendary 카드 특수 효과 설명
}

// ── 배틀 ─────────────────────────────────────────────
export interface BattleState {
  sessionId: string
  player1: BattlePlayer
  player2: BattlePlayer
  currentTurn: string             // playerId
  round: number
  maxRounds: number
  status: 'selecting' | 'quiz' | 'resolving' | 'done'
  selectedCards: Record<string, string>   // playerId → cardId
  quizQuestion?: Question
}

export interface BattlePlayer {
  id: string
  nickname: string
  hp: number
  maxHp: number
  deck: Card[]                    // 선택한 카드 3장
  avatar: AvatarConfig
}

// ── 보스 레이드 ──────────────────────────────────────
export interface BossRaidState {
  bossId: string
  bossName: string
  bossHp: number
  bossMaxHp: number
  phase: 1 | 2 | 3                // HP 구간별 페이즈 변화
  activeQuestion?: Question
  contributions: Record<string, number>   // playerId → 총 데미지
  timerMs: number                 // 현재 문제 남은 시간
}

// ── 업적 ─────────────────────────────────────────────
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: AchievementCondition
  reward: AchievementReward
}

export type AchievementCondition =
  | { type: 'questions_correct'; count: number }
  | { type: 'unit_complete'; unitId: number }
  | { type: 'battles_won'; count: number }
  | { type: 'boss_damage'; total: number }
  | { type: 'streak'; count: number }
  | { type: 'level'; level: number }

export type AchievementReward =
  | { type: 'costume'; costumeId: CostumeId }
  | { type: 'coins'; amount: number }
  | { type: 'card'; cardId: string }
  | { type: 'title'; titleText: string }

// ── 교사 대시보드 ────────────────────────────────────
export interface TeacherDashboardData {
  session: GameSession
  players: PlayerDashboardEntry[]
  realtimeEvents: DashboardEvent[]
}

export interface PlayerDashboardEntry {
  player: Player
  currentActivity: 'lobby' | 'quiz' | 'battle' | 'raid' | 'idle'
  correctRate: number             // 0~1
  recentAnswers: { questionId: string; correct: boolean; timestamp: string }[]
  battleRecord: { wins: number; losses: number }
  position: PlayerPosition
  avatarEmoji?: string
}

export interface DashboardEvent {
  type: 'card_unlocked' | 'battle_start' | 'battle_end' | 'boss_damage' | 'achievement' | 'quiz_answer' | 'player_join'
  playerId: string
  nickname: string
  detail: string
  timestamp: string
  isCorrect?: boolean
}

// ── 하위 호환성용 정의 (기존 UI 및 퀴즈 컴포넌트용) ─────────────────────────
export interface CollectibleCard {
  id: string
  unitId: number
  name: string
  image: string                   // Emoji 또는 CSS 아트 코드 (호환용)
  emoji?: string                  // 신규 규격
  rarity?: CardRarity
  description: string
  hp?: number                     // 카드 배틀용 체력 (기본 100)
  attack?: number                 // 카드 배틀용 공격력 (기본 20)
  power?: number                  // 신규 규격
  type?: 'stone' | 'light' | 'solution' | 'body' | 'eco' | 'weather' | 'motion' | 'acid' | 'attack' | 'defense' | 'special'
  specialEffect?: string
}

export interface ItemInventory {
  potion: number
  magnifier: number
  watch: number
  superBall?: number
  ultraBall?: number
  masterBall?: number
  potionHyper?: number
  potionMax?: number
  revive?: number
}

export interface GameProgress {
  unlockedCardIds: string[]
  completedUnits: number[]        // 완료한 단원 ID 목록 (1~8)
  unitHighScores: Record<number, number> // 단원별 최고 퀴즈 점수 (0 ~ 100)
  coins?: number                  // 현재 잔여 코인
  claimedQuestIds?: string[]      // 이미 수령 완료한 퀘스트 ID 목록
  items?: ItemInventory
  cardLevels?: Record<string, number>
  cardXps?: Record<string, number>
  trainerLevel?: number
  trainerXp?: number
  unlockedBadges?: string[]
  wrongAnswers?: string[]
  gymLeaderBeaten?: Record<number, boolean>
}

export interface StudentResponse {
  name: string
  avatar: string
  completedUnits: number[]
  unitScores: Record<number, number>
  unlockedCardsCount: number
  lastActive: string
  answers: Record<string, {
    questionId: string
    selectedOption: number
    isCorrect: boolean
    timeTakenMs: number
  }>
  unlockedCosmetics: string[]
  equippedCosmetics: {
    outfit: string
    expression: string
    accessory: string
    mount: string
    hat?: string
    petId?: string
    badge?: string
    title?: string
  }
  items?: ItemInventory
}

export interface SimulatedStudent {
  name: string
  avatar: string
  speedFactor: number
  accuracyFactor: number
  strengthUnitId?: number
  weaknessUnitId?: number
}

// ── 토너먼트 ─────────────────────────────────────────
export interface TournamentMatch {
  p1: string;          // 학생 이름
  p2: string;          // 학생 이름 또는 'BYE'
  winner: string | null;
  status: 'pending' | 'fighting' | 'done';
}

export interface TournamentRound {
  matches: TournamentMatch[];
}

export interface TournamentBracket {
  rounds: TournamentRound[];
  currentRoundIdx: number;
  champion: string | null;
}

export interface ClassroomSession {
  code?: string
  settings?: SessionSettings
  activeUnitId: number
  status: 'lobby' | 'playing' | 'ended' | 'tournament'
  currentQuestionIndex: number
  questionStartTime: number
  questionIds?: string[]
  battleMode: boolean
  tournament?: TournamentBracket;
  raidBossMaxHp?: number;
  timeAttackMode?: boolean;
  activeBattles?: {
    battleId: string;
    player1: string;
    player2: string;
    p1CardId: string;
    p2CardId: string;
    p1Hp: number;
    p2Hp: number;
    status: 'fighting' | 'p1_won' | 'p2_won';
    currentQuestionId: string;
    p1Answered: boolean;
    p2Answered: boolean;
    p1Correct?: boolean;
    p2Correct?: boolean;
  }[]
  students: {
    name: string
    avatar: string
    isSimulated: boolean
    currentScore: number
    currentStreak: number
    answeredCurrentQuestion: boolean
    lastAnswerCorrect?: boolean
    lastAnswerTime?: number
    x: number
    y: number
    equippedCosmetics?: {
      outfit: string
      expression: string
      accessory: string
      mount: string
      hat?: string
      petId?: string
      bodyColor?: string
    }
    items?: ItemInventory
    cp?: number
  }[]
}

export interface RealtimePlayerState {
  name: string
  avatar: string
  x: number
  y: number
  direction: 'up' | 'down' | 'left' | 'right'
  equippedCosmetics: {
    outfit: string
    expression: string
    accessory: string
    mount: string
    hat?: string
    petId?: string
    badge?: string
    title?: string
    bodyColor?: string
  }
  lastUpdated: number
  cp?: number
}

// ── Supabase Realtime 페이로드 타입 ──────────────────
export interface BroadcastPayload<T = Record<string, unknown>> {
  event: string;
  payload: T;
  type: 'broadcast';
}
export interface PresenceSyncPayload {
  [key: string]: RealtimePlayerState;
}

