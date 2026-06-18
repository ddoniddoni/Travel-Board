const days = [
  {
    day: "Day 1",
    title: "도착과 동네 감각 익히기",
    items: [
      ["10:00", "로컬 카페에서 여행 시작"],
      ["12:30", "시장 골목 점심"],
      ["15:00", "대표 거리 산책"],
      ["18:30", "예약 없이 가능한 저녁"],
    ],
  },
  {
    day: "Day 2",
    title: "취향 중심 탐색",
    items: [
      ["09:30", "미술관 또는 건축 명소"],
      ["12:00", "맛집 후보 비교"],
      ["14:30", "쇼핑/카페 선택 코스"],
      ["19:00", "야경 포인트"],
    ],
  },
];

const places = [
  {
    name: "성수 로스터리 거리",
    category: "카페",
    duration: "90분",
    description: "이동 부담이 낮고 취향 기반 코스로 확장하기 좋은 후보 장소",
  },
  {
    name: "전통시장 골목",
    category: "음식",
    duration: "75분",
    description: "예산을 지키면서 로컬 식사를 넣기 좋은 점심 후보",
  },
  {
    name: "한강 야경 포인트",
    category: "산책",
    duration: "60분",
    description: "하루 마무리에 어울리는 저강도 일정 후보",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-6">
      <section className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[var(--accent)]">
              AI Travel Board
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight">
              조건을 구조화해서 일정 보드로 바꾸는 여행 플래너
            </h1>
          </div>

          <form className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">여행지</span>
              <input
                className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
                placeholder="예: 서울, 오사카, 다낭"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold">시작일</span>
                <input
                  className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
                  type="date"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">종료일</span>
                <input
                  className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2"
                  type="date"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold">여행 스타일</span>
              <select className="mt-2 w-full rounded-md border border-[var(--line)] bg-white px-3 py-2">
                <option>균형 있게</option>
                <option>여유롭게</option>
                <option>빽빽하게</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold">추가 요청</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-md border border-[var(--line)] bg-white px-3 py-2"
                placeholder="맛집 위주, 비 오는 날 플랜B, 카페는 적게..."
              />
            </label>

            <button
              className="w-full rounded-md bg-[var(--accent)] px-4 py-3 font-semibold text-white"
              type="button"
            >
              mock 일정 생성 준비
            </button>
          </form>

          <div className="mt-6 rounded-md bg-[var(--panel-muted)] p-4">
            <p className="text-sm font-semibold">현재 상태</p>
            <p className="mt-1 text-sm text-slate-600">
              Empty state: 아직 생성된 TripPlan이 없습니다.
            </p>
          </div>
        </aside>

        <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">
                Generated Trip Board
              </p>
              <h2 className="mt-1 text-2xl font-bold">Day별 타임라인</h2>
            </div>
            <span className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-semibold text-slate-600">
              generated state preview
            </span>
          </div>

          <div className="space-y-4">
            {days.map((day) => (
              <article
                className="rounded-lg border border-[var(--line)] p-4"
                key={day.day}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--orange)]">
                      {day.day}
                    </p>
                    <h3 className="text-xl font-bold">{day.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600">editing ready</p>
                </div>

                <ol className="space-y-3">
                  {day.items.map(([time, title]) => (
                    <li className="grid grid-cols-[72px_1fr] gap-3" key={title}>
                      <time className="text-sm font-bold text-slate-500">
                        {time}
                      </time>
                      <div className="rounded-md bg-[var(--panel-muted)] px-3 py-2">
                        <p className="font-semibold">{title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          이후 TripPlan schema의 ItineraryItem으로 교체됩니다.
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--accent)]">
              Place Candidates
            </p>
            <h2 className="mt-1 text-2xl font-bold">장소 카드</h2>

            <div className="mt-5 space-y-3">
              {places.map((place) => (
                <article
                  className="rounded-lg border border-[var(--line)] p-4"
                  key={place.name}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{place.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {place.category} · 예상 체류 {place.duration}
                      </p>
                    </div>
                    <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-bold text-[var(--accent-strong)]">
                      mock
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {place.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--accent)]">
              Map Placeholder
            </p>
            <div className="mt-4 aspect-[4/3] rounded-lg border border-dashed border-[var(--line)] bg-[var(--panel-muted)] p-4">
              <div className="flex h-full items-center justify-center rounded-md bg-white text-center text-sm font-semibold text-slate-600">
                선택한 장소와 좌표가 여기에 표시됩니다.
              </div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
