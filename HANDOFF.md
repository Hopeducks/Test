# 다음 세션 인수인계 (Handoff)

> 마지막 업데이트: 2026-06-05 · 브랜치 `main` (G3 커밋 푸시 대기)

## 현재 상태 한 줄 요약
**Phase G1 완료(5/5) + G3 퀴즈 플로우 E2E 완료.** 전부 그린(tsc·단위30·빌드·E2E15). 다음은 G3 잔여(배틀/레이드 E2E) 또는 H3/I2/H1.

## 검증 명령 (작업 전후 항상 실행)
```bash
npx tsc --noEmit        # 타입 체크
npm test                # Vitest 단위 30개
npm run build           # 정적 빌드(output: export)
npm run test:e2e        # Playwright E2E 11개 (크로미움 설치 필요시 아래 참고)
```
- Playwright 브라우저 미설치 시: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright install chromium`
  (회사망 self-signed 인증서 우회 — 이 환경 특이사항)

## 완료된 작업

### 이번 세션 (2026-06-05, 로컬 커밋 — push 필요)
| 커밋 | 내용 |
|------|------|
| `46c4ca0` | 속성 시스템을 `lib/attributes.ts`로 추출, game-state에서 re-export (1328→1269줄) |
| `abbf0ef` | StudentLobby 1299→989줄 → `components/ui/lobby/` (EntryScreen·QuestsPanel·ShopModal) |

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
- **G3 (진행 중)**: E2E 확대
  - ✅ 퀴즈 플로우 4개 추가 (`e2e/quiz-flow.spec.ts`, 커밋 `ddc1346`) — 진입·QUIT 모달·중단·해설 표시
  - ⬜ 카드 배틀 / 보스 레이드 미커버. **주의**: 둘 다 StudentLobby의 Phaser 메타버스 존을 거쳐야
    진입(`activeScreen` 'battle'/'raid'). Phaser canvas(ssr:false) 상호작용은 E2E에서 취약 →
    진입 경로용 test-only 훅이나 `data-testid` 사이드패널 버튼 노출이 필요. 비용·난이도 높음.
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
