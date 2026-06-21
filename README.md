# AI Travel Board

여행지, 날짜, 취향, 예산을 입력하면 Day별 여행 일정을 만들고, 일정표·장소 카드·지도에서 함께 확인하는 여행 계획 보드입니다.

## 현재 기능

- 여행 조건 입력과 날짜 선택
- Day별 일정 생성 및 채팅 기반 일정 수정
- 장소 카드와 지도 마커 연동
- 일정 시간 조정, 항목 제거, 변경 되돌리기
- 일정 겹침과 짧은 이동 여유 알림
- 여행 보드 저장, 불러오기, 복제, 이름 변경, 백업
- 라이트/다크 테마와 반응형 레이아웃

## 환경 변수

`.env.local`을 만들고 필요한 값을 설정합니다.

```bash
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=
NEXT_PUBLIC_GOOGLE_MAP_ID=
USE_LOCAL_PLACES=true
PLACES_DAILY_REQUEST_LIMIT=10
```

`USE_LOCAL_PLACES=true`이면 외부 장소 검색 없이 앱에 포함된 장소 정보로 동작합니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 검증

```bash
npm run lint
npm run typecheck
npm run build
```
