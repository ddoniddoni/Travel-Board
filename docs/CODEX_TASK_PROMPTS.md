# Codex 작업 프롬프트 모음

이 문서는 Codex에게 단계별로 붙여넣기 좋은 작업 지시문이다. 한 번에 모든 기능을 맡기지 말고, 아래 순서대로 진행한다.

## 0. 저장소 파악 요청

```txt
AGENTS.md와 docs/CODEX_DEVELOPMENT_GUIDE.md를 읽고 이 프로젝트의 목표, 폴더 구조, 구현 순서를 요약해줘. 아직 코드는 수정하지 말고, 현재 저장소에서 이미 구현된 부분과 부족한 부분만 정리해줘.
```

## 1. 프로젝트 초기 구조 생성

```txt
AGENTS.md와 docs/CODEX_DEVELOPMENT_GUIDE.md 기준으로 AI Travel Board 프로젝트의 초기 폴더 구조를 만들어줘. Next.js App Router + TypeScript 기준으로 작업하고, 아직 외부 API는 붙이지 마. app/page.tsx에는 3컬럼 레이아웃 placeholder를 만들어줘. 작업 후 lint/typecheck/build 중 가능한 검증을 실행해줘.
```

## 2. 타입과 Zod 스키마 구현

```txt
Phase 2를 구현해줘. features/trip-planner/types.ts와 schemas.ts를 만들고, TripInput, TravelerPreference, PlaceCandidate, ItineraryItem, DayPlan, TripPlan, TripModificationRequest 타입과 Zod 스키마를 작성해줘. mock-data.ts에 mockTripPlan을 만들고 tripPlanSchema를 통과하는 구조로 작성해줘. any는 쓰지 마.
```

## 3. Mock TripPlan UI 구현

```txt
Phase 3을 구현해줘. mockTripPlan을 사용해서 메인 페이지에 여행 일정 UI를 보여줘. 필요한 컴포넌트는 TripBoard, DayTimeline, PlaceCard, MapPanel로 분리해줘. 지도는 아직 실제 지도가 아니라 placeholder로 만들고, 선택된 장소 정보를 표시해줘. 로딩/에러/빈 상태 컴포넌트도 최소 구현해줘.
```

## 4. 여행 조건 입력 폼 구현

```txt
TripInputForm을 구현해줘. 목적지, 시작일, 종료일, 인원, 관심사, 여행 강도, 예산, 이동 방식, 추가 요청사항을 입력받게 해줘. 제출 시 tripInputSchema로 검증하고, 일단 mockTripPlan을 화면에 표시하게 연결해줘. UI는 깔끔한 포트폴리오 데모용으로 만들어줘.
```

## 5. 일정 생성 API 구현

```txt
/api/trips/generate route를 구현해줘. 요청 body는 tripInputSchema로 검증하고, USE_MOCK_PLACES가 true이거나 AI API key가 없으면 mock generator를 사용해서 TripPlan을 반환해줘. 응답은 tripPlanSchema로 검증하고, 에러 형식은 { error: { code, message } }로 통일해줘.
```

## 6. Zustand 상태 관리 연결

```txt
features/trip-planner/store.ts를 만들어 Zustand 기반 상태 관리를 구현해줘. input, tripPlan, selectedPlaceId, isGenerating, isModifying, error 상태와 setInput, generateTrip, modifyTrip, selectPlace, resetTrip 액션을 만들어줘. 기존 컴포넌트들이 이 store를 사용하도록 연결해줘.
```

## 7. 일정 수정 API 구현

```txt
/api/trips/modify route를 구현해줘. 요청 body는 tripModificationRequestSchema로 검증하고, MVP에서는 instruction에 따라 mock 방식으로 TripPlan을 수정해줘. 예를 들어 “더 여유롭게”는 item 수를 줄이거나 duration을 늘리고, “맛집 위주”는 food 카테고리 장소를 강조해줘. 결과는 tripPlanSchema로 검증해서 반환해줘.
```

## 8. 채팅 수정 패널 구현

```txt
TripChatPanel을 구현해줘. 사용자가 수정 요청을 입력하거나 빠른 액션 버튼을 누르면 /api/trips/modify를 호출하고, 반환된 TripPlan으로 현재 일정을 업데이트해줘. 빠른 액션 버튼은 “더 여유롭게”, “맛집 위주로”, “카페 줄이기”, “비 오는 날 플랜B”를 넣어줘. 로딩 중에는 입력을 비활성화해줘.
```

## 9. Vercel AI SDK 연결

```txt
Vercel AI SDK를 연결해줘. lib/ai/model.ts를 만들고, features/trip-planner/prompts.ts의 시스템 프롬프트를 사용해서 /api/trips/generate와 /api/trips/modify가 structured output으로 TripPlan을 생성하도록 구현해줘. 단, API key가 없으면 mock generator로 fallback되게 해줘. AI 응답은 반드시 tripPlanSchema 검증을 통과한 뒤 반환해줘.
```

## 10. Tool calling 구조 준비

```txt
실제 외부 API를 붙이기 전 단계로 tool calling 구조를 준비해줘. lib/server/places.ts에 searchPlaces, getPlaceDetails mock 함수를 만들고, lib/server/distance.ts에 calculateTravelTime mock 함수를 만들어줘. AI route에서 바로 외부 API를 호출하지 말고 이 server utility를 통해 호출하도록 구조를 분리해줘.
```

## 11. 저장/불러오기 구현

```txt
TripPlan localStorage 저장/불러오기 기능을 구현해줘. 사용자가 생성한 여행 일정을 저장하고 새로고침 후 복원할 수 있게 해줘. 저장 실패나 파싱 실패 시 앱이 죽지 않도록 안전하게 처리해줘.
```

## 12. README 작성

```txt
README.md를 포트폴리오용으로 작성해줘. 프로젝트 소개, ChatGPT와의 차별점, 주요 기능, 기술 스택, 실행 방법, 환경변수, 구현 아키텍처, 향후 확장 계획, 면접 설명 포인트를 포함해줘. 한국어로 작성해줘.
```

## 13. 최종 리팩터링 요청

```txt
전체 코드를 점검해줘. 중복 로직, 지나치게 긴 컴포넌트, any 사용, 서버/클라이언트 경계 위반, 에러 처리 누락, schema 검증 누락을 찾아 수정해줘. 수정 후 lint/typecheck/build 중 가능한 검증을 실행하고 결과를 요약해줘.
```

## 14. 배포 전 점검 요청

```txt
Vercel 배포 전 기준으로 프로젝트를 점검해줘. 환경변수 누락, server/client import 문제, build error 가능성, API route 에러 처리, 반응형 UI 문제를 확인하고 수정해줘. 직접 수정한 파일과 검증 결과를 마지막에 요약해줘.
```
