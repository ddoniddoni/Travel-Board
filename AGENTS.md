# AGENTS.md

## 프로젝트 정체성

이 저장소는 `AI Travel Board` 프로젝트이다. 사용자가 여행지, 날짜, 취향, 예산을 입력하면 AI가 여행 일정을 생성하고, 사용자는 채팅으로 일정을 수정하며, 오른쪽 일정표/장소 카드/지도 상태가 함께 바뀌는 웹 애플리케이션을 개발한다.

이 프로젝트의 목표는 단순한 “AI가 여행 일정 텍스트를 출력하는 앱”이 아니다. 목표는 다음과 같다.

- 사용자의 여행 조건을 구조화한다.
- 장소 후보를 카드 데이터로 관리한다.
- Day별 일정표를 상태로 저장한다.
- AI 응답을 UI에 바로 반영 가능한 JSON 데이터로 만든다.
- 이후 Google Places API, 지도, 거리 계산, 영업시간 체크를 붙일 수 있는 구조로 설계한다.

## 핵심 제품 원칙

1. ChatGPT 복붙 앱처럼 만들지 않는다.
2. AI 결과는 가능한 한 구조화된 데이터로 받는다.
3. 사용자가 프롬프트를 잘 쓰지 않아도 되도록 입력 UI가 좋은 질문을 대신한다.
4. 여행 일정은 텍스트가 아니라 `Trip`, `DayPlan`, `Place`, `ItineraryItem` 데이터로 관리한다.
5. MVP에서는 외부 장소 API 없이 mock 데이터를 허용한다.
6. 외부 API 연동은 반드시 `lib/server/*` 또는 `features/*/server/*`에 격리한다.
7. 클라이언트 컴포넌트에서는 API key를 절대 직접 사용하지 않는다.
8. 모든 AI route는 서버에서 실행한다.
9. 변경 작업 후에는 lint/typecheck/build 중 가능한 검증을 실행한다.
10. 복잡한 기능은 작은 PR 단위로 나눈다.

## 기술 스택 기본값

- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI: shadcn/ui 또는 직접 구현한 재사용 컴포넌트
- AI: Vercel AI SDK
- Validation: Zod
- State: 우선 React state/Zustand 중 하나를 사용한다. MVP는 Zustand 권장.
- Database: MVP는 localStorage 또는 mock persistence 가능. 확장 단계에서는 Supabase/PostgreSQL + Prisma 권장.
- Map: MVP는 지도 placeholder 가능. 확장 단계에서 Google Maps/Places API 연동.

## 예상 폴더 구조

```txt
app/
  page.tsx
  layout.tsx
  api/
    trips/generate/route.ts
    trips/modify/route.ts
    chat/route.ts
components/
  layout/
  trip/
  place/
  chat/
  ui/
features/
  trip-planner/
    components/
    schemas.ts
    types.ts
    prompts.ts
    mock-data.ts
    store.ts
    utils.ts
lib/
  ai/
    model.ts
    prompts.ts
  server/
    places.ts
    distance.ts
    weather.ts
  utils.ts
docs/
  CODEX_DEVELOPMENT_GUIDE.md
  CODEX_TASK_PROMPTS.md
```

## 개발 순서

Codex는 다음 순서로 작업한다.

1. 프로젝트 기본 구조 생성
2. 타입과 Zod 스키마 작성
3. 여행 조건 입력 폼 구현
4. mock 기반 일정 생성 API 구현
5. 일정표/장소 카드 UI 구현
6. AI SDK 기반 일정 생성 API로 교체
7. 채팅 기반 일정 수정 기능 구현
8. 지도 placeholder 구현
9. 저장/불러오기 구현
10. 외부 Places API 연동 준비

한 번에 모든 기능을 만들려고 하지 말고, 각 단계가 동작하는 상태를 유지한다.

## 타입 설계 규칙

모든 핵심 데이터는 TypeScript type과 Zod schema를 함께 작성한다.

필수 도메인 타입:

- `TripInput`
- `TravelerPreference`
- `PlaceCandidate`
- `ItineraryItem`
- `DayPlan`
- `TripPlan`
- `TripModificationRequest`

AI 응답은 반드시 Zod schema로 검증한다. 검증 실패 시 사용자에게 안전한 에러 메시지를 보여주고, raw AI 응답을 UI에 그대로 노출하지 않는다.

## AI 구현 규칙

Vercel AI SDK 사용 시 다음을 지킨다.

- 단순 일괄 생성은 `generateText` 또는 structured output을 사용한다.
- 채팅처럼 실시간 응답이 필요한 부분은 `streamText`와 `useChat`을 사용한다.
- 장소 검색, 거리 계산, 영업시간 확인은 tool calling으로 분리 가능한 구조로 만든다.
- 처음부터 실제 Places API를 붙이지 않아도 되며, `mockPlacesTool`을 먼저 만든다.
- AI가 반환한 일정은 반드시 schema 검증을 통과해야 상태에 반영한다.
- prompt는 route handler 안에 하드코딩하지 말고 `features/trip-planner/prompts.ts`로 분리한다.

## UI/UX 규칙

메인 화면은 3영역 구조를 기본으로 한다.

1. 왼쪽: 여행 조건 입력 또는 AI 채팅
2. 중앙: Day별 타임라인
3. 오른쪽: 장소 카드/지도 placeholder

MVP에서는 반응형을 고려하되, 모바일 완성도보다 데스크톱 포트폴리오 화면 완성도를 우선한다.

필수 UI 상태:

- empty state
- loading state
- error state
- generated state
- editing state

## 코드 스타일

- TypeScript `any` 사용을 피한다.
- API 응답 타입을 명시한다.
- 컴포넌트 파일은 가능하면 150줄 이하로 유지한다.
- 비즈니스 로직은 컴포넌트 안에 길게 넣지 말고 `utils`, `store`, `schemas`로 분리한다.
- 서버 전용 로직은 client component에서 import하지 않는다.
- 환경변수는 `process.env`를 서버 코드에서만 읽는다.
- `console.log`는 디버깅 후 제거한다. 필요한 경우 `console.error` 정도만 남긴다.

## 네이밍 규칙

- 컴포넌트: PascalCase
- 훅: use로 시작
- 타입: PascalCase
- Zod schema: `xxxSchema`
- API route 응답: `xxxResponseSchema`
- AI tool: 동사형 이름 사용. 예: `searchPlaces`, `calculateRoute`, `checkOpeningHours`

## 테스트/검증 규칙

작업 후 가능한 검증을 실행한다.

```bash
npm run lint
npm run typecheck
npm run build
```

프로젝트에 해당 스크립트가 없으면 먼저 `package.json`을 확인하고, 필요한 최소 스크립트를 추가한다.

## 금지 사항

- API key를 클라이언트에 노출하지 않는다.
- AI 응답을 검증 없이 바로 상태에 넣지 않는다.
- 모든 기능을 하나의 거대한 컴포넌트에 넣지 않는다.
- 실제 결제/예약/항공권 구매 기능을 구현하지 않는다.
- 사용자 위치나 개인정보를 불필요하게 저장하지 않는다.
- 외부 API 실패 시 앱 전체가 죽게 만들지 않는다.
- 지도/장소 API가 없어도 MVP가 동작해야 한다.

## 완료 기준

MVP 완료 기준:

- 사용자가 여행 조건을 입력할 수 있다.
- AI 또는 mock 생성 API가 Day별 여행 일정을 반환한다.
- 일정이 카드/타임라인 UI로 표시된다.
- 장소 카드에 이름, 카테고리, 예상 체류시간, 설명이 표시된다.
- 사용자가 “더 여유롭게”, “맛집 위주로”, “비 오는 날 플랜B” 같은 수정 요청을 보낼 수 있다.
- 수정 결과가 일정 상태에 반영된다.
- 에러와 로딩 상태가 존재한다.
- README 또는 docs에 실행 방법이 정리되어 있다.
