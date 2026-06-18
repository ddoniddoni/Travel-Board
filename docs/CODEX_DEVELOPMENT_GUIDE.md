# AI Travel Board Codex 개발 문서

## 1. 프로젝트 개요

`AI Travel Board`는 여행 일정을 텍스트로만 추천하는 서비스가 아니라, AI가 생성한 여행 계획을 실제 UI 상태로 관리하는 여행 플래너 웹앱이다.

사용자는 여행지, 날짜, 취향, 예산, 이동 선호도를 입력한다. 앱은 Day별 일정, 장소 카드, 예상 체류시간, 동선 설명을 생성한다. 이후 사용자는 채팅으로 “2일차를 덜 빡세게 바꿔줘”, “카페를 하나 줄이고 쇼핑 시간을 늘려줘”, “비 오는 날 플랜B 만들어줘”처럼 요청하고, 앱은 일정 데이터를 수정한다.

## 2. ChatGPT와의 차별점

이 프로젝트는 단순 챗봇이 아니다.

| 일반 ChatGPT 사용                   | AI Travel Board                              |
| ----------------------------------- | -------------------------------------------- |
| 사용자가 프롬프트를 직접 잘 써야 함 | 입력 폼이 필요한 조건을 구조화함             |
| 긴 텍스트 답변 중심                 | Day별 타임라인/카드/지도 UI 중심             |
| 결과가 대화 안에 흩어짐             | 일정 데이터가 저장되고 수정됨                |
| 장소 정보가 부정확할 수 있음        | Places API/Mock Tool로 장소 데이터 계층 분리 |
| 수정 요청도 텍스트로만 받음         | 채팅 요청이 실제 일정 상태를 변경함          |

포트폴리오에서 강조할 메시지:

> “LLM을 단순 답변 생성기로 쓴 것이 아니라, 여행 조건을 구조화하고 일정 상태를 생성·수정하는 제품 경험 안에 AI를 통합했습니다.”

## 3. MVP 목표

### MVP에서 반드시 구현할 기능

1. 여행 조건 입력 폼
2. 여행 일정 생성 API
3. Day별 타임라인 UI
4. 장소 카드 UI
5. 일정 수정 채팅 UI
6. Zustand 또는 React state 기반 일정 상태 관리
7. mock 장소 데이터
8. 로딩/에러/빈 상태 처리
9. 반응형 기본 레이아웃

### MVP에서 제외할 기능

- 실제 항공권/호텔 예약
- 실제 결제
- 완전한 Google Maps 연동
- 회원가입 필수화
- 팀 공유/협업
- 실시간 동시 편집

## 4. 추천 기술 스택

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui 또는 자체 UI 컴포넌트
Vercel AI SDK
Zod
Zustand
LocalStorage persistence
Google Places API는 확장 단계에서 선택 적용
```

## 5. 페이지 구조

### `/`

랜딩 + 바로 사용 가능한 Trip Planner 화면을 함께 둔다.

구성:

- Hero: “AI가 만드는 지도 기반 여행 일정 보드”
- Trip Input Form
- Generated Trip Board
- Chat Modification Panel

### `/trips/[tripId]` 선택 사항

저장 기능을 붙인 뒤 추가한다.

- 저장된 여행 일정 상세
- 수정 채팅
- 공유용 read-only view 확장 가능

## 6. 화면 레이아웃

데스크톱 기준 3컬럼을 추천한다.

```txt
┌────────────────────┬────────────────────────────┬────────────────────┐
│ 여행 조건/AI 채팅   │ Day별 여행 타임라인          │ 장소 카드/지도       │
│                    │                            │                    │
│ - 목적지            │ Day 1                      │ Selected Place      │
│ - 날짜              │ 10:00 Cafe                 │ Map Placeholder     │
│ - 취향              │ 12:00 Lunch                │ Place Details       │
│ - 예산              │ 14:00 Shopping             │                    │
└────────────────────┴────────────────────────────┴────────────────────┘
```

모바일에서는 세로 스택으로 전환한다.

## 7. 도메인 타입 설계

`features/trip-planner/types.ts`

```ts
export type TravelPace = "relaxed" | "balanced" | "packed";
export type BudgetLevel = "low" | "medium" | "high";
export type TransportMode = "walk" | "public_transport" | "taxi" | "mixed";

export type TravelerPreference = {
  interests: string[];
  pace: TravelPace;
  budget: BudgetLevel;
  transportMode: TransportMode;
  startTime: string;
  endTime: string;
};

export type TripInput = {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  preference: TravelerPreference;
  notes?: string;
};

export type PlaceCandidate = {
  id: string;
  name: string;
  category: string;
  description: string;
  address?: string;
  rating?: number;
  lat?: number;
  lng?: number;
  estimatedCost?: number;
  openingHoursNote?: string;
};

export type ItineraryItem = {
  id: string;
  placeId: string;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  note: string;
  transportToNext?: {
    mode: TransportMode;
    durationMinutes: number;
    note?: string;
  };
};

export type DayPlan = {
  day: number;
  date: string;
  title: string;
  summary: string;
  items: ItineraryItem[];
};

export type TripPlan = {
  id: string;
  title: string;
  destination: string;
  summary: string;
  input: TripInput;
  places: PlaceCandidate[];
  days: DayPlan[];
  warnings: string[];
  estimatedBudget?: {
    currency: string;
    min: number;
    max: number;
  };
};
```

## 8. Zod 스키마 설계

`features/trip-planner/schemas.ts`

```ts
import { z } from "zod";

export const travelerPreferenceSchema = z.object({
  interests: z.array(z.string()).min(1),
  pace: z.enum(["relaxed", "balanced", "packed"]),
  budget: z.enum(["low", "medium", "high"]),
  transportMode: z.enum(["walk", "public_transport", "taxi", "mixed"]),
  startTime: z.string(),
  endTime: z.string(),
});

export const tripInputSchema = z.object({
  destination: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  travelers: z.number().int().min(1).max(20),
  preference: travelerPreferenceSchema,
  notes: z.string().optional(),
});

export const placeCandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  address: z.string().optional(),
  rating: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  estimatedCost: z.number().optional(),
  openingHoursNote: z.string().optional(),
});

export const itineraryItemSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  title: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int().positive(),
  note: z.string(),
  transportToNext: z
    .object({
      mode: z.enum(["walk", "public_transport", "taxi", "mixed"]),
      durationMinutes: z.number().int().nonnegative(),
      note: z.string().optional(),
    })
    .optional(),
});

export const dayPlanSchema = z.object({
  day: z.number().int().positive(),
  date: z.string(),
  title: z.string(),
  summary: z.string(),
  items: z.array(itineraryItemSchema),
});

export const tripPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  destination: z.string(),
  summary: z.string(),
  input: tripInputSchema,
  places: z.array(placeCandidateSchema),
  days: z.array(dayPlanSchema),
  warnings: z.array(z.string()),
  estimatedBudget: z
    .object({
      currency: z.string(),
      min: z.number(),
      max: z.number(),
    })
    .optional(),
});

export const tripModificationRequestSchema = z.object({
  tripPlan: tripPlanSchema,
  instruction: z.string().min(1),
});
```

## 9. API 설계

### `POST /api/trips/generate`

입력:

```ts
TripInput;
```

출력:

```ts
TripPlan;
```

역할:

- 입력 검증
- AI 또는 mock 생성 로직 호출
- TripPlan schema 검증
- 검증된 데이터 반환

### `POST /api/trips/modify`

입력:

```ts
{
  tripPlan: TripPlan;
  instruction: string;
}
```

출력:

```ts
TripPlan;
```

역할:

- 현재 일정과 수정 요청을 받아 새로운 일정으로 변환
- 예: “2일차 덜 빡세게”, “카페 줄이고 맛집 늘려줘”
- 기존 장소 id를 최대한 유지
- 변경 이유를 warnings 또는 summary에 반영 가능

### `POST /api/chat`

선택 구현. `useChat` 기반 자유 채팅이 필요할 때 사용한다.

단, MVP에서는 `/api/trips/modify`를 먼저 구현하는 것이 좋다. 이유는 상태 변경 결과가 `TripPlan`으로 명확하기 때문이다.

## 10. AI 프롬프트 설계

`features/trip-planner/prompts.ts`

```ts
export const TRIP_PLANNER_SYSTEM_PROMPT = `
너는 여행 일정 설계 전문가다.
목표는 예쁜 텍스트 답변이 아니라, UI에 바로 렌더링 가능한 여행 일정 데이터를 만드는 것이다.

규칙:
- 사용자의 취향, 예산, 이동 선호도를 반드시 반영한다.
- 하루 일정은 너무 과밀하게 만들지 않는다.
- 장소 간 이동 흐름이 자연스럽도록 구성한다.
- 모르는 장소 정보를 확정 사실처럼 말하지 않는다.
- 실제 API 데이터가 없는 경우 일반적인 추천 근거로 설명한다.
- 반드시 지정된 JSON schema에 맞는 데이터만 반환한다.
`;

export const TRIP_MODIFIER_SYSTEM_PROMPT = `
너는 기존 여행 일정을 수정하는 여행 플래너다.
목표는 사용자의 요청을 반영해 TripPlan 데이터를 업데이트하는 것이다.

규칙:
- 기존 일정의 장점을 최대한 유지한다.
- 수정 요청과 직접 관련 없는 부분은 불필요하게 바꾸지 않는다.
- 장소 id와 item id는 가능한 유지한다.
- 시간이 겹치지 않게 조정한다.
- 수정 후 Day별 흐름이 자연스러워야 한다.
- 반드시 지정된 JSON schema에 맞는 데이터만 반환한다.
`;
```

## 11. AI SDK 구현 방향

### 일정 생성

`generateText` + structured output 방식으로 구현한다.

개념 예시:

```ts
import { generateText, Output } from "ai";
import { z } from "zod";
import { tripPlanSchema } from "@/features/trip-planner/schemas";

const result = await generateText({
  model,
  system: TRIP_PLANNER_SYSTEM_PROMPT,
  output: Output.object({ schema: tripPlanSchema }),
  prompt: JSON.stringify(input),
});

return result.output;
```

실제 모델 import는 프로젝트 설정에 맞춘다. 모델 선택은 `lib/ai/model.ts`로 분리한다.

### 일정 수정

`/api/trips/modify`에서 현재 `TripPlan`과 사용자 instruction을 함께 전달한다.

```ts
const result = await generateText({
  model,
  system: TRIP_MODIFIER_SYSTEM_PROMPT,
  output: Output.object({ schema: tripPlanSchema }),
  prompt: JSON.stringify({ tripPlan, instruction }),
});
```

### Tool calling 확장

확장 단계에서는 다음 tool을 추가한다.

- `searchPlaces(destination, interests)`
- `getPlaceDetails(placeId)`
- `calculateTravelTime(origin, destination, mode)`
- `checkOpeningHours(placeId, dateTime)`

처음에는 모두 mock으로 구현하고, 나중에 Google Places/Distance Matrix API로 교체한다.

## 12. 상태 관리 설계

`features/trip-planner/store.ts`

필요 상태:

- `input`
- `tripPlan`
- `selectedPlaceId`
- `isGenerating`
- `isModifying`
- `error`
- `messages`

필요 액션:

- `setInput`
- `generateTrip`
- `modifyTrip`
- `selectPlace`
- `resetTrip`
- `saveTripToLocalStorage`
- `loadTripFromLocalStorage`

MVP에서는 서버 상태 관리 라이브러리를 굳이 도입하지 않는다.

## 13. 주요 컴포넌트

### `TripInputForm`

역할:

- 목적지
- 여행 시작일/종료일
- 인원
- 관심사 checkbox/tag
- 여행 강도
- 예산
- 이동 방식
- 추가 요청사항

### `TripBoard`

역할:

- 전체 TripPlan 표시
- DayPlan 목록 렌더링
- 선택된 장소 상태 전달

### `DayTimeline`

역할:

- 하루 일정 렌더링
- 시간, 장소명, 설명, 이동시간 표시

### `PlaceCard`

역할:

- 장소명
- 카테고리
- 설명
- 평점/주소/영업시간 note
- 예상 비용

### `MapPanel`

MVP:

- 지도 placeholder
- 선택된 장소명 표시
- 위도/경도가 있으면 좌표 텍스트 표시

확장:

- Google Maps 지도 표시
- Day별 marker 표시
- route polyline 표시

### `TripChatPanel`

역할:

- 사용자 수정 요청 입력
- 빠른 액션 버튼
  - 더 여유롭게
  - 맛집 위주로
  - 카페 줄이기
  - 비 오는 날 플랜B
- 수정 API 호출
- 결과를 TripPlan 상태에 반영

## 14. Mock 데이터 전략

외부 API가 없어도 앱이 보여야 한다.

`features/trip-planner/mock-data.ts`에 다음을 둔다.

- 도쿄 mock 장소
- 오사카 mock 장소
- 서울 mock 장소
- 기본 fallback 장소

AI API key가 없을 때는 mock generator가 TripPlan을 반환하게 만든다.

환경변수 예시:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
USE_MOCK_PLACES=true
```

## 15. 구현 단계별 체크리스트

### Phase 1: 프로젝트 뼈대

- Next.js + TypeScript 세팅
- Tailwind 세팅
- 기본 layout/page 구현
- 폴더 구조 생성
- lint/typecheck 스크립트 확인

완료 기준:

- `npm run dev`로 메인 페이지가 열린다.
- 기본 3컬럼 레이아웃이 보인다.

### Phase 2: 타입/스키마

- `types.ts` 작성
- `schemas.ts` 작성
- schema infer 타입 또는 명시 타입 정리
- mock TripPlan 작성

완료 기준:

- mock TripPlan이 schema parse를 통과한다.

### Phase 3: UI MVP

- TripInputForm
- TripBoard
- DayTimeline
- PlaceCard
- MapPanel
- Empty/Loading/Error state

완료 기준:

- mock TripPlan이 UI에 정상 표시된다.

### Phase 4: 생성 API

- `/api/trips/generate`
- input validation
- mock generator
- AI generator optional
- error response 표준화

완료 기준:

- 폼 제출 시 TripPlan이 생성되어 UI에 표시된다.

### Phase 5: 수정 API

- `/api/trips/modify`
- instruction 입력
- quick action 버튼
- 결과 TripPlan으로 상태 교체

완료 기준:

- “더 여유롭게” 요청 시 일정 item 수 또는 이동 시간이 줄어든 결과가 반영된다.

### Phase 6: AI SDK 연결

- `lib/ai/model.ts`
- `prompts.ts`
- structured output
- Zod 검증
- fallback 처리

완료 기준:

- API key가 있을 때 AI 생성이 동작한다.
- API key가 없을 때 mock generator로 fallback된다.

### Phase 7: 포트폴리오 마감

- README 작성
- 데모 시나리오 작성
- 화면 캡처용 seed 데이터 준비
- 배포 환경변수 문서화
- 에러/로딩 polish

완료 기준:

- 면접에서 3분 안에 시연 가능하다.

## 16. 에러 처리 정책

API 에러 응답 형식:

```ts
{
  error: {
    code: string;
    message: string;
  }
}
```

권장 code:

- `INVALID_INPUT`
- `AI_GENERATION_FAILED`
- `SCHEMA_VALIDATION_FAILED`
- `EXTERNAL_API_FAILED`
- `UNKNOWN_ERROR`

사용자에게는 기술적 에러를 그대로 보여주지 말고, 다음처럼 안내한다.

> “일정을 생성하지 못했어요. 조건을 조금 단순하게 바꾸거나 다시 시도해 주세요.”

## 17. 보안 규칙

- `OPENAI_API_KEY`, `GOOGLE_MAPS_API_KEY`는 서버에서만 사용한다.
- 브라우저 지도 표시용 key는 제한된 `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`를 사용한다.
- API route에서 입력값을 항상 검증한다.
- AI prompt에 사용자의 불필요한 개인정보를 넣지 않는다.
- 저장 기능 구현 시 민감 정보 저장을 피한다.

## 18. 포트폴리오 README에 넣을 문구

```md
## 프로젝트 차별점

AI Travel Board는 단순히 LLM에게 여행 일정을 물어보는 챗봇이 아닙니다. 사용자의 여행 조건을 구조화하고, AI가 생성한 결과를 Day별 타임라인/장소 카드/지도 패널로 렌더링 가능한 데이터로 변환합니다. 또한 사용자가 채팅으로 일정을 수정하면 기존 TripPlan 상태가 업데이트되도록 설계했습니다.
```

## 19. 면접 설명 스크립트

```txt
이 프로젝트는 Vercel AI SDK를 사용해 여행 조건 기반 일정을 생성하는 웹앱입니다. 핵심은 AI 답변을 텍스트로만 보여주는 것이 아니라, Zod schema로 검증된 TripPlan 데이터로 받아서 타임라인과 장소 카드 UI에 반영한 점입니다. 또한 사용자가 채팅으로 “2일차를 덜 빡세게 바꿔줘”처럼 요청하면 현재 일정 상태를 기반으로 새로운 TripPlan을 생성해 UI 상태를 업데이트합니다. 이후 Places API, 영업시간, 거리 계산 tool을 붙일 수 있도록 서버 로직을 분리했습니다.
```

## 20. Codex 작업 원칙

Codex에게 작업을 맡길 때는 한 번에 “전체 앱 만들어줘”라고 하지 않는다. 아래처럼 작게 나눈다.

나쁜 요청:

```txt
여행 AI 앱 전체 만들어줘.
```

좋은 요청:

```txt
AGENTS.md와 docs/CODEX_DEVELOPMENT_GUIDE.md를 읽고, Phase 2 타입/스키마만 구현해줘. 기존 구조를 유지하고, tripPlanSchema로 mockTripPlan이 parse되는지 확인하는 간단한 검증 코드도 추가해줘.
```

## Git workflow

Use `develop` as the main working and integration branch for this project.
Do not use `master` for project work.

Do not work directly on `develop` for Phase work unless explicitly requested.

Each Phase must use a dedicated branch before implementation starts.
Small non-Phase tasks may also use a focused branch.

Branch naming examples:

- `phase/02-supabase-setup`
- `phase/03-auth`
- `phase/04-rbac`
- `phase/06-ticket-list`
- `phase/06-ticket-filters`

If a Phase becomes too large, split it into smaller focused branches.

For each Phase or focused task:

1. Start from the latest `develop`.
2. Create a dedicated branch.
3. Implement only the scope of that Phase or task.
4. Run verification before committing when possible:
   - `npm.cmd run lint`
   - `npm.cmd run build`
5. Keep one commit per Phase or focused task whenever possible.
6. Push the task branch to the remote repository.
7. Merge the task branch into `develop`.
8. Push `develop`.
9. Leave the working tree clean before starting the next Phase.

Before starting a new Phase:

```bash
git status --short
git checkout develop
git pull origin develop
```

Never force push, hard reset, or delete branches unless explicitly requested.

## Commit message rules

Commit messages must follow this format:

```txt
<type>(<scope>): <title>

<body>
```

The body should explain why the change was made and include important
implementation details.

Allowed commit types:

- `feat`: Add a new feature
- `fix`: Fix a bug
- `docs`: Documentation-only changes
- `style`: Formatting or style-only changes with no code behavior change
- `refactor`: Code refactoring without a feature or bug fix
- `test`: Add or update tests
- `chore`: Build, package manager, tooling, or maintenance changes

Example:

```txt
feat(auth): 로그인 페이지 구현

Supabase signInWithPassword를 연결하고
폼 검증과 에러 상태를 추가했다.
```
