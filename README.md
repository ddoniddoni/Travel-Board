# AI Travel Board

AI Travel Board는 사용자의 여행 조건을 `TripInput`으로 구조화하고, AI 또는 mock 생성 API가 반환한 `TripPlan`을 Day별 타임라인과 장소 카드로 보여주는 여행 일정 보드입니다.

## 현재 구현

- Next.js App Router, TypeScript, Tailwind CSS 기반 앱 구조
- `TripInput`, `TravelerPreference`, `PlaceCandidate`, `ItineraryItem`, `DayPlan`, `TripPlan`, `TripModificationRequest` 타입과 Zod 스키마
- Vercel AI SDK `generateObject` 기반 structured output 생성
- `/api/trips/generate` AI 일정 생성 API
- `/api/trips/modify` AI 일정 수정 API
- `OPENAI_API_KEY`가 없거나 AI 호출이 실패하면 mock 일정으로 안전하게 fallback
- UI에서 `AI 생성`, `mock 생성`, `mock fallback`, `저장됨` 상태 배지 표시
- 왼쪽 입력 폼, 중앙 타임라인, 오른쪽 채팅 수정/장소 카드/지도 placeholder 3영역 UI
- empty, loading, generated, editing, error 상태 처리
- 생성된 여행 보드 localStorage 저장/불러오기/초기화
- 화면 문구와 mock 데이터 한글화

## 환경변수

`.env.local` 파일을 만들고 필요한 값을 설정합니다.

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
USE_MOCK_PLACES=true
```

`OPENAI_API_KEY`를 비워두면 AI 호출 대신 mock 일정 생성/수정이 동작합니다.

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버가 실행되면 `http://localhost:3000`에서 확인할 수 있습니다.

## 검증 명령

```bash
npm run lint
npm run typecheck
npm run build
```

## 다음 단계

1. 저장된 일정 목록 관리와 이름 변경 기능 추가
2. 채팅 UI를 메시지 히스토리 형태로 확장
3. AI 응답 실패 원인을 서버 로그와 UI 메시지로 더 세분화
4. Google Places API 연동을 `lib/server/*`에 격리해 장소 후보 품질 개선
