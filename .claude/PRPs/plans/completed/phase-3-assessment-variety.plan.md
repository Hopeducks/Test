# Plan: Phase 3 — 평가 다양화 (Assessment Variety)

## Summary
객관식(MC) 외에 OX·매칭·단답 3가지 문제 형식을 추가한다. `Question` 타입을 판별 공용체(discriminated union)로 확장하고, 각 타입의 렌더러 컴포넌트를 `components/ui/quiz/`에 생성한 뒤, `QuizScreen.tsx`가 `question.type`에 따라 렌더러를 전환하도록 수정한다.

## User Story
As a 학생,
I want OX 버튼 클릭, 단어 매칭, 단답 입력 등 다양한 방식으로 퀴즈에 응답하고 싶다,
So that 단순 4지선다보다 깊이 있게 과학 개념을 복습하고 성취감을 얻을 수 있다.

## Problem → Solution
기존 `Question` 인터페이스가 `options: [string,string,string,string]` + `correctIndex: 0|1|2|3`로 고정 → 모든 320문항이 4지선다만 가능.  
→ `type` 필드를 추가한 판별 공용체로 확장하고, 타입별 렌더러 컴포넌트와 샘플 문항을 추가해 퀴즈 플로우에서 정상 채점·카드 연동이 동작하도록 한다.

## Metadata
- **Complexity**: Medium-Large
- **Source PRD**: `.claude/PRPs/prds/science-master-metaverse-overhaul.prd.md`
- **PRD Phase**: Phase 3 — 평가 다양화
- **Estimated Files**: 10~12개

---

## UX Design

### Before
```
퀴즈 화면:
  문제 텍스트
  [ A. 선택지1 ]  ← 항상 4지선다
  [ B. 선택지2 ]
  [ C. 선택지3 ]
  [ D. 선택지4 ]
```

### After
```
퀴즈 화면 (type에 따라 렌더러 전환):

type='mc'  : 기존 A/B/C/D 4지선다 (변경 없음)

type='ox'  : 큼지막한 두 버튼
  [  ⭕ 맞다  ]  [  ❌ 틀리다  ]

type='matching': 좌측 개념 목록 + 우측 설명 목록
  좌측 항목 클릭 → 하이라이트 → 우측 항목 클릭 → 연결
  모든 쌍 매칭 완료 후 [채점하기] 버튼

type='short': 텍스트 입력창
  [빈칸 입력______] [제출]
  (acceptedAnswers 키워드 배열 중 하나 포함 시 정답)
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| 문제 렌더링 | 항상 4지선다 | type별 렌더러 | QuizScreen이 dispatcher 역할 |
| 타이머 | 30초 카운트다운 | 타입별 동일 사용 | matching은 60초 권장 |
| 채점 | submitQuizAnswer(playerId, qId, idx) | 타입별 isCorrect 계산 후 동일 API | 클라이언트 채점 |
| 카드 보상 | correctIndex 일치 시 | isCorrect===true 시 동일 | 연동 그대로 |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `types/index.ts` | 91-100 | 현재 Question 인터페이스 — 확장 기준점 |
| P0 | `components/ui/QuizScreen.tsx` | 364-460 | handleOptionClick — 채점·카드 연동 흐름 |
| P0 | `components/ui/QuizScreen.tsx` | 601-944 | 렌더러 구조 — 교체할 부분 |
| P1 | `data/questions.ts` | 1-10 | import 패턴, getUnitQuestions 위치 확인 |
| P1 | `lib/supabase/edge-functions.ts` | 전체 | submitQuizAnswer 시그니처 및 동작 |
| P2 | `components/ui/design-system/Button.tsx` | 전체 | 신규 버튼 재사용 패턴 |

## External Documentation
No external research needed — feature uses established internal patterns.

---

## Patterns to Mirror

### QUESTION_TYPE_CURRENT
```typescript
// SOURCE: types/index.ts:91-100
export interface Question {
  id: string
  unitId: number
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
  difficulty?: 'easy' | 'medium' | 'hard'
  cardReward?: string
}
```

### QUESTION_DATA_PATTERN
```typescript
// SOURCE: data/questions.ts:1-12
import { Question } from '../types';
export const questions: Question[] = [
  {
    id: 'u1_q1',
    unitId: 1,
    question: '지층이 아래층부터...',
    options: ['...', '...', '...', '...'],
    correctIndex: 1,
    explanation: '...',
    cardReward: 'u1_c1'
  },
```

### QUIZ_ANSWER_HANDLER
```typescript
// SOURCE: components/ui/QuizScreen.tsx:364-460 (handleOptionClick 핵심 부분)
const handleOptionClick = async (optionIndex: number) => {
  if (isAnswered || loading || !player) return;
  if (timerRef.current) clearInterval(timerRef.current);
  setSelectedOption(optionIndex);
  setLoading(true);
  const currentQuestion = questionsList[currentIndex];
  try {
    const response = await submitQuizAnswer(player.id, currentQuestion.id, optionIndex);
    setIsAnswered(true);
    setLoading(false);
    broadcastQuizAnswer(currentQuestion.id, response.correct, response.cardUnlocked);
    if (response.correct) { /* XP, card unlock, flash */ }
    else { /* streak reset, wrong flash */ }
    setExplanationVisible(true);
    setTimeout(() => { setFlashType(null); /* auto-advance */ }, 800);
  } catch (error) { ... }
};
```

### RENDERER_COMPONENT_PATTERN
```tsx
// Pattern: renderer component receives question + onAnswer callback
// SOURCE: 신규 패턴 (기존 컴포넌트 inline 렌더 참조)
interface RendererProps {
  question: OXQuestion;           // 타입별 구체 Question
  isAnswered: boolean;
  theme: UnitTheme;
  onAnswer: (isCorrect: boolean) => void;
}
export default function OXRenderer({ question, isAnswered, theme, onAnswer }: RendererProps) { ... }
```

### UNIT_THEME_USAGE
```tsx
// SOURCE: components/ui/QuizScreen.tsx:612-613
const theme = getUnitTheme(unitId);
// theme.btnStyle, theme.btnCorrect, theme.btnIncorrect 으로 버튼 스타일 결정
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `types/index.ts` | UPDATE | Question를 판별 공용체로 확장 |
| `data/questions-ox.ts` | CREATE | OX 샘플 문항 16개 (단원당 2개) |
| `data/questions-matching.ts` | CREATE | 매칭 샘플 문항 8개 (단원당 1개) |
| `data/questions-short.ts` | CREATE | 단답 샘플 문항 8개 (단원당 1개) |
| `data/questions.ts` | UPDATE | getUnitQuestions가 새 타입 포함하도록 |
| `components/ui/quiz/OXRenderer.tsx` | CREATE | OX 렌더러 |
| `components/ui/quiz/MatchingRenderer.tsx` | CREATE | 매칭 렌더러 |
| `components/ui/quiz/ShortAnswerRenderer.tsx` | CREATE | 단답 렌더러 |
| `components/ui/quiz/index.ts` | CREATE | 배럴 export |
| `components/ui/QuizScreen.tsx` | UPDATE | type dispatcher 추가 (기존 MC 로직 최소 변경) |

## NOT Building
- 기존 320개 MC 문항 변환 — 신규 타입 문항만 추가 (Phase 6 콘텐츠 단계에서 전환)
- 교사 대시보드 루브릭 UI — Phase 7 스코프
- 드래그앤드롭 매칭 — 클릭 기반 매칭만 (Phase 5 게임모드 개선에서 UX 강화 가능)
- AI 채점 — 키워드 배열 매칭만
- 배틀/레이드에서 새 문제 타입 사용 — Phase 5 스코프

---

## Step-by-Step Tasks

### Task 1: types/index.ts — Question 판별 공용체 확장
- **ACTION**: 기존 `Question` 인터페이스를 `BaseQuestion` + 타입별 인터페이스 + `Question` 공용체로 재정의
- **IMPLEMENT**:
  ```typescript
  // 기존 Question 인터페이스를 아래로 교체
  interface BaseQuestion {
    id: string;
    unitId: number;
    question: string;
    explanation: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    cardReward?: string;
  }

  export interface MCQuestion extends BaseQuestion {
    type: 'mc';
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
    acceptedAnswers: string[];   // 채점 키워드 배열 (normalize 후 포함 체크)
  }

  export type Question = MCQuestion | OXQuestion | MatchingQuestion | ShortQuestion;
  ```
- **GOTCHA**: 기존 320문항 데이터에 `type: 'mc'` 필드가 없음 → `type` 필드가 없으면 MC로 간주하는 타입 가드 필요. 아래 타입 가드를 같은 파일에 추가:
  ```typescript
  export function isMCQuestion(q: Question): q is MCQuestion {
    return q.type === 'mc' || !('type' in q);
  }
  export function isOXQuestion(q: Question): q is OXQuestion { return q.type === 'ox'; }
  export function isMatchingQuestion(q: Question): q is MatchingQuestion { return q.type === 'matching'; }
  export function isShortQuestion(q: Question): q is ShortQuestion { return q.type === 'short'; }
  ```
- **GOTCHA 2**: 기존 `data/questions.ts`의 320개 문항은 `MCQuestion` 타입으로 명시적으로 cast가 필요할 수 있음 → `data/questions.ts` 파일 상단의 `questions: Question[]`을 `MCQuestion[]`으로 변경하거나 `as MCQuestion[]` 처리
- **VALIDATE**: `npx tsc --noEmit` 통과 — BattleState.quizQuestion, BossRaidState.activeQuestion 등 Question 참조 모두 공용체로 호환 확인

### Task 2: data/questions-ox.ts — OX 문항 생성
- **ACTION**: 8개 단원에 각 2개, 총 16개 OX 문항 파일 생성
- **IMPLEMENT**:
  ```typescript
  import { OXQuestion } from '../types';

  export const oxQuestions: OXQuestion[] = [
    {
      id: 'u1_ox1',
      unitId: 1,
      type: 'ox',
      question: '퇴적암은 화성암보다 더 높은 온도에서 만들어진다.',
      correctIndex: 1,  // X(틀리다)
      explanation: '퇴적암은 높은 온도가 아닌 퇴적물의 압력과 굳음으로 만들어집니다. 화성암이 마그마에서 만들어집니다.',
      difficulty: 'easy',
      cardReward: 'u1_c1',
    },
    {
      id: 'u1_ox2',
      unitId: 1,
      type: 'ox',
      question: '화석은 지층이 쌓인 순서를 알려주어 지질 시대 구분에 도움을 준다.',
      correctIndex: 0,  // O(맞다)
      explanation: '표준 화석은 특정 지질 시대를 나타내므로 지층의 나이와 환경을 알아내는 데 사용됩니다.',
      difficulty: 'easy',
    },
    // 단원 2~8 각 2개씩 추가 (아래 패턴으로)
    {
      id: 'u2_ox1', unitId: 2, type: 'ox',
      question: '빛은 진공에서도 전달된다.',
      correctIndex: 0,
      explanation: '빛은 전자기파이므로 매질 없이 진공에서도 전달됩니다.',
      difficulty: 'easy',
    },
    {
      id: 'u2_ox2', unitId: 2, type: 'ox',
      question: '모든 물체는 빛을 반사한다.',
      correctIndex: 0,
      explanation: '우리가 물체를 볼 수 있는 것은 물체가 빛을 반사하기 때문입니다.',
      difficulty: 'easy',
    },
    {
      id: 'u3_ox1', unitId: 3, type: 'ox',
      question: '설탕을 물에 녹이면 설탕이 사라진다.',
      correctIndex: 1,
      explanation: '설탕은 물에 녹아도 없어지지 않고 용액 속에 고르게 퍼져 있습니다.',
      difficulty: 'easy',
    },
    {
      id: 'u3_ox2', unitId: 3, type: 'ox',
      question: '용질의 양이 많을수록 용액의 농도가 높아진다.',
      correctIndex: 0,
      explanation: '같은 양의 용매에 용질이 많이 녹을수록 농도가 높아집니다.',
      difficulty: 'medium',
    },
    {
      id: 'u4_ox1', unitId: 4, type: 'ox',
      question: '폐는 산소와 이산화탄소를 교환하는 기관이다.',
      correctIndex: 0,
      explanation: '폐의 폐포에서 산소를 혈액으로 넣고 이산화탄소를 내보내는 기체 교환이 일어납니다.',
      difficulty: 'easy',
    },
    {
      id: 'u4_ox2', unitId: 4, type: 'ox',
      question: '소화 기관에는 위, 소장, 대장이 포함된다.',
      correctIndex: 0,
      explanation: '소화 기관은 음식물이 이동하며 소화되는 기관으로 위, 소장, 대장이 모두 포함됩니다.',
      difficulty: 'easy',
    },
    {
      id: 'u5_ox1', unitId: 5, type: 'ox',
      question: '먹이 사슬에서 생산자는 동물이다.',
      correctIndex: 1,
      explanation: '생산자는 광합성으로 스스로 양분을 만드는 식물입니다. 동물은 소비자입니다.',
      difficulty: 'easy',
    },
    {
      id: 'u5_ox2', unitId: 5, type: 'ox',
      question: '생태계에서 분해자는 죽은 생물의 유기물을 무기물로 분해한다.',
      correctIndex: 0,
      explanation: '세균과 곰팡이 같은 분해자는 죽은 생물을 무기물로 분해하여 물질 순환에 기여합니다.',
      difficulty: 'medium',
    },
    {
      id: 'u6_ox1', unitId: 6, type: 'ox',
      question: '구름은 수증기가 응결되어 만들어진 작은 물방울이나 얼음 알갱이의 집합이다.',
      correctIndex: 0,
      explanation: '수증기가 차가운 공기를 만나 응결되면 작은 물방울이나 얼음 알갱이로 변해 구름을 형성합니다.',
      difficulty: 'easy',
    },
    {
      id: 'u6_ox2', unitId: 6, type: 'ox',
      question: '기온이 높을수록 포화 수증기량이 적어진다.',
      correctIndex: 1,
      explanation: '기온이 높을수록 공기가 더 많은 수증기를 품을 수 있어 포화 수증기량이 증가합니다.',
      difficulty: 'medium',
    },
    {
      id: 'u7_ox1', unitId: 7, type: 'ox',
      question: '속력은 이동 거리를 걸린 시간으로 나눈 값이다.',
      correctIndex: 0,
      explanation: '속력(m/s) = 이동 거리(m) ÷ 걸린 시간(s) 입니다.',
      difficulty: 'easy',
    },
    {
      id: 'u7_ox2', unitId: 7, type: 'ox',
      question: '무거운 물체는 항상 가벼운 물체보다 빠르게 떨어진다.',
      correctIndex: 1,
      explanation: '공기 저항이 없을 때 무게와 관계없이 모든 물체는 같은 속도로 떨어집니다(자유 낙하).',
      difficulty: 'medium',
    },
    {
      id: 'u8_ox1', unitId: 8, type: 'ox',
      question: '산은 리트머스 종이를 파란색에서 빨간색으로 변화시킨다.',
      correctIndex: 0,
      explanation: '산성 용액은 파란색 리트머스 종이를 빨간색으로 변화시킵니다.',
      difficulty: 'easy',
    },
    {
      id: 'u8_ox2', unitId: 8, type: 'ox',
      question: '염기는 신맛이 나고 금속과 반응하면 수소 기체를 발생시킨다.',
      correctIndex: 1,
      explanation: '신맛과 금속과 수소 기체 반응은 산의 특성입니다. 염기는 쓴맛이 나고 미끌거리는 성질이 있습니다.',
      difficulty: 'medium',
    },
  ];
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 3: data/questions-matching.ts — 매칭 문항 생성
- **ACTION**: 단원당 1개, 총 8개 매칭 문항 파일 생성
- **IMPLEMENT**:
  ```typescript
  import { MatchingQuestion } from '../types';

  export const matchingQuestions: MatchingQuestion[] = [
    {
      id: 'u1_m1', unitId: 1, type: 'matching',
      question: '다음 퇴적암과 그 특징을 올바르게 연결하세요.',
      pairs: [
        { left: '이암', right: '고운 진흙이 굳어진 암석' },
        { left: '사암', right: '모래가 굳어진 까칠까칠한 암석' },
        { left: '역암', right: '자갈이 포함된 퇴적암' },
      ],
      explanation: '퇴적암은 구성 알갱이 크기에 따라 이암(진흙), 사암(모래), 역암(자갈)으로 나눕니다.',
      difficulty: 'medium',
    },
    {
      id: 'u2_m1', unitId: 2, type: 'matching',
      question: '빛의 성질과 관련된 개념을 올바르게 연결하세요.',
      pairs: [
        { left: '반사', right: '빛이 물체 표면에서 되돌아오는 현상' },
        { left: '굴절', right: '빛이 다른 물질로 넘어가며 방향이 바뀌는 현상' },
        { left: '흡수', right: '빛이 물체에 들어가 에너지로 변하는 현상' },
      ],
      explanation: '반사·굴절·흡수는 빛이 물체와 만날 때 일어나는 세 가지 기본 현상입니다.',
      difficulty: 'medium',
    },
    {
      id: 'u3_m1', unitId: 3, type: 'matching',
      question: '용액 관련 용어를 올바르게 연결하세요.',
      pairs: [
        { left: '용매', right: '다른 물질을 녹이는 액체' },
        { left: '용질', right: '용매에 녹는 물질' },
        { left: '용액', right: '용매와 용질이 고르게 섞인 혼합물' },
      ],
      explanation: '소금물에서 물=용매, 소금=용질, 소금물=용액입니다.',
      difficulty: 'easy',
    },
    {
      id: 'u4_m1', unitId: 4, type: 'matching',
      question: '우리 몸의 기관과 기능을 올바르게 연결하세요.',
      pairs: [
        { left: '심장', right: '혈액을 온몸으로 순환시킨다' },
        { left: '폐', right: '산소와 이산화탄소를 교환한다' },
        { left: '위', right: '소화액으로 음식물을 분해한다' },
      ],
      explanation: '각 기관은 고유한 기능을 담당하며 서로 협력하여 생명을 유지합니다.',
      difficulty: 'medium',
    },
    {
      id: 'u5_m1', unitId: 5, type: 'matching',
      question: '먹이 사슬의 구성원과 역할을 연결하세요.',
      pairs: [
        { left: '생산자', right: '광합성으로 스스로 양분을 만든다' },
        { left: '소비자', right: '다른 생물을 먹어 양분을 얻는다' },
        { left: '분해자', right: '죽은 생물을 무기물로 분해한다' },
      ],
      explanation: '생태계는 생산자·소비자·분해자가 유기적으로 연결되어 물질을 순환시킵니다.',
      difficulty: 'easy',
    },
    {
      id: 'u6_m1', unitId: 6, type: 'matching',
      question: '날씨 현상과 원인을 올바르게 연결하세요.',
      pairs: [
        { left: '비', right: '구름 속 물방울이 무거워져 떨어짐' },
        { left: '눈', right: '기온이 낮을 때 얼음 알갱이가 떨어짐' },
        { left: '이슬', right: '밤에 기온이 내려가 수증기가 응결됨' },
      ],
      explanation: '날씨 현상은 대기 중 수증기의 상태 변화에 의해 일어납니다.',
      difficulty: 'medium',
    },
    {
      id: 'u7_m1', unitId: 7, type: 'matching',
      question: '운동 관련 용어와 정의를 연결하세요.',
      pairs: [
        { left: '속력', right: '단위 시간당 이동 거리' },
        { left: '속도', right: '크기와 방향이 있는 속력' },
        { left: '가속도', right: '단위 시간당 속도의 변화량' },
      ],
      explanation: '물체의 운동은 속력, 속도, 가속도로 정량적으로 나타낼 수 있습니다.',
      difficulty: 'hard',
    },
    {
      id: 'u8_m1', unitId: 8, type: 'matching',
      question: '산과 염기의 특성을 연결하세요.',
      pairs: [
        { left: '산', right: '파란 리트머스를 빨갛게 변화' },
        { left: '염기', right: '빨간 리트머스를 파랗게 변화' },
        { left: '중성', right: '산과 염기가 반응하여 서로 상쇄' },
      ],
      explanation: '산과 염기는 리트머스 종이로 구별하며, 만나면 중화 반응을 일으킵니다.',
      difficulty: 'medium',
    },
  ];
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 4: data/questions-short.ts — 단답 문항 생성
- **ACTION**: 단원당 1개, 총 8개 단답 문항 파일 생성
- **IMPLEMENT**:
  ```typescript
  import { ShortQuestion } from '../types';

  export const shortQuestions: ShortQuestion[] = [
    {
      id: 'u1_s1', unitId: 1, type: 'short',
      question: '생물의 몸 일부나 흔적이 암석에 보존된 것을 무엇이라고 하나요?',
      correctAnswer: '화석',
      acceptedAnswers: ['화석', 'fossil'],
      explanation: '화석은 과거 생물의 몸이나 흔적(발자국, 알 등)이 암석 속에 보존된 것입니다.',
      difficulty: 'easy', cardReward: 'u1_c10',
    },
    {
      id: 'u2_s1', unitId: 2, type: 'short',
      question: '빛이 한 매질에서 다른 매질로 들어갈 때 경계면에서 방향이 꺾이는 현상을 무엇이라고 하나요?',
      correctAnswer: '굴절',
      acceptedAnswers: ['굴절', '빛의 굴절', 'refraction'],
      explanation: '굴절은 빛이 물이나 유리 같은 다른 매질로 들어갈 때 속도가 변해 방향이 바뀌는 현상입니다.',
      difficulty: 'medium',
    },
    {
      id: 'u3_s1', unitId: 3, type: 'short',
      question: '소금물에서 소금처럼 다른 물질에 녹는 물질을 무엇이라고 하나요?',
      correctAnswer: '용질',
      acceptedAnswers: ['용질', '녹는 물질'],
      explanation: '용질은 용매에 녹아 용액을 만드는 물질입니다. 소금물에서 소금이 용질입니다.',
      difficulty: 'easy',
    },
    {
      id: 'u4_s1', unitId: 4, type: 'short',
      question: '혈액을 온몸으로 순환시키는 펌프 역할을 하는 기관은 무엇인가요?',
      correctAnswer: '심장',
      acceptedAnswers: ['심장', '염통'],
      explanation: '심장은 근육으로 이루어진 펌프로, 규칙적으로 수축·이완하며 혈액을 순환시킵니다.',
      difficulty: 'easy', cardReward: 'u4_c1',
    },
    {
      id: 'u5_s1', unitId: 5, type: 'short',
      question: '광합성으로 스스로 양분을 만드는 생물을 생태계에서 무엇이라고 하나요?',
      correctAnswer: '생산자',
      acceptedAnswers: ['생산자', '식물', '광합성 생물'],
      explanation: '식물은 태양 에너지를 이용해 이산화탄소와 물로 포도당을 만드는 생산자입니다.',
      difficulty: 'easy',
    },
    {
      id: 'u6_s1', unitId: 6, type: 'short',
      question: '공기 중 수증기의 양을 나타내는 척도로 보통 퍼센트(%)로 표현하는 것을 무엇이라고 하나요?',
      correctAnswer: '습도',
      acceptedAnswers: ['습도', '상대습도'],
      explanation: '습도는 현재 공기 중 수증기의 양이 그 온도에서 최대로 포함할 수 있는 양(포화 수증기량)에 대한 비율입니다.',
      difficulty: 'medium',
    },
    {
      id: 'u7_s1', unitId: 7, type: 'short',
      question: '이동한 거리를 걸린 시간으로 나눈 값을 무엇이라고 하나요?',
      correctAnswer: '속력',
      acceptedAnswers: ['속력', '빠르기', 'speed'],
      explanation: '속력(m/s) = 이동 거리(m) ÷ 걸린 시간(s). 방향을 포함하면 속도가 됩니다.',
      difficulty: 'easy',
    },
    {
      id: 'u8_s1', unitId: 8, type: 'short',
      question: '산과 염기가 반응하여 서로의 성질을 잃는 반응을 무엇이라고 하나요?',
      correctAnswer: '중화',
      acceptedAnswers: ['중화', '중화 반응', '중화반응'],
      explanation: '산의 수소 이온(H⁺)과 염기의 수산화 이온(OH⁻)이 결합하여 물을 생성하는 반응을 중화 반응이라 합니다.',
      difficulty: 'medium', cardReward: 'u8_c1',
    },
  ];
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 5: data/questions.ts — getUnitQuestions 확장
- **ACTION**: 기존 `getUnitQuestions` 함수가 OX·매칭·단답 문항도 포함하도록 수정
- **IMPLEMENT**: 파일 상단에 import 추가, 함수 수정
  ```typescript
  import { oxQuestions } from './questions-ox';
  import { matchingQuestions } from './questions-matching';
  import { shortQuestions } from './questions-short';

  // 기존 getUnitQuestions 함수를 아래로 교체:
  export function getUnitQuestions(unitId: number): Question[] {
    const mc = questions.filter(q => q.unitId === unitId);
    const ox = oxQuestions.filter(q => q.unitId === unitId);
    const matching = matchingQuestions.filter(q => q.unitId === unitId);
    const short = shortQuestions.filter(q => q.unitId === unitId);
    return [...mc, ...ox, ...matching, ...short];
  }
  ```
- **GOTCHA**: `questions.ts`의 기존 `questions: Question[]` 배열에 있는 MCQuestion들은 `type` 필드가 없음. MCQuestion 인터페이스에서 `type`을 필수로 정의하면 컴파일 에러 발생. 해결: `MCQuestion`의 `type`을 리터럴 `'mc'`로 유지하되 기존 데이터에 `as MCQuestion[]` cast 또는 `type`을 optional(`type?: 'mc'`)로 설정.
  ```typescript
  // 추천: MCQuestion에서 type을 optional + 기본값 'mc'로 처리
  export interface MCQuestion extends BaseQuestion {
    type?: 'mc';   // 기존 데이터 호환을 위해 optional
    options: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
  }
  // 그리고 isMCQuestion 타입 가드:
  export function isMCQuestion(q: Question): q is MCQuestion {
    return (q as MCQuestion).options !== undefined;
  }
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과, `getUnitQuestions(1)` 호출 시 MC+OX+매칭+단답 모두 포함

### Task 6: components/ui/quiz/OXRenderer.tsx 생성
- **ACTION**: OX 문항 전용 렌더러 컴포넌트 생성
- **IMPLEMENT**:
  ```tsx
  'use client';
  import React, { useState } from 'react';
  import { OXQuestion } from '../../../types';

  interface OXRendererProps {
    question: OXQuestion;
    isAnswered: boolean;
    btnCorrectStyle: string;
    btnIncorrectStyle: string;
    onAnswer: (selectedIndex: 0 | 1) => void;
  }

  export default function OXRenderer({ question, isAnswered, btnCorrectStyle, btnIncorrectStyle, onAnswer }: OXRendererProps) {
    const [selected, setSelected] = useState<0 | 1 | null>(null);

    const handleClick = (idx: 0 | 1) => {
      if (isAnswered) return;
      setSelected(idx);
      onAnswer(idx);
    };

    const getStyle = (idx: 0 | 1) => {
      if (!isAnswered) return idx === 0
        ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/40 text-emerald-300'
        : 'bg-red-950/20 border-red-500/40 hover:border-red-400 hover:bg-red-950/40 text-red-300';
      if (idx === question.correctIndex) return btnCorrectStyle;
      if (selected === idx) return btnIncorrectStyle;
      return 'border-gray-900 text-gray-600 opacity-40';
    };

    return (
      <div className="grid grid-cols-2 gap-6 mt-4">
        {([0, 1] as const).map(idx => (
          <button
            key={idx}
            disabled={isAnswered}
            onClick={() => handleClick(idx)}
            className={`min-h-[120px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 touch-target btn-cyber ${getStyle(idx)}`}
          >
            <span className="text-6xl">{idx === 0 ? '⭕' : '❌'}</span>
            <span className="text-xl font-black">{idx === 0 ? '맞다 (O)' : '틀리다 (X)'}</span>
          </button>
        ))}
      </div>
    );
  }
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 7: components/ui/quiz/MatchingRenderer.tsx 생성
- **ACTION**: 매칭 문항 렌더러 — 좌측 클릭 → 우측 클릭으로 쌍 연결, 완료 후 채점
- **IMPLEMENT**:
  ```tsx
  'use client';
  import React, { useState, useMemo } from 'react';
  import { MatchingQuestion } from '../../../types';

  interface MatchingRendererProps {
    question: MatchingQuestion;
    isAnswered: boolean;
    onAnswer: (isCorrect: boolean) => void;
  }

  export default function MatchingRenderer({ question, isAnswered, onAnswer }: MatchingRendererProps) {
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [connections, setConnections] = useState<Record<number, number>>({});  // leftIdx → rightIdx

    const shuffledRight = useMemo(() => {
      const indices = question.pairs.map((_, i) => i);
      return [...indices].sort(() => Math.random() - 0.5);
    }, [question.id]);

    const handleLeftClick = (idx: number) => {
      if (isAnswered) return;
      setSelectedLeft(idx === selectedLeft ? null : idx);
    };

    const handleRightClick = (shuffledIdx: number) => {
      if (isAnswered || selectedLeft === null) return;
      const rightIdx = shuffledRight[shuffledIdx];
      setConnections(prev => ({ ...prev, [selectedLeft]: rightIdx }));
      setSelectedLeft(null);
    };

    const handleSubmit = () => {
      const allCorrect = question.pairs.every((_, i) => connections[i] === i);
      onAnswer(allCorrect);
    };

    const allConnected = Object.keys(connections).length === question.pairs.length;

    return (
      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">개념</p>
            {question.pairs.map((pair, i) => (
              <button
                key={i}
                onClick={() => handleLeftClick(i)}
                disabled={isAnswered}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-left transition-all ${
                  selectedLeft === i ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300'
                  : i in connections ? 'border-emerald-500/50 bg-emerald-950/10 text-emerald-300'
                  : 'border-gray-800 bg-gray-950/40 text-gray-300 hover:border-gray-700'
                }`}
              >
                {pair.left}
                {i in connections && !isAnswered && <span className="ml-2 text-[10px] text-gray-500">→ 연결됨</span>}
              </button>
            ))}
          </div>
          {/* Right column */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">설명</p>
            {shuffledRight.map((rightIdx, shuffledIdx) => {
              const isConnected = Object.values(connections).includes(rightIdx);
              const isCorrectPair = isAnswered && Object.entries(connections).some(([li, ri]) => Number(ri) === rightIdx && Number(li) === rightIdx);
              return (
                <button
                  key={shuffledIdx}
                  onClick={() => handleRightClick(shuffledIdx)}
                  disabled={isAnswered || isConnected}
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                    isAnswered
                      ? isCorrectPair ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300' : 'border-red-500/50 bg-red-950/10 text-red-400'
                    : isConnected ? 'border-gray-700 bg-gray-950/20 text-gray-600 opacity-50'
                    : selectedLeft !== null ? 'border-amber-500/40 bg-amber-950/10 text-amber-300 hover:border-amber-400 cursor-pointer'
                    : 'border-gray-800 bg-gray-950/40 text-gray-300'
                  }`}
                >
                  {question.pairs[rightIdx].right}
                </button>
              );
            })}
          </div>
        </div>
        {!isAnswered && allConnected && (
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl transition-all"
          >
            채점하기 ✓
          </button>
        )}
        {!isAnswered && !allConnected && (
          <p className="text-[11px] text-gray-500 font-mono text-center">
            왼쪽 개념을 클릭한 후 오른쪽 설명을 클릭하세요 ({Object.keys(connections).length}/{question.pairs.length} 연결됨)
          </p>
        )}
      </div>
    );
  }
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 8: components/ui/quiz/ShortAnswerRenderer.tsx 생성
- **ACTION**: 단답 입력 렌더러 — 텍스트 입력, 정규화 후 acceptedAnswers 배열과 키워드 매칭
- **IMPLEMENT**:
  ```tsx
  'use client';
  import React, { useState, useRef } from 'react';
  import { ShortQuestion } from '../../../types';

  interface ShortAnswerRendererProps {
    question: ShortQuestion;
    isAnswered: boolean;
    onAnswer: (isCorrect: boolean, userInput: string) => void;
  }

  function normalizeKorean(text: string): string {
    return text.trim().toLowerCase().replace(/\s+/g, '');
  }

  export default function ShortAnswerRenderer({ question, isAnswered, onAnswer }: ShortAnswerRendererProps) {
    const [input, setInput] = useState('');
    const [submitted, setSubmitted] = useState<{ value: string; correct: boolean } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
      if (!input.trim() || isAnswered) return;
      const normalized = normalizeKorean(input);
      const isCorrect = question.acceptedAnswers.some(ans =>
        normalizeKorean(ans) === normalized || normalized.includes(normalizeKorean(ans))
      );
      setSubmitted({ value: input.trim(), correct: isCorrect });
      onAnswer(isCorrect, input.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    };

    return (
      <div className="space-y-4 mt-4">
        <div className="flex gap-3">
          <input
            ref={inputRef}
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
          <p className="text-[11px] text-gray-500 font-mono text-center">
            Enter 키 또는 제출 버튼으로 답안을 제출하세요
          </p>
        )}
      </div>
    );
  }
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 9: components/ui/quiz/index.ts — 배럴 export
- **ACTION**: quiz 디렉토리 배럴 export 생성
- **IMPLEMENT**:
  ```typescript
  export { default as OXRenderer } from './OXRenderer';
  export { default as MatchingRenderer } from './MatchingRenderer';
  export { default as ShortAnswerRenderer } from './ShortAnswerRenderer';
  ```
- **VALIDATE**: import 경로 테스트

### Task 10: QuizScreen.tsx — type dispatcher 통합
- **ACTION**: `handleOptionClick` 옆에 새 타입 핸들러 추가, 렌더 영역에서 question.type에 따라 렌더러 전환
- **IMPORTS**: `import { OXRenderer, MatchingRenderer, ShortAnswerRenderer } from './quiz';`
- **IMPLEMENT** (추가할 핸들러):
  ```typescript
  // OX/MC 공통 (index 기반)
  const handleIndexAnswer = async (selectedIndex: number) => {
    if (isAnswered || loading || !player) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    const q = questionsList[currentIndex];
    let isCorrect = false;
    if (isOXQuestion(q) || isMCQuestion(q)) {
      isCorrect = selectedIndex === (q.correctIndex ?? -1);
    }
    await handleAnswerResult(isCorrect, q);
  };

  // Matching/Short (isCorrect 직접 전달)
  const handleBooleanAnswer = async (isCorrect: boolean) => {
    if (isAnswered || loading || !player) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    const q = questionsList[currentIndex];
    await handleAnswerResult(isCorrect, q);
  };

  // 공통 결과 처리 (기존 handleOptionClick 로직 추출)
  const handleAnswerResult = async (isCorrect: boolean, q: Question) => {
    setIsAnswered(true);
    setLoading(false);
    broadcastQuizAnswer(q.id, isCorrect, isCorrect && q.cardReward ? q.cardReward : undefined);
    if (isCorrect) {
      setScore(prev => prev + 1); setStreak(prev => prev + 1);
      setFlashType('correct'); gameAudio.playCorrect();
      // XP 및 카드 보상은 기존 로직과 동일
      if (q.cardReward) { unlockCard(q.cardReward); setNewlyUnlockedCardIds(prev => [...prev, q.cardReward!]); }
    } else {
      setStreak(0); setFlashType('wrong'); gameAudio.playWrong();
      addWrongAnswer(q.id);
    }
    setExplanationVisible(true);
    setTimeout(() => { setFlashType(null); setTimeout(() => { setExplanationVisible(false); handleNext(); }, 2200); }, 800);
  };
  ```
- **IMPLEMENT** (렌더 영역 교체 — 기존 A/B/C/D grid 자리):
  ```tsx
  {/* Question Type Dispatcher */}
  {isOXQuestion(currentQuestion) ? (
    <OXRenderer
      question={currentQuestion}
      isAnswered={isAnswered}
      btnCorrectStyle="border-emerald-500 bg-emerald-950/40 text-emerald-300 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.25)]"
      btnIncorrectStyle="border-red-500 bg-red-950/40 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
      onAnswer={handleIndexAnswer}
    />
  ) : isMatchingQuestion(currentQuestion) ? (
    <MatchingRenderer
      question={currentQuestion}
      isAnswered={isAnswered}
      onAnswer={handleBooleanAnswer}
    />
  ) : isShortQuestion(currentQuestion) ? (
    <ShortAnswerRenderer
      question={currentQuestion}
      isAnswered={isAnswered}
      onAnswer={handleBooleanAnswer}
    />
  ) : (
    /* 기존 MC A/B/C/D grid — isMCQuestion(currentQuestion) */
    <div className="grid grid-cols-1 gap-4">
      {(currentQuestion as MCQuestion).options.map((option, idx) => { /* 기존 코드 그대로 */ })}
    </div>
  )}
  ```
- **GOTCHA**: `handleOptionClick`은 기존 MC 흐름에서 `submitQuizAnswer`를 호출하는데, 새 타입에서는 이것을 건너뛰고 클라이언트에서 채점. 기존 MC는 `handleOptionClick` 그대로 유지하거나 `handleIndexAnswer`로 통합 가능. **간단하게 기존 handleOptionClick 유지하고 OX/매칭/단답만 새 핸들러 추가** (리팩토링 최소화).
- **GOTCHA 2**: `isOXQuestion`, `isMCQuestion` 등 타입 가드를 `types/index.ts`에서 import해야 함
- **VALIDATE**: `npx tsc --noEmit` 통과, `npx next build` 통과, 개발 서버에서 OX/매칭/단답 문제 정상 동작 확인

---

## Testing Strategy

### Edge Cases Checklist
- [ ] OX: 맞다(O) 클릭 시 correctIndex=0이면 정답 처리
- [ ] OX: 타임아웃 시 `setSelectedOption(-1)`처럼 오답 처리
- [ ] 매칭: 모든 쌍 연결 전에 채점 버튼 비활성
- [ ] 매칭: 일부 오류 쌍 포함 시 isCorrect=false → 정답 쌍만 녹색 표시
- [ ] 단답: 공백 제거 후 키워드 매칭 (`'화석 '` == `'화석'`)
- [ ] 단답: 대소문자 구분 없음 (`'fossil'` == `'Fossil'`)
- [ ] 카드 보상: 각 타입에서 isCorrect=true 시 cardReward 연동
- [ ] 새 타입 문항이 shuffle pool에 포함되어 10문제 중 나타남

### Manual Validation
- [ ] `npm run dev` → 퀴즈 시작
- [ ] 1단원: OX 문항 표시 및 채점 확인
- [ ] 1단원: 매칭 문항 표시 및 채점 확인  
- [ ] 1단원: 단답 문항 입력 → 정답/오답 확인
- [ ] 기존 MC 문항 정상 동작 확인 (regression)
- [ ] 카드 보상 연동 확인

---

## Validation Commands

```bash
# 타입 체크
npx tsc --noEmit

# 빌드
npx next build

# 개발 서버
npm run dev
```

---

## Acceptance Criteria
- [ ] `npx next build` 오류 없이 완료
- [ ] `npx tsc --noEmit` 오류 0건
- [ ] OX 문항: 두 버튼 렌더링, 클릭 시 정오답 피드백
- [ ] 매칭 문항: 좌우 클릭으로 쌍 연결, 채점 버튼 동작
- [ ] 단답 문항: 입력창, 키워드 매칭 채점
- [ ] 기존 MC 문항 regression 없음
- [ ] 카드 보상 연동 (isCorrect===true 시 cardReward unlock)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MCQuestion type optional 처리 시 기존 320문항 타입 에러 | H | H | `type?: 'mc'` + `options` 존재 여부로 타입 가드 |
| handleOptionClick과 새 핸들러 중복 로직 | M | L | 기존 로직 최소 변경, 새 타입만 새 핸들러 사용 |
| MatchingRenderer shuffledRight 불안정 (re-render) | L | M | `useMemo([question.id])` — 문항 변경 시만 재셔플 |
| 매칭 타임아웃 처리 누락 | M | M | handleTimeOut에 isMatchingQuestion 체크 추가 → 오답 처리 |

## Notes
- `submitQuizAnswer`는 MC 퀴즈용이므로 새 타입에서는 **호출하지 않고** 클라이언트에서 isCorrect 계산 후 `broadcastQuizAnswer`만 호출
- 기존 320문항 MC를 새 타입으로 변환하는 것은 Phase 6 (콘텐츠 품질) 단계로 연기
- 매칭 문항의 pairs 순서가 항상 정답 순서이므로 rightCol 반드시 shuffle
- 단답 채점은 `normalizeKorean` — 공백 제거·소문자·포함 체크. 완전 일치가 기본, 향후 AI 채점은 Phase 8 이후 고려
