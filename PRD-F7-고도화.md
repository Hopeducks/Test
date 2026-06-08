# PRD — 과학 마스터 메타버스 Phase F7 고도화

> 작성일 2026-06-09 · 대상 빌드: Phase H1·H3·I2 완료 시점(`output: 'export'` 정적 빌드)
> 선행 문서: `SPEC.md`, `CLAUDE.md`, `HANDOFF.md`, `PRD-F4-고도화.md`
> 본 PRD는 "**관측 가능성 → 콘텐츠 유연성 → 안정성 → 확장**" 순서로 진행한다.
> 외부 유료/대용량 에셋 없이 정적·오프라인(Supabase mock 폴백) 제약을 유지한다.

---

## 0. 한 줄 요약

교사가 **(1) 코드 접속 학생의 활동을 새로고침 한 번으로 실시간 모니터링**하고, **(2) 성취기준을 켜고 끄면 학생이 푸는 문제가 그에 맞춰 자동으로 바뀌며**(다학년·고난이도 포함), **(3) 배틀 모드를 안정화·확장**하고, **(4) 과학 포켓몬 월드/유니버스를 확장**하도록 시스템을 고도화한다.

---

## 1. 배경 & 현재 상태 (코드 근거 포함)

### 1.1 사용자가 제기한 요구

| # | 요구 | 현재 상태 |
|---|------|-----------|
| R1 | 학생/웹앱 활동이 교사 대시보드에 **실시간 반영**, 새로고침 버튼으로 모니터링 | 10초 자동 폴링·Presence·Broadcast 피드는 있으나 **수동 새로고침 버튼 없음**, 폴링 함수가 effect 내부에 캡슐화되어 재호출 불가 |
| R2 | **성취기준 보드 ↔ 문제 연동**: 성취기준 추가/제거 시 출제 문항이 그에 맞춰 변경 | **성취기준 개념 자체가 코드에 없음**. RubricPanel(단원 루브릭, 3수준)만 존재하고 문항과 미연결 |
| R3 | 다른 학년 문제·고난이도 문제 추가 (현재 5학년) | 모든 문항 `unitId 1~8` = 5학년 고정. `Question.difficulty?`는 타입에 있으나 데이터에 거의 미부여, `gradeLevel` 필드 없음 |
| R4 | 배틀 모드 확장 + 안정성 확보 | `CardBattleArena`(709줄)·`battle/` 모듈 존재. `CardBattleArena.tsx:389` "Fallback to Unit 1" 등 임시 처리, 매치메이킹/Broadcast 동기화 취약 의심 |
| R5 | 과학 포켓몬 월드 및 유니버스 확장 | `LobbyScene`(Phaser) 절차적 아트. PRD-F4 EPIC E에서 로비 비주얼 고도화 범위 일부 정의됨 |
| R6 | 아이디어가 있으면 자율 추가 제안 | 본 PRD EPIC E 참조 |

### 1.2 코드 레벨에서 확인된 사실 / 결함 (근거)

| ID | 심각도 | 내용 | 근거 |
|----|--------|------|------|
| D1 | **HIGH** | 교사 대시보드 폴링 함수 `fetchSessionData`가 `useEffect` 내부에 정의되어 **수동 호출 불가** → 새로고침 버튼 구현하려면 `useCallback`으로 추출 필요 | `TeacherDashboard/index.tsx:141-189` |
| D2 | **HIGH** | `handleStartQuiz`가 세션에 **`questionIds`를 세팅하지 않음** → `AnswerDistributionPanel`이 읽는 `questionIds?.[currentQuestionIndex]`가 `undefined` → 실시간 문항별 선택지 분포·정답률이 정확히 집계되지 않음 | `ControlPanels.tsx:61`, `AnswerDistributionPanel.tsx:12-15` |
| D3 | **MEDIUM** | 성취기준(2022 개정 교육과정 성취기준 코드, 예 `[6과01-01]`) 데이터·타입 부재. 문항을 성취기준으로 필터링할 키가 없음 | `types/index.ts:94-126`(BaseQuestion), `data/questions.ts` |
| D4 | **MEDIUM** | 학년/난이도 메타데이터 부재: 다학년·고난이도 확장 시 출제 풀을 구분할 수 없음 | `Question.difficulty?`만 존재(`types/index.ts:100`), `gradeLevel` 없음 |
| D5 | **MEDIUM** | 실시간 데이터 출처가 3중(10초 폴링 / Presence / Broadcast 피드)으로 분산되고, "마지막 갱신" 표시는 있으나 **수동 강제 동기화·로딩 상태 UI 없음** | `index.tsx:73-189` |
| D6 | **MEDIUM** | 배틀 문항 폴백 하드코딩(`getUnitQuestions(1)`), 성취기준/단원 선택과 무관하게 1단원 문제로 떨어짐 | `CardBattleArena.tsx:389` |
| D7 | LOW | DB 폴링 실패 시 `console.error`만 하고 교사에게 **연결 상태가 표시되지 않음** | `index.tsx:183` |

> 참고: PRD-F4(경제·업적·아바타·로비) 항목은 별도 트랙. 본 PRD는 그 위에 얹는다. 충돌 시 F4 산출물(`lib/economy.ts`, `lib/progression.ts`, `data/quests.ts`)을 깨지 않는다.

---

## 2. 목표 & 비목표

### 2.1 목표 (Goals)

- **G-1** 교사가 **새로고침 버튼 1회**로 코드 접속 학생의 활동(점수·정답률·현재 화면·선택지 분포)을 즉시 동기화·관측. 자동 갱신과 병행하되 수동 강제 갱신 + 로딩/연결 상태 표시.
- **G-2** **성취기준 보드 ↔ 출제 풀 양방향 연동**: 성취기준 토글 → `questionIds` 자동 재구성 → 학생이 푸는 문제 변경. 단원·학년·난이도·성취기준 다축 필터.
- **G-3** **다학년·고난이도 문항 확장 기반** 구축: `gradeLevel`·`difficulty`·`standardCodes` 메타데이터를 문항에 도입하고, 기존 320문항 무손상 마이그레이션.
- **G-4** 배틀 모드 **안정성**(매치메이킹·라운드 동기화·예외 복구) 확보 + **확장**(모드/규칙/밸런스).
- **G-5** 과학 포켓몬 월드/유니버스 **확장**(존·콘텐츠·진행 루프).
- **G-6** 회귀 0: 매 단계 `tsc` + 단위(기존 30+신규) + E2E 17 그린, 정적 빌드 성공 유지.

### 2.2 비목표 (Non-Goals)

- 서버/DB 스키마 **파괴적** 변경(기존 `game_sessions`/`players`/`quiz_answers` 유지, 컬럼은 후방호환 추가만, mock 폴백 보존).
- 결제·실명 인증 등 계정 시스템.
- 외부 유료 에셋(절차적 아트·이모지 레이어로 한정).
- 성취기준 **전 학년 전 과목** 일괄 입력(본 PRD는 구조 + 5학년 전량 + 인접 학년 시드 분량까지).

---

## 3. 기능 요구사항

### 3.1 [EPIC A] 교사 대시보드 실시간 모니터링 + 새로고침 (R1, D1·D5·D7)

#### A-1 폴링 로직 추출 & 수동 새로고침
- `index.tsx:141-189`의 `fetchSessionData`를 **`useCallback`으로 추출**(`sessionRef` 의존)하여 (a) 10초 자동 폴링과 (b) **새로고침 버튼**이 동일 함수를 공유하게 한다.
- 헤더(접속 대원/상태 배지 옆, `index.tsx:354-380`)에 **🔄 새로고침 버튼** 추가. 클릭 시 `fetchSessionData()` 즉시 실행 + Presence 재-sync 트리거.

#### A-2 동기화 상태 표시 (관측 가능성)
- 새로고침 버튼에 로딩 스피너(요청 중 회전) + **마지막 갱신 시각**(`lastDbUpdate` 재사용) + **연결 상태 점**(green=정상, amber=offline mock, red=마지막 폴링 실패).
- D7 해소: `fetchSessionData` catch에서 `setSyncError(true)` 상태를 두고 배지에 반영(현재 `console.error`만 — 교사 비가시).

#### A-3 활동 단위 일원화 (선택지 분포 정확화 — D2 선결)
- A는 **D2(EPIC B의 B-1과 공유)**에 의존: 세션에 `questionIds`가 채워져야 `AnswerDistributionPanel`이 문항별 분포를 정확히 집계. B-1에서 questionIds 세팅을 보장하면 A의 실시간 분포도 정상화.
- 학생 1명당 표시 항목 정합: 현재 화면(`currentActivity`)·정답 점수·콤보·정답률·최근 정오답을 새로고침 후 일관 표시.

#### A-4 실시간 반영 경로 점검
- 학생 측 활동(퀴즈 답안·카드 해금·배틀)이 대시보드에 도달하는 3경로(Presence `classroom_lobby_*`, Broadcast `dashboard_events_*`, DB `players`/`quiz_answers` 폴링)를 점검하고, **새로고침이 셋 모두를 강제 동기화**하도록 통합.
- 오프라인 mock 모드(`IS_OFFLINE_MODE`)에서도 새로고침 버튼은 동작(시뮬레이션 학생 갱신 + "오프라인" 표시).

#### A-5 검증 가능 기준 (AC)
- 학생 탭에서 퀴즈 1문제 정답 → 교사 탭 새로고침 클릭 → **5초 내** 해당 학생 점수·정답률 갱신.
- 새로고침 중 스피너 노출, 완료 후 "방금 전/HH:MM:SS" 갱신.
- 폴링 실패를 강제(네트워크 차단)하면 연결 상태 점이 red로 바뀌고 교사에게 보임.
- `questionIds`가 채워진 세션에서 선택지 분포(1~4번 막대)가 실제 학생 응답과 일치.

---

### 3.2 [EPIC B] 성취기준 보드 ↔ 문항 연동 (R2·R3, D2·D3·D4·D6)

> 핵심: **성취기준은 출제 풀의 필터 차원**이다. 교사가 보드에서 성취기준을 켜면 그 성취기준에 태깅된 문항만 출제 후보가 되고, 끄면 제외된다. 학년·난이도도 동일한 필터 축으로 확장한다.

#### B-1 문항 메타데이터 도입 (D3·D4) — 후방호환
- `BaseQuestion`(`types/index.ts:94-102`)에 **선택 필드 추가**(기존 320문항 무손상):
  - `standardCodes?: string[]` — 연결된 성취기준 코드 배열 (예: `['6과01-01']`)
  - `gradeLevel?: number` — 학년 (기본값 미지정 시 5로 간주하는 마이그레이션)
  - `difficulty?: 'easy' | 'medium' | 'hard'` — **이미 존재**, 데이터 채움 강화
- `data/standards.ts` 신규: 2022 개정 교육과정 **성취기준 카탈로그**.
  ```ts
  export interface AchievementStandard {
    code: string;        // '6과01-01'
    gradeBand: '3-4' | '5-6';
    gradeLevel: number;  // 5
    unitId: number;      // 1~8 (5학년 매핑), 신학년은 별도 unit 확장
    statement: string;   // 성취기준 진술문
    domain: string;      // 운동과 에너지 / 물질 / 생명 / 지구와 우주
  }
  ```
- **questionIds 세팅 버그(D2) 동시 해소**: `handleStartQuiz`가 활성 필터로부터 10문항을 뽑아 `questionIds`를 세션에 기록.

#### B-2 출제 풀 셀렉터 (순수 모듈)
- `lib/question-pool.ts` 신규 순수함수:
  ```ts
  interface QuestionFilter {
    unitIds?: number[];
    gradeLevels?: number[];
    difficulties?: ('easy'|'medium'|'hard')[];
    standardCodes?: string[];   // 선택된 성취기준 (빈 배열 = 전체)
    count?: number;             // 기본 10
  }
  selectQuestions(filter: QuestionFilter): Question[]
  ```
- 규칙: 선택된 성취기준의 합집합 문항 → 학년·난이도 교집합 → 셔플 → `count`개 슬라이스(기존 `getUnitQuestions` 셔플 규약 계승, `data/questions.ts:2976`).
- 후보가 `count` 미만이면 경고를 반환(교사 보드에 "선택 성취기준으로 N문항만 가능" 표시).

#### B-3 성취기준 보드 UI (교사 대시보드)
- 기존 RubricPanel(`단원 루브릭` 탭)을 **성취기준 보드 탭으로 확장**(또는 신규 탭 `📐 성취기준`):
  - 도메인/학년/단원별로 성취기준 카드 나열, 각 카드에 **토글(체크) + 연결 문항 수 뱃지**.
  - 토글 변경 시 하단에 **실시간 미리보기**: "현재 출제 풀 N문항 / 난이도 분포 / 학년 분포".
  - 난이도·학년 빠른 필터(칩).
- 선택 상태를 `classroomSession`에 보존: `selectedStandardCodes?: string[]`, `gradeFilter?: number[]`, `difficultyFilter?: (...)[]`.
- **연동 보장**: 보드에서 확정 → `handleStartQuiz`가 `selectQuestions(filter)`로 `questionIds` 생성 → 학생 `QuizScreen`이 `questionIds`(review 경로, `QuizScreen.tsx:21-24`)로 정확히 그 문항만 출제.

#### B-4 학생 출제 경로 연동
- `QuizScreen`은 이미 `questionIds` review 모드를 지원(`QuizScreen.tsx:118-122`). 교사 세션이 내려준 `questionIds`를 학생 퀴즈에 주입하는 경로를 확실히 연결(현재 단원만 보고 자체 셔플하는 경로와 분기).
- 배틀/레이드 문항도 필터 인지: D6 폴백(`getUnitQuestions(1)`)을 `selectQuestions(activeFilter)`로 대체.

#### B-5 다학년·고난이도 확장 기반
- 신규 학년 문항을 추가할 때 **데이터만 추가하면** 보드·풀·출제에 자동 반영되는 구조(코드 무수정).
- 고난이도: `difficulty: 'hard'` + 상위 학년 성취기준 태깅. 교사가 "고난이도만" 칩으로 빠른 구성.
- 본 PRD 범위: 구조 완성 + 5학년 320문항 메타 태깅(성취기준/난이도) + **인접 학년(6학년 또는 심화) 시드 1~2단원분** 추가로 다학년 동작 실증.

#### B-6 정합성 테스트 (회귀 방지, CI 게이트)
- 단위테스트: ① 모든 `question.standardCodes`는 `standards.ts`에 존재(미존재 0건) ② 모든 성취기준은 최소 1문항과 연결(고아 0건) ③ `selectQuestions`가 필터 교집합·셔플·count를 정확히 적용 ④ 빈 성취기준 선택 시 전체 풀로 폴백.

#### B-7 AC
- 교사가 보드에서 `[6과05-02]`만 켜고 퀴즈 개시 → 학생에게 그 성취기준 태깅 문항만 출제됨.
- 성취기준 2개 추가 → 출제 풀 문항 수 뱃지가 즉시 증가, 미리보기 분포 갱신.
- 난이도 'hard' 칩 활성 → 쉬운 문항 제외.
- 기존 320문항·E2E·빌드 전부 그린(메타 필드는 선택적이라 무손상).

---

### 3.3 [EPIC C] 배틀 모드 확장 + 안정성 (R4, D6)

#### C-1 안정성 — 상태 머신 정리
- `CardBattleArena`(709줄) + `battle/`(`MatchmakingScreen`/`DeckSelectScreen`/`BattleCombatScreen`/`BattleResultScreen`) 흐름의 **명시적 상태 전이**(matchmaking→deck→combat→result) 가드 강화: 잘못된 전이·중복 라운드 해소·타이머 누수 0.
- Supabase Broadcast 배틀 동기화(`useBattleState`, `realtime.ts:149`) **예외 복구**: 상대 이탈/타임아웃 시 부전승·재매칭 처리, `subscribeWithReconnect` 백오프 경로 검증.
- D6 제거: 배틀 문항 폴백 하드코딩(`CardBattleArena.tsx:389`)을 활성 필터/단원 기반 `selectQuestions`로 대체.

#### C-2 확장 — 모드/규칙/밸런스
- **신규 배틀 변형**(택1~2부터): 베스트오브3, 속도전(선답 보너스), 속성 상성 강조전(`lib/attributes.ts` 활용), 핸디캡(저CP 보정).
- 덱 구성 UX 개선(3장 선택 + 상성 미리보기), 결과 화면에 **카드 XP 획득**(F4 경제 정책: 코인 직접지급 금지, XP만) 명확 노출.
- 교사 토너먼트(`ControlPanels` `handleStartTournament`, 브래킷)와 PvP 배틀의 일관 규칙.

#### C-3 안정성 테스트
- 단위: 라운드 해소·승패 판정·상성 배율·타임아웃 처리.
- E2E: `?e2e=battle` 진입 훅(HANDOFF 기재)으로 매치메이킹→전투→결과 1회 완주, 어서션 텍스트는 `MatchmakingScreen` 등에서 안정 확보.

#### C-4 AC
- 상대 강제 이탈 시 크래시 없이 부전승 + 결과 화면 도달.
- 동일 세션 10회 배틀 반복 시 타이머/리스너 누수 0(개발자도구 확인 기준 정의).
- 배틀 문항이 활성 성취기준/단원 필터를 따름.

---

### 3.4 [EPIC D] 과학 포켓몬 월드 & 유니버스 확장 (R5)

> 외부 에셋 0. `LobbyScene`(Phaser, 절차적) + 도감/카드 시스템 확장. PRD-F4 EPIC E(로비 비주얼)와 **중복 구현 금지** — 본 EPIC은 "월드 콘텐츠·진행 루프" 중심, F4는 "비주얼 폴리시" 중심으로 역할 분담.

#### D-1 월드 존(Zone) 확장
- 기존 존(퀴즈/배틀/레이드/박물관/센터/체육관) 외 **신규 존 1~2개**: 예) "연구소(Lab)"(일일 탐구 미션) 또는 "관측소(Observatory)"(지구·우주 단원 테마). 절차적 바닥/오브젝트로 표현.
- 존 진입 시 학습 콘텐츠 연결(해당 단원/성취기준 퀴즈·도감 열람).

#### D-2 유니버스(도감) 확장
- 다학년 문항 도입(EPIC B)에 맞춰 **신학년 카드 세트** 확장 여지 정의(카드 ID 규칙 `u{unit}_c{idx}` 계승, `CLAUDE.md` 데이터 레이어 규약 준수).
- 도감 완성도/속성 시스템(`lib/attributes.ts`)과 정합, 신규 속성/상성은 후방호환 추가.

#### D-3 진행 루프
- 월드 탐험 → 퀴즈/배틀 → 카드 XP·트레이너 랭크(F4 `lib/progression.ts` 단일 소스) → 신규 존/카드 해금의 **일관 루프** 정의.

#### D-4 성능·접근성 AC
- 교실 PC에서 30fps↑, Phaser cleanup 누수 0(`CLAUDE.md` `game.destroy(true)` 규약).
- `prefers-reduced-motion` 대응, 빔프로젝터 가독성(I2 접근성 정책 계승).

> D는 범위가 크므로 **Phase 4에서 1개 존 + 진행 루프 정의를 MVP로** 우선하고, 카드 대량 확장은 다학년 콘텐츠 확정 후 별도 트랙으로 분리한다.

---

### 3.5 [EPIC E] 자율 추가 제안 (R6)

검토 후 채택 여부를 Phase 진입 시 결정(기본은 제안 상태):

- **E-1 교사 빠른 처방 연동**: 대시보드 AI 처방(`getAiStudentPrescription`)이 학생 약점 성취기준을 짚고, **원클릭으로 그 성취기준 복습 퀴즈를 해당 학생/학급에 출제**(EPIC A·B 결합).
- **E-2 성취기준별 학급 히트맵**: Stats 탭에 성취기준 × 정답률 히트맵(취약 성취기준 시각화) → CSV 내보내기 확장.
- **E-3 세션 리플레이/타임라인**: 활동 피드(`ActivityFeed`)를 세션 종료 후 타임라인으로 저장·열람(오프라인 Base64 코드 경로 재사용).
- **E-4 출제 프리셋 저장**: 자주 쓰는 성취기준+난이도 조합을 프리셋으로 저장/불러오기(localStorage).
- **E-5 배틀 관전 모드**: 교사 빔프로젝터에 진행 중 배틀 1건 대형 중계.
- **E-6 적응형 난이도**: 학생 정답률에 따라 다음 문항 난이도 자동 조정(EPIC B 풀 셀렉터 확장).

---

## 4. 데이터/상태 변경 요약

```
types/index.ts — BaseQuestion (후방호환, 모두 선택 필드)
  + standardCodes?: string[]
  + gradeLevel?: number

types/index.ts — ClassroomSession
  + questionIds?: string[]            // D2: 출제 10문항 ID (현재 미세팅 → 세팅 보장)
  + selectedStandardCodes?: string[]  // B-3: 성취기준 보드 선택
  + gradeFilter?: number[]            // B-3
  + difficultyFilter?: ('easy'|'medium'|'hard')[]  // B-3

신규 데이터/모듈
  data/standards.ts        — 성취기준 카탈로그 (AchievementStandard[])
  lib/question-pool.ts     — selectQuestions(filter) 순수 셀렉터
  (기존) data/questions.ts — standardCodes/gradeLevel/difficulty 메타 태깅 (마이그레이션)

교사 대시보드
  TeacherDashboard/index.tsx — fetchSessionData를 useCallback 추출(A-1), 새로고침 버튼·동기화 상태(A-2/D7)
  ControlPanels.tsx          — handleStartQuiz가 selectQuestions로 questionIds 생성(B-1/D2)
  RubricPanel.tsx → 성취기준 보드 확장 또는 신규 StandardsBoard.tsx (B-3)
```

> DB: 후방호환 컬럼 추가만(예: `quiz_answers`는 기존 그대로 사용). 스키마 변경 없이 구현 가능하면 우선. mock 폴백 보존.

---

## 5. 실행 계획 (순차 Phase — 언제든 착수 가능)

> 원칙: TDD(테스트 먼저) · 작은 PR · 매 단계 `tsc`+단위+E2E17+정적빌드 그린. 신규 로직은 **순수 모듈**(`lib/question-pool.ts` 등)로 분리해 `game-state.ts`(1269줄) 비대화·리스크 회피. 검증 명령은 `HANDOFF.md` §검증 명령 그대로.

### Phase 1 — 교사 실시간 모니터링 + 새로고침 (EPIC A) · 약 1일
| 순서 | 작업 | 산출물 | AC |
|------|------|--------|-----|
| 1.1 | `fetchSessionData` `useCallback` 추출, 10초 폴링과 공유 | index.tsx diff | A-1 |
| 1.2 | 헤더에 🔄 새로고침 버튼 + 스피너 + 마지막 갱신/연결 상태 | UI | A-2 |
| 1.3 | 폴링 실패 가시화(D7), 오프라인 mock 새로고침 동작 | 상태 배지 | A-4 |
| 1.4 | (D2 선결) `questionIds` 세팅 → 선택지 분포 정확화 | ControlPanels diff | A-3 |
게이트: `tsc`+단위+E2E17+빌드 그린. 새 단위테스트: 새로고침 핸들러·동기화 상태.

### Phase 2 — 성취기준 ↔ 문항 연동 기반 (EPIC B 핵심) · 약 2~3일
| 순서 | 작업 | AC |
|------|------|-----|
| 2.1 | `types` 메타 필드 추가(후방호환) + `data/standards.ts` 카탈로그(5학년 전량) | tsc 그린 |
| 2.2 | 320문항 `standardCodes`/`difficulty` 메타 태깅 마이그레이션 | 정합성 테스트(B-6) |
| 2.3 | `lib/question-pool.ts` `selectQuestions` + 단위테스트 | B-6 |
| 2.4 | `handleStartQuiz`가 필터→`questionIds` 생성, 학생 `QuizScreen` 연동 | B-7 |
| 2.5 | 성취기준 보드 UI(토글·문항 수 뱃지·미리보기) | B-7 |
게이트: 동일 + 정합성 테스트 CI 게이트화 + 보드 렌더 E2E.

### Phase 3 — 다학년·고난이도 확장 (EPIC B 확장) · 약 1~2일
| 순서 | 작업 | AC |
|------|------|-----|
| 3.1 | `gradeLevel` 필터 + 학년/난이도 칩 UI | B-5 |
| 3.2 | 인접 학년/심화 시드 문항 1~2단원분 + 성취기준 태깅 | 다학년 동작 실증 |
| 3.3 | 배틀/레이드 폴백을 `selectQuestions`로 교체(D6) | C-1 일부 |
게이트: 동일.

### Phase 4 — 배틀 안정성 + 확장 (EPIC C) · 약 2~3일
| 순서 | 작업 | AC |
|------|------|-----|
| 4.1 | 배틀 상태 전이 가드·타이머/리스너 누수 0 | C-4 |
| 4.2 | Broadcast 동기화 예외 복구(이탈/타임아웃/부전승) | C-4 |
| 4.3 | 신규 배틀 변형 1~2종 + 덱/결과 UX(코인 미지급·XP 노출) | C-2 |
| 4.4 | 배틀 E2E(`?e2e=battle`) 완주 | C-3 |
게이트: 동일 + 배틀 E2E.

### Phase 5 — 과학 포켓몬 월드/유니버스 확장 (EPIC D) · 약 2~3일
| 순서 | 작업 | AC |
|------|------|-----|
| 5.1 | 신규 존 1개(절차적) + 진입 학습 콘텐츠 연결 | D-1 |
| 5.2 | 월드 진행 루프(탐험→퀴즈/배틀→랭크→해금) 정의·연결 | D-3 |
| 5.3 | 성능/접근성(30fps·cleanup·reduced-motion) | D-4 |
게이트: 동일 + 시각 회귀(320/768/1024/1440) + 누수 점검.

### Phase 6 (선택) — 자율 제안 채택분 (EPIC E)
- E-1(처방→복습 출제) + E-2(성취기준 히트맵)을 우선 후보로, Phase 2·1 산출물 재사용. 진입 시 합의.

---

## 6. 위험 & 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| 메타 필드 추가가 기존 320문항/빌드와 충돌 | 빌드·E2E 깨짐 | 전부 **선택(optional) 필드** + 마이그레이션 1회 + 정합성 테스트 |
| `questionIds` 세팅 변경이 학생 퀴즈 경로와 충돌 | 출제 불일치 | review 모드 경로(`QuizScreen.tsx:118-122`) 재사용, 단원 셔플 폴백 유지 |
| 성취기준 태깅 오타로 고아/미존재 발생 | 출제 풀 비정상 | B-6 정합성 단위테스트를 CI 게이트로 |
| 배틀 Broadcast 동기화 변경 회귀 | 멀티기기 깨짐 | mock 폴백 우선 검증 + 백오프 경로 테스트, 작은 PR |
| Phaser 월드 확장 성능 저하 | 교실 PC 끊김 | 파티클 상한·renderGroup·cleanup 규약, fps 측정 |
| 정적 빌드 제약(`useSearchParams` 등) | 빌드 실패 | 기존 Suspense 규약 준수, 동적 import는 `ssr:false` |

---

## 7. 성공 지표 (수용 기준 종합)

- 교사 새로고침 1회로 학생 활동이 5초 내 동기화, 동기화/연결 상태 가시화 ✔ (A)
- 성취기준 토글 → 출제 문항이 실제로 변경(켜면 포함/끄면 제외) ✔ (B)
- 다학년·고난이도 문항이 **데이터 추가만으로** 보드·풀·출제에 반영 ✔ (B)
- 미존재 성취기준 0건·고아 성취기준 0건(테스트 강제) ✔ (B-6)
- 배틀 상대 이탈/타임아웃에도 크래시 0·누수 0, 변형 모드 동작 ✔ (C)
- 신규 월드 존 + 진행 루프 동작, 30fps↑·cleanup 누수 0 ✔ (D)
- 전 Phase에서 `tsc`+단위+E2E17+정적빌드 그린 유지 ✔ (G-6)

---

## 8. 미해결 / 추가 결정 필요 (착수 시 확인)

- **성취기준 보드 위치**: 기존 `루브릭` 탭 확장 vs 신규 `성취기준` 탭 — Phase 2 진입 시 결정(기본: 신규 탭, 루브릭은 유지).
- **다학년 범위**: 6학년 정규 vs 5학년 심화(고난이도) 우선 — Phase 3 진입 시 결정(기본: 5학년 심화 우선, 콘텐츠 제작 부담 최소).
- **DB 컬럼 추가 여부**: `questionIds`·성취기준 선택을 세션 객체(클라이언트)만으로 처리 가능하면 스키마 무변경 우선. Broadcast로 충분한지 Phase 1·2에서 확인.
- **신규 배틀 변형 우선순위**: 베스트오브3 / 속도전 / 상성전 중 택 — Phase 4 진입 시 결정.
- **신규 월드 존 테마**: 연구소(일일미션) vs 관측소(지구·우주) — Phase 5 진입 시 결정.
- **EPIC E 채택 범위**: E-1·E-2 우선, 나머지는 여력 따라.
```
