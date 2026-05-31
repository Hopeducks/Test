# 과학 마스터 메타버스 — 주요 학습 레슨 (Top 5 Lessons Learned)

과학 마스터 메타버스 프로젝트를 설계, 구현 및 통합·검증하면서 발견한 5가지 핵심 기술적 교훈과 최적화 전략을 기록합니다.

---

## 1. Next.js 15 정적 내보내기(Static Export) 및 동적 라우팅 제약
- **현상**: `output: 'export'` 설정 시, dynamic routing 룸(`/teacher/[code]`)에서 서버 컴포넌트 레벨로 `searchParams`를 비동기적으로 조회하면 빌드 오류(`cannot be rendered statically because it used searchParams`)가 발생합니다. 빌드 시점에는 주소창의 쿼리 스트링(`?key=teacherKey`)을 결정할 수 없기 때문입니다.
- **교훈**: 동적 경로를 포함하는 정적 배포 페이지의 경우, 서버 컴포넌트는 `generateStaticParams()`를 통해 더미 파라미터로 정적 경로 구색만 갖추고, 쿼리 스트링 탐색과 같은 동적 동작은 클라이언트 컴포넌트 내부에서 `useSearchParams()` 훅을 사용하여 완전한 런타임 클라이언트 로직으로 이관하고 이를 `<Suspense>` 경계로 격리해야 정상 빌드됩니다.

## 2. ESLint 9 플랫 설정과 Next.js 호환성 관리
- **현상**: Next.js 15 환경에서 최신 ESLint 9 버전을 기본 설치하면 기존 `.eslintrc.json` 호환 모듈에서 순환 종속성 직렬화 오류(`Converting circular structure to JSON`)가 발생하여 린트 점검이 실패합니다.
- **교훈**: 무작정 최신 메이저 버전을 설치하기보다 프로젝트의 Next.js 프레임워크 린트 내장 모듈의 의존성을 고려하여 호환성이 입증된 ESLint 8 버전으로 핀 고정하고, 사이버펑크 스타일 리터럴 주석 기호(`// ...`)와 같은 특이 요소를 위해 `react/jsx-no-comment-textnodes` 등의 상세 규칙 예외를 적절히 튜닝하여 빌드 파이프라인의 자동 린트 검문을 유지하는 것이 효율적입니다.

## 3. 실시간 다중 사용자 위치 동기화(Supabase Broadcast) 최적화
- **현상**: WASD 이동 조작을 매 프레임마다 PostgreSQL DB 테이블에 직접 Update 쿼리로 날리면 DB 커넥션 과부하가 발생하고 프레임 드랍이 유발됩니다.
- **교훈**: 빈번한 캐릭터 좌표 이동 동기화는 DB 쓰기 트랜잭션이 아닌 메모리 기반 웹소켓 전파 장치인 **Supabase Realtime Broadcast** 채널을 이용하여 클라이언트당 `100ms` 주기로 스로틀링(Throttling) 전송해야 동시 동시 접속 대원수가 40~60명 규모로 늘어나더라도 부드러운 화면 갱신(Lerp)과 대역폭 안정을 얻을 수 있습니다.

## 4. Phaser 4 Canvas 메모리 누수 및 SSR 바인딩 예방
- **현상**: Next.js App Router 환경에서 Phaser 패키지를 일반 모듈 방식으로 로드하면 서버 사이드 렌더링 시 브라우저 전용 객체(`window`, `document`) 미지원으로 프로세스가 터집니다. 또한, 페이지 이탈 시 Phaser 인스턴스가 계속 메모리에 남거나 중복 캔버스가 그려지는 메모리 누수가 발생합니다.
- **교훈**: Phaser 구성 컴포넌트는 React의 lazy-loading 기법(`dynamic(() => import(...), { ssr: false })`)을 적용하여 로드 시점을 철저히 브라우저 마운트 이후로 미뤄야 하며, React `useEffect` cleanup 생명주기에서 `gameRef.current?.destroy(true)`를 명시적으로 호출해 물리 엔진 및 이벤트 바인딩 리소스를 완벽히 회수해 주어야 합니다.

## 5. 보안적인 핵심 상태 검증 및 단일 출처 권한 부여
- **현상**: 플레이어의 데미지 기록이나 체력(HP) 감쇄율을 클라이언트에서 자율 계산하여 DB에 덮어쓰도록 설계하면 조작 위협과 비동기 처리에 의한 동기화 지연 문제가 생깁니다.
- **교훈**: 게임 상태의 권한(State Authority)은 항상 서버(Supabase Edge Function)가 단일 출처(Single Source of Truth)로 쥐어야 합니다. 문제 정답 판독, 보스 레이드 데미지 차감, 1:1 카드 대전 HP 연산 등은 모두 클라이언트가 보낸 액션을 기점으로 Edge Function에서 계산되어 연동 DB에 기록되도록 구성하여 무결성을 보장해야 합니다.

## 6. 아바타 꾸미기 데이터 카테고리와 영속 객체 속성 필드 불일치 교정
- **현상**: 코스튬 카탈로그 데이터(`CostumeItem`)의 카테고리는 `'pet'`으로 명명되었으나, 플레이어 아바타 저장용 스키마 객체(`AvatarConfig`)의 속성명은 `'petId'`로 지정되어 있어서, 컴포넌트 내부에서 `item.category`를 가드로 타입 매핑 없이 동적 캐스팅하여 인덱싱 시 TypeScript 컴파일러 에러(Implicit any/Property not found)가 유발되었습니다.
- **교훈**: 데이터의 물리 카테고리 네이밍과 영속성 DB 객체 구조의 필드 네이밍에 차이가 있는 경우, 타입 단언(as keyof)만 사용하지 말고 예외 매핑 분기 조건(`if (category === 'pet') { ... }`)을 확실하게 배치해 구조적 타입 안정성을 확보해야 TS strict 옵션을 만족하며 무결한 빌드가 가능합니다.
