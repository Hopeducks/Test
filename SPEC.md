# 과학 마스터 도감 (Science Master Pokédex) — 상세 제품 명세서 (SPEC)

본 명세서는 Next.js 15 기반 초등 5학년 과학 복습용 웹 게임의 설계 및 기능 스펙을 기술합니다. 교실 빔프로젝터 환경 및 학생 태블릿 인터랙션에 최적화된 학습 플랫폼입니다.

---

## 1. 핵심 게임 루프 및 도감 수집 시스템

1.  **진입 및 상태 로드**: 교사가 웹앱에 접속하면 `localStorage`에 저장된 게임 진행도를 기반으로 **도감 홈(Home)** 화면을 봅니다.
2.  **단원 선택**: 2022 개정 교육과정 5학년 과학 8개 단원 중 하나를 선택합니다.
3.  **퀴즈 도전**: 각 단원별 10문항으로 구성된 객관식 퀴즈 세션이 시작됩니다.
4.  **일반 카드 해금**: 문제 풀이 중 특정 질문(카드 보상이 지정된 질문)을 처음으로 맞추면 해당 과학 현상/생물 카드가 즉시 해금(Unlock)됩니다.
5.  **진화형 전설 카드 해금**: 해당 단원의 10문항 퀴즈를 모두 완료하여 단원을 통과(Clear)하면, 단원당 1개씩 존재하는 **진화형 레전더리(Evolution) 카드**가 해금됩니다.
6.  **도감 완성도**: 전체 수집 카드 개수 기반으로 홈 화면의 도감 완성도(`%`)와 통계가 실시간 갱신됩니다.

---

## 2. 콘텐츠 명세 (단원 및 카드 구성)

### 2.1. 2022 개정 교육과정 8개 단원 명세
각 단원당 총 **40개의 문제 은행**이 존재하며, 총 320개 문항이 구축됩니다.

*   **1단원: 지층과 화석 (Strata and Fossils)** (문제 40개, 카드 10개)
*   **2단원: 빛의 성질 (Properties of Light)** (문제 40개, 카드 10개)
*   **3단원: 용해와 용액 (Dissolution and Solutions)** (문제 40개, 카드 10개)
*   **4단원: 우리 몸의 구조와 기능 (Structure and Function of Our Body)** (문제 40개, 카드 10개)
*   **5단원: 생물과 환경 (Living Things and Environment)** (문제 40개, 카드 10개)
*   **6단원: 날씨와 우리 생활 (Weather and Our Life)** (문제 40개, 카드 10개)
*   **7단원: 물체의 운동 (Motion of Objects)** (문제 40개, 카드 10개)
*   **8단원: 산과 염기 (Acids and Bases)** (문제 40개, 카드 10개)

### 2.2. 카드 등급 및 보상 매핑
*   **전체 도감 카드 수**: **80개** (10개 카드 x 8단원 = 총 80개 카드)
*   **도감 완성도 계산 공식**:
    $$\text{도감 완성도} = \left( \frac{\text{해금된 카드 수}}{80} \right) \times 100\%$$
*   **단원별 카드 구성**:
    *   **일반/희귀 카드 9개**: 개별 문항 정답 맞춤 시 최초 1회 해금 (`cardReward` 매핑)
    *   **진화형 전설 카드 1개**: 퀴즈 10문제를 모두 풀어 단원을 최종 클리어했을 때 해금
*   **카드 등급 (4단계)**:
    *   `common` — 일반 (흰색 테두리)
    *   `rare` — 희귀 (초록 에메랄드 테두리)
    *   `epic` — 에픽 (자홍 푸치시아 테두리, 진화 연출 포함)
    *   `legendary` — 전설 (황금 앰버 테두리, 단원 클리어 보상)
*   **카드 속성**:
    *   `id`: 카드 고유 식별자 (string)
    *   `name`: 카드 이름 (Korean)
    *   `image`: 이모지(Emoji) 또는 CSS 아트
    *   `rarity`: 등급 (`common` | `rare` | `epic` | `legendary`)
    *   `unitId`: 소속 단원 ID (number, 1~8)
    *   `description`: 교실 빔프로젝터 가독성을 준수한 상세 과학 교과 설명 (Korean)

---

## 3. 데이터 구조 정의

### 3.1. 퀴즈 문항 인터페이스 (`/types/index.ts`)
```typescript
export interface Question {
  id: string;
  unitId: number; // 1 to 8
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string; // 문제 풀이 후 노출되는 학습 해설
  cardReward?: string; // 이 문제를 맞췄을 때 획득하는 카드 ID (선택사항, 단원당 9개 매핑)
}
```

### 3.2. 포켓몬/생물 카드 인터페이스 (`/types/index.ts`)
```typescript
export interface CollectibleCard {
  id: string;
  unitId: number;
  name: string;
  image: string; // Emoji 또는 CSS 아트 코드
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
}
```

### 3.3. 게임 진행 상태 (`/lib/game-state.ts`)
```typescript
export interface GameProgress {
  unlockedCardIds: string[]; // 해금된 카드 ID 목록
  completedUnits: number[];  // 완료한 단원 ID 목록 (1~8)
  unitHighScores: Record<number, number>; // 단원별 최고 퀴즈 점수
}
```

### 3.4. 학급 멀티플레이어 및 세션 인터페이스 (`/types/index.ts`)
```typescript
export interface StudentResponse {
  name: string;
  avatar: string;
  completedUnits: number[];
  unitScores: Record<number, number>; // unitId -> score (0-100)
  unlockedCardsCount: number;
  lastActive: string; // ISO 타임스탬프
  answers: Record<string, {
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
    timeTakenMs: number;
  }>;
}

export interface ClassroomSession {
  activeUnitId: number;
  status: 'lobby' | 'playing' | 'ended';
  currentQuestionIndex: number;
  questionStartTime: number;
  questionIds?: string[]; // 해당 퀴즈 세션의 10문항 ID 목록
  students: {
    name: string;
    avatar: string;
    isSimulated: boolean;
    currentScore: number;
    currentStreak: number;
    answeredCurrentQuestion: boolean;
    lastAnswerCorrect?: boolean;
    lastAnswerTime?: number;
  }[];
}
```

---

## 4. UI 스크린 명세 (총 8개 주요 화면)

1.  **역할 선택 (Role Selector)**
    *   학생 모드와 교사용 대시보드 모드 진입 분기.
    *   학생 선택 시 이름(닉네임) 입력 및 10종의 파트너 아바타 이모지 설정 UI 제공.
2.  **Home / 도감 홈**
    *   상단에 대형 도감 완성도 게이지 바 및 백분율(%) 표시.
    *   우측 상단에 '교실 대기실 입장' 퀵 링크 탑재.
    *   8개의 과학 단원 선택 카드 그리드. (각 카드 터치 시 퀴즈 준비 화면 또는 퀴즈로 진입)
3.  **교실 대기실 (Student Lobby)**
    *   교사가 지정한 학습 단원 세부 사항 카드 노출.
    *   참가한 학생들의 아바타 명단이 바둑판 배열로 동적 나열.
    *   (솔로/모의 플레이) 15인의 AI 급우 자동 입장 스폰 연출 및 '시뮬레이션 시작' 버튼 제공.
4.  **도감 뷰어 (Pokedex Grid)**
    *   80개의 모든 수집용 카드를 보여주는 8x10 격자 그리드.
    *   미획득(잠금) 카드는 검은색 실루엣(물음표)으로 표시.
    *   해금된 카드는 상세 이미지 및 등급별 컬러 광채 표시, 터치 시 세부 과학 설명 오버레이 팝업.
5.  **퀴즈 화면 (Quiz View)**
    *   단원 내 10문항 차례대로 출제.
    *   (교실 모드 활성화 시) 좌측에 문제 및 보기, 우측에 **'실시간 제출 현황(%)' 및 '실시간 랭킹(Top 10) 보드'**를 표시하는 2단 분할 레이아웃 출력.
    *   정답 제출 시 피드백 오버레이(정오답 표시 및 20px+ 가독성의 explanation 텍스트 출력).
    *   연속 정답 시 불타오르는 콤보 스트릭 카운터(Streak Counter) 시각화.
6.  **카드 해금 애니메이션 (Card Unlock Celebration)**
    *   퀴즈 도중 카드 보상 획득 시 연출되는 전체 화면 축하 모션.
    *   카드가 뒤집히며(Card Flip) 잠금 해제되고 네온 스파크 파티클이 터지는 연출.
7.  **단원 완료 화면 (Unit Clearance)**
    *   최종 퀴즈 점수(맞춘 개수 / 10) 및 획득한 카드 목록 표시.
    *   진화형 전설 카드 해금 애니메이션 결합.
    *   SNS 결과 공유 및 교사용 일괄 취합을 위한 **'결과 제출용 텍스트 코드 복사'** 유틸리티 탑재.
8.  **교사용 관리 대시보드 (Teacher Dashboard)**
    *   **로비 제어**: 과학 단원 선택 및 대기 로비 개설, 강제 AI 봇 스폰, 퀴즈 시작 트리거.
    *   **실시간 중계**: 학생들의 선택지 분포(1~4번 실시간 막대 그래프 분석) 및 정답률 중계.
    *   **프로젝터 전광판**: 교실 정면 빔프로젝터용 대형 네온 실시간 리더보드 (1~10위).
    *   **성적 DB 관리**: 학생 결과 코드 복사-붙여넣기 취합 도구, Excel용 UTF-8 CSV 파일 내보내기, 학급 전체 리포트 뷰어.

---

## 5. 디자인 가이드라인 & 에스테틱

*   **테마 색상**: **Dark Sci-Fi Pokédex**
    *   배경: 딥 블랙/네이비 (`#030712`, `#0b0f19`)
    *   핵심 하이라이트: 일렉트릭 네온 블루 (`#00e5ff`)
    *   희귀/전설 아이템 포인트: 앰버/골드 (`#f59e0b`, `#e5a93b`)
*   **글래스모피즘 표준**: 반투명 흐림(`backdrop-filter: blur(20px)`) 효과와 네온 광채 테두리 테마 적용.
*   **빔프로젝터 최적화**:
    *   교실 뒤편 학생들도 읽기 쉽도록 텍스트 기본 최소 크기 `20px` 이상 확보.
    *   학생 태블릿/전자칠판 최소 터치 영역 `48px` 이상 확보.
    *   *금지*: 보라색 그라데이션, 흰색 배경, 범용적인 둥근 모서리 카드 스타일 배제.

---

## 6. 오프라인 교실 데이터 연동 아키텍처

1.  **브라우저 Storage 동기화 (Multi-Tab Syncer)**
    *   동일 컴퓨터에서 크롬 탭을 여러 개 실행하여 각각 '교사용 대시보드'와 '학생용 태블릿'으로 진입 시, HTML5 `storage` 이벤트를 리스닝하여 탭 간 0.1초 이내 실시간 동기화를 지원합니다.
2.  **AI 학급 시뮬레이터 (Classroom Simulator)**
    *   실제 학생 기기가 다수 접속하지 않더라도, 15종의 고유 속도(speedFactor)와 정답 확률(accuracyFactor)을 탑재한 가상 학생 봇들이 백그라운드 스레드에서 실시간으로 답안을 제출하고 점수를 올려 랭킹을 변동시킵니다.
3.  **데이터 내보내기 및 가져오기 (CSV & Import Code)**
    *   학생 태블릿의 `localStorage` 진행 상태 데이터를 Base64 JSON 형식의 코드로 압축 변환하여 공유하고, 교사용 대시보드에서 일괄 입력받아 오프라인 성적 원장을 구성하는 경량 아키텍처를 구현합니다.
