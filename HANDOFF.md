# 다음 세션 인수인계 (Handoff)

> 마지막 업데이트: 2026-06-05 · 브랜치 `main`

## 현재 상태 한 줄 요약
**Phase G3·H3 완료.** 전부 그린(tsc·단위30·빌드·E2E17). 다음은 I2 또는 H1.

## 검증 명령 (작업 전후 항상 실행)
```bash
npx tsc --noEmit        # 타입 체크
npm test                # Vitest 단위 30개
npm run build           # 정적 빌드(output: export)
npm run test:e2e        # Playwright E2E 17개 (크로미움 설치 필요시 아래 참고)
```
- Playwright 브라우저 미설치 시: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright install chromium`
  (회사망 self-signed 인증서 우회 — 이 환경 특이사항)

## 완료된 작업

### 이번 세션 (2026-06-05, 커밋됨)
| 커밋 | 내용 |
|------|------|
| `46c4ca0` | 속성 시스템을 `lib/attributes.ts`로 추출, game-state에서 re-export (1328→1269줄) |
| `abbf0ef` | StudentLobby 1299→989줄 → `components/ui/lobby/` (EntryScreen·QuestsPanel·ShopModal) |
| `ddc1346` | 퀴즈 플로우 E2E 4개 추가 (11→15개) |
| `f73f683` | 배틀/레이드 E2E 추가, test-only 진입 훅 구현 (15→17개) |

### 이전 세션 (push됨)
| 커밋 | 내용 |
|------|------|
| `b8e3b48` | Vitest 도입 + 단위 30개 + E2E 11개 전부 통과로 수정 |
| `05580d0` | QuizScreen 1165→678줄 → `components/ui/quiz/` |
| `2ff66b9` | CardBattleArena 1344→709줄 → `components/ui/battle/` |
| `2ee044a` | AvatarCustomizer 1060→742줄 → `components/ui/avatar/` |
| `417a425` | .gitignore에 Playwright 산출물 추가 |

> **Phase G1 완료(5/5):** QuizScreen·CardBattleArena·AvatarCustomizer·game-state·StudentLobby.
> 검증된 분리 패턴: **1회 읽기 → 순수 모듈/프리젠테이션 컴포넌트 추출 → 컨테이너는 상태·이펙트·핸들러만 유지 → props 위임 → 동작 100% 보존**.

## 다음 작업 (남은 PRD 항목, 우선순위 순)
- ✅ **G3 완료**: E2E 17개 (퀴즈 플로우 4개 + 배틀/레이드 2개)
  - `?e2e=battle` → `activeScreen='battle'` 직접 주입 / `?e2e=raid` → player까지 주입
- ✅ **H3 완료**: CSV 내보내기 기존 완성 확인 + 학생 오프라인 제출 코드 수집 신규 구현
  - `StatsPanel`에 Base64 코드 붙여넣기 → 디코딩 → 미리보기 → 학급 명단 upsert 섹션 추가
  - `UnitComplete.btoa` ↔ `StatsPanel.atob` 완전 연결 (커밋 24af7f6)

  **(참고) 시도했던 UI 경로 — 복귀 학생에선 작동 안 함:**
  배틀은 ~~UI 경로로 도달 가능~~. 사이드패널 버튼만 누르면 됨:
  1. localStorage 셋업(role/name/avatar) 후 `/` 진입 → reload (기존 `goToQuiz` 헬퍼와 동일 패턴)
  2. 헤더 버튼 **"교실 대기실 입장"** 클릭 → `activeScreen='lobby'`, 로비 입장 화면 표시
  3. "혼자 연습하기"에서 **1단원 버튼**(`LobbyEntryScreen`) 클릭 → `handleInitSimulatedLobby` →
     `isSimulatedLobby=true`, `joinedPlayer`(mockPlayer) 설정 → 좌측 패널에 배틀 버튼 노출
  4. 좌측 패널 **"배틀 스타디움 즉시입장"** 클릭 → `onStartBattle` → `activeScreen='battle'`
  5. `CardBattleArena` 렌더, 초기 `phase='matchmaking'` (component state 기본값).
     → 안정적 assertion 텍스트는 매치메이킹 화면에서 확인 필요(`components/ui/battle/MatchmakingScreen.tsx` 1회 읽기).
  - **검증 필요 리스크**: 시뮬레이션 로비 우측 패널이 `PhaserCanvas`(dynamic ssr:false)를 렌더 →
    헤드리스 크로미움에서 로딩 동작을 **실제 1회 실행으로 확인**해야 함(좌측 버튼은 canvas와 독립이라
    클릭 자체는 가능할 것으로 예상). 깨지면 빠르게 중단하고 test-only 진입 훅으로 전환.
  - **보스 레이드**: UI 버튼 없음 — Phaser West 존 클릭 또는 교사 `classroomSession.status='raid'`
    브로드캐스트로만 진입. E2E엔 **test-only 진입 훅 필요**(예: `app/page.tsx`에서 `?e2e=raid` 쿼리로
    초기 `activeScreen`+`player` 주입). raid 화면은 `activeScreen==='raid' && player` 조건이라 player도 필요.
- **H1**: 힌트 시스템 — **핸들오프 정정**: "8단원만 구현"은 부정확. 실제로는 **모든 단원의 1~3번 문항**에만
  힌트 존재(8×3=24개). 나머지 296문항(`data/questions.ts` 등 4개 파일의 `hint?` 필드)에 힌트 추가가 H1.
  SPEC.md엔 힌트 요구사항 없음(UX 보조). 대량 콘텐츠 작업이라 단원별 분할 권장.
- **H3**: CSV 내보내기 + 학생 결과코드 수집 완성도 점검
- **I2**: 빔프로젝터 접근성 (최소 20px 텍스트, 48px 터치 영역 감사)

> game-state.ts는 아직 1269줄(>800)이지만 싱글톤+옵저버라 추가 분리는 리스크 높음. 우선순위 낮음.
> 퀴즈는 문항을 셔플(`getUnitQuestions` → `sort(random).slice(0,10)`)하므로 E2E는 문항 타입 무관 헬퍼 사용.

## 알아둘 점 / 함정
- **정적 빌드**: `output: 'export'`. `useSearchParams`는 반드시 `<Suspense>` 경계 안에서.
- **tsconfig include `**/*.ts`** → `__tests__`도 빌드 타입체크 대상. 테스트의 유니온 타입 접근은
  `isMCQuestion` 같은 타입가드로 좁혀야 빌드 통과(이미 적용됨).
- **데이터 SPEC 불일치**: `data/cards.ts`에 `epic` 등급 카드 8개 존재. 타입(`CardRarity`)엔 있으나
  SPEC.md는 3등급만 명시 — 추후 SPEC 정리 필요(코드 동작엔 무해).
- **미연동 의심 컴포넌트 점검 완료**: NpcQuestModal/GymLeaderBattle/PokemonCenter/
  TournamentBracketView 모두 StudentLobby에 정상 연결됨 — 데드코드 아님.
- 커밋 메시지는 한국어 conventional, 기여자 표기 비활성(전역 설정).

## 비용 메모
이번 세션 비용이 매우 높았음($126+). 대형 파일 읽기/재작성이 토큰을 많이 소모.
다음 세션은 game-state 속성 모듈 추출처럼 **이미 읽은 범위 위주의 타겟 작업**부터 시작하면 효율적.
