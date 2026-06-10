# 작업 백로그 (우선순위 정렬)

> 작성: 2026-06-10 · 전반적 코드 검토 결과 · 브랜치 `main`
> 검토 시점 상태: **전부 그린** — tsc 0 · 단위 240 · E2E 36 · 빌드 196 kB · lint 클린
> PRD F4·F7·F8 전 Phase 완료. 800줄 초과 소스 파일 0개(데이터 파일 제외).

이 문서는 "남은 결함"이 아니라 **완성도를 더 끌어올리기 위한 개선 항목**이다.
코드베이스는 이미 출하 가능 상태다.

---

## ✅ P1 — 테스트 커버리지 80% 달성 (완료 2026-06-10)

**달성**: Stmts 58%→**84%**, Lines 58%→**85%**, Branches 51%→**79%**. 단위 240→**346개**(+106).
신규 테스트 파일 5개: `state-storage`·`state-modules`·`reference-data`·`game-state-manager`·sound-engine 보강.
각 순수 모듈 90~100% 도달(storage 96·migration 100·player-state 100·daily-stats 100·card-xp 91·
battle-engine·badge-system·rubrics·standards). game-state.ts 37%→77%, audio.ts 66%→상승.
남은 0% 미달: `lib/use-game-state.ts`(React 훅 — jsdom 필요), `data/questions.ts`(정적 데이터). 저우선.

<details><summary>원래 계획(참고)</summary>

대상은 전부 순수 로직 모듈이라 빠르고 저위험으로 작성 가능. 컴포넌트는 E2E가 담당하므로 lib/data에 집중.

가장 낮은 커버리지부터 (전용 테스트 없음 또는 thin):

| 모듈 | 현재 | 줄수 | 비고 |
|------|------|------|------|
| `lib/game-state-storage.ts` | 3.6% | 112 | 직렬화/역직렬화 — 순수, 고가치 |
| `lib/legacy-migration.ts` | 3.6% | 65 | 구버전 마이그레이션 — 순수 |
| `lib/player-state.ts` | 13% | 67 | 플레이어 상태 헬퍼 — 순수 |
| `lib/daily-stats.ts` | 45% | 50 | 일일 통계 — 순수 |
| `lib/card-xp.ts` | 60% | 65 | 카드 XP/레벨업 |
| `lib/audio.ts` | 66% | 408 | AudioContext mock 필요 |
| `lib/attributes.ts` | (전용X) | 77 | 배틀 상성/배율 — 순수, 고가치 |
| `lib/battle-engine.ts` | (전용X) | 55 | 전투 계산 — 순수 |
| `lib/cp-calculator.ts` | 73% | 52 | CP 계산 |
| `lib/badge-system.ts` | (전용X) | 33 | 배지 |
| `data/rubrics.ts` | 0% | 187 | RubricPanel에서 사용 중(데드코드 아님) |

**작업 순서(권장)**: storage → migration → player-state → attributes →
daily-stats → card-xp → battle-engine → cp-calculator → badge-system → audio.
각 모듈 테스트 추가 후 `npx vitest run` 그린 확인.

</details>

---

## ✅ P2 — 문서/타입 정합 (완료 2026-06-10)

- `uncommon`은 실제 사용 중(카드 16개 + PokedexGrid/CardArt). 타입이 옳고 **SPEC가 미흡**이었음.
- SPEC.md를 5등급으로 수정: common 32/uncommon 16/rare 16/epic 8/legendary 8.
  색상도 정정 — rare는 블루, uncommon이 에메랄드(기존 "rare=초록 에메랄드" 오기 수정). 2.2 목록 + 인터페이스 두 곳.

---

## ✅ P3 — 경량 정리 (완료 2026-06-10)

- `lib/supabase/client.ts` mock RPC의 `console.log` 제거.
- `scratch/`를 `.gitignore`에 추가 + `git rm --cached`로 추적 제외(로컬 파일은 보존).

---

## P4 — 툴링 현대화 (Next 16 대비)

- **`next lint` deprecated** — Next.js 16에서 제거 예정.
  `npx @next/codemod@canary next-lint-to-eslint-cli .`로 ESLint CLI 전환.
  (ESLint 8 고정 제약 주의 — CLAUDE.md: 9로 올리면 circular JSON 오류)

---

## 검증 명령 (작업 전후 항상)

```bash
npx tsc --noEmit        # 0 errors
npm test                # Vitest 단위 (현 240)
npm run build           # 정적 빌드 (output: export, ≤200 kB)
npm run test:e2e        # Playwright E2E (현 36)
npm run lint            # ESLint 클린
```
