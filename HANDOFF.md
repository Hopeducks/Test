# 다음 세션 인수인계 (Handoff)

> 마지막 업데이트: 2026-06-04 · 브랜치 `main` (origin과 동기화 완료)

## 현재 상태 한 줄 요약
Phase G1(대형 컴포넌트 분리) 3/5 완료. 빌드·테스트 전부 그린. 다음은 **StudentLobby**와 **game-state.ts** 분리.

## 검증 명령 (작업 전후 항상 실행)
```bash
npx tsc --noEmit        # 타입 체크
npm test                # Vitest 단위 30개
npm run build           # 정적 빌드(output: export)
npm run test:e2e        # Playwright E2E 11개 (크로미움 설치 필요시 아래 참고)
```
- Playwright 브라우저 미설치 시: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx playwright install chromium`
  (회사망 self-signed 인증서 우회 — 이 환경 특이사항)

## 완료된 작업 (이번 세션, 모두 push됨)
| 커밋 | 내용 |
|------|------|
| `b8e3b48` | Vitest 도입 + 단위 30개 + E2E 11개 전부 통과로 수정 |
| `05580d0` | QuizScreen 1165→678줄 → `components/ui/quiz/` |
| `2ff66b9` | CardBattleArena 1344→709줄 → `components/ui/battle/` |
| `2ee044a` | AvatarCustomizer 1060→742줄 → `components/ui/avatar/` |
| `417a425` | .gitignore에 Playwright 산출물 추가 |

## 다음 작업 (우선순위 순)

### 1. Phase G1 잔여 — 대형 컴포넌트 분리
적용한 분리 패턴(검증됨): **1회 읽기 → 순수 모듈/프리젠테이션 컴포넌트 추출 → 컨테이너는 상태·로직·이펙트만 유지 → props로 위임 → 동작 100% 보존**.

- **StudentLobby.tsx (~1299줄)** — 이미 10개 하위 컴포넌트를 dynamic import 중. 핸들러 위주라
  `getUnitInfo` 헬퍼 + 로비 맵/존 패널/시뮬레이션 핸들러 그룹을 분리하면 효과적.
- **game-state.ts (1328줄)** — 싱글톤 + 옵저버. 주의: 다수 컴포넌트가 import.
  속성 시스템(ATTRIBUTE_* 상수, getCardAttribute/getAttackMultiplier/getEffectivenessLabel)을
  `lib/attributes.ts`로 추출하고 game-state에서 **re-export**해 하위 호환 유지가 안전.
  (QuizScreen·CardBattleArena가 game-state에서 이 함수들을 import 중 — 깨면 안 됨)

### 2. Phase G1 완료 후 남은 PRD 항목
- **H1**: 힌트 시스템 1~7단원 미완성 (8단원만 구현, `data/questions.ts`의 `hint?` 필드)
- **G3**: E2E 확대 — 퀴즈 풀 플로우/카드 배틀/보스 레이드 미커버
- **H3**: CSV 내보내기 + 학생 결과코드 수집 완성도 점검
- **I2**: 빔프로젝터 접근성 (최소 20px 텍스트, 48px 터치 영역 감사)

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
