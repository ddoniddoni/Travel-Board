# AI Travel Board

AI Travel Board는 여행 조건을 구조화하고, AI 또는 mock 생성 API가 반환한 `TripPlan` 데이터를 Day별 타임라인과 장소 카드 UI로 보여주는 여행 일정 보드 앱입니다.

## 실행 방법

```bash
npm install
npm run dev
```

개발 서버가 실행되면 `http://localhost:3000`에서 확인합니다.

## 검증 명령

```bash
npm run lint
npm run typecheck
npm run build
```

## 현재 단계

- Next.js App Router, TypeScript, Tailwind CSS 초기 구조 생성
- 3컬럼 여행 보드 placeholder 구현
- `/api/trips/generate`, `/api/trips/modify` route placeholder 추가
- 다음 단계: `features/trip-planner`의 타입, Zod schema, mock TripPlan 구현
