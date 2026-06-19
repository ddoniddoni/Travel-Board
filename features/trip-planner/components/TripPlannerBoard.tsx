"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChatModificationPanel } from "./ChatModificationPanel";
import { SavedTripList } from "./SavedTripList";
import {
  deleteSavedTrip,
  loadSavedTrips,
  renameSavedTrip,
  saveTrip,
  type SavedTrip,
} from "../storage";
import type { TripInput, TripPlan } from "../types";

type Status = "empty" | "loading" | "generated" | "editing" | "error";
type PlanSource = "ai" | "mock" | "mock-fallback" | "saved";

const interestOptions = [
  { id: "food", label: "맛집" },
  { id: "cafe", label: "카페" },
  { id: "culture", label: "문화" },
  { id: "shopping", label: "쇼핑" },
  { id: "nature", label: "산책" },
];

const itemTypeLabels: Record<string, string> = {
  meal: "식사",
  activity: "활동",
  cafe: "카페",
  move: "이동",
  rest: "휴식",
};

const categoryLabels: Record<string, string> = {
  food: "맛집",
  cafe: "카페",
  sightseeing: "관광",
  culture: "문화",
  shopping: "쇼핑",
  rest: "휴식",
};

const sourceLabels: Record<PlanSource, { label: string; description: string }> = {
  ai: {
    label: "AI 생성",
    description: "OpenAI 모델이 스키마에 맞춰 생성한 일정입니다.",
  },
  mock: {
    label: "mock 생성",
    description: "API 키가 없어 mock 데이터로 생성한 일정입니다.",
  },
  "mock-fallback": {
    label: "mock fallback",
    description: "AI 호출에 실패해 mock 데이터로 안전하게 대체했습니다.",
  },
  saved: {
    label: "저장됨",
    description: "브라우저에 저장된 여행 보드를 불러왔습니다.",
  },
};

const today = new Date().toISOString().slice(0, 10);

export function TripPlannerBoard() {
  const [destination, setDestination] = useState("오사카");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [pace, setPace] = useState<TripInput["preference"]["pace"]>("balanced");
  const [budgetLevel, setBudgetLevel] =
    useState<TripInput["preference"]["budgetLevel"]>("medium");
  const [interests, setInterests] = useState(["food", "cafe"]);
  const [notes, setNotes] = useState(
    "너무 빡세지 않게, 저녁에는 야경이 있으면 좋겠어.",
  );
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [source, setSource] = useState<PlanSource | null>(null);
  const [status, setStatus] = useState<Status>("empty");
  const [error, setError] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trips = loadSavedTrips();
      setSavedTrips(trips);

      if (trips[0]) {
        setTripPlan(trips[0].tripPlan);
        setSource(trips[0].source);
        setStatus("generated");
        setAssistantMessage("저장한 여행 보드를 불러왔습니다.");
      }

      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasHydrated || !tripPlan || !source || source === "saved") return;
    const timer = window.setTimeout(() => {
      setSavedTrips(saveTrip(tripPlan, source));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [hasHydrated, source, tripPlan]);

  const selectedPlaceIds = useMemo(() => {
    const ids = tripPlan?.days.flatMap((day) =>
      day.items.map((item) => item.placeId).filter(Boolean),
    );
    return new Set(ids ?? []);
  }, [tripPlan]);

  async function generateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setAssistantMessage("");

    const input: TripInput = {
      destination,
      startDate,
      endDate,
      preference: {
        pace,
        interests,
        budgetLevel,
        companions: ["친구"],
        notes,
      },
    };

    const response = await fetch("/api/trips/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data: unknown = await response.json();
    if (!response.ok || !isTripResponse(data)) {
      setStatus("error");
      setError("일정을 생성하지 못했습니다. 조건을 확인하고 다시 시도해 주세요.");
      return;
    }

    setTripPlan(data.tripPlan);
    setSource(data.source);
    setStatus("generated");
    setAssistantMessage(
      data.source === "ai"
        ? "AI가 새 여행 보드를 만들고 브라우저에 저장했습니다."
        : "mock 데이터로 여행 보드를 만들고 브라우저에 저장했습니다.",
    );
  }

  async function modifyTrip(message: string) {
    if (!tripPlan) return;

    setStatus("editing");
    setError("");

    const response = await fetch("/api/trips/modify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, tripPlan }),
    });

    const data: unknown = await response.json();
    if (!response.ok || !isModifyResponse(data)) {
      setStatus("error");
      setError("수정 요청을 반영하지 못했습니다. 다른 문장으로 다시 시도해 주세요.");
      return;
    }

    const createdAt = new Date().toISOString();
    setTripPlan({
      ...data.tripPlan,
      chatMessages: [
        ...tripPlan.chatMessages,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: message,
          createdAt,
        },
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.assistantMessage,
          createdAt,
        },
      ],
    });
    setSource(data.source);
    setAssistantMessage(`${data.assistantMessage} 변경 내용도 저장했습니다.`);
    setStatus("generated");
  }

  function resetTrip() {
    setTripPlan(null);
    setSource(null);
    setStatus("empty");
    setError("");
    setAssistantMessage("저장된 여행 보드를 초기화했습니다.");
  }

  function loadSavedTrip(savedTrip: SavedTrip) {
    setTripPlan(savedTrip.tripPlan);
    setSource(savedTrip.source);
    setStatus("generated");
    setError("");
    setAssistantMessage("저장한 여행 보드를 불러왔습니다.");
  }

  function removeSavedTrip(tripId: string) {
    setSavedTrips(deleteSavedTrip(tripId));

    if (tripPlan?.id === tripId) {
      setTripPlan(null);
      setSource(null);
      setStatus("empty");
      setAssistantMessage("현재 여행 보드를 삭제했습니다.");
    }
  }

  function renameTrip(tripId: string, title: string) {
    const trips = renameSavedTrip(tripId, title);
    setSavedTrips(trips);

    const renamedTrip = trips.find((savedTrip) => savedTrip.tripPlan.id === tripId);
    if (renamedTrip && tripPlan?.id === tripId) {
      setTripPlan(renamedTrip.tripPlan);
      setAssistantMessage("여행 보드 이름을 변경했습니다.");
    }
  }

  function toggleInterest(id: string) {
    setInterests((current) => {
      if (current.includes(id)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  const sourceInfo = source ? sourceLabels[source] : null;

  return (
    <main className="min-h-screen px-5 py-5">
      <section className="mx-auto grid max-w-[1480px] gap-4 xl:grid-cols-[340px_minmax(0,1fr)_380px]">
        <aside className="panel p-5">
          <p className="text-sm font-bold text-[var(--accent)]">
            AI Travel Board
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">
            여행 조건을 구조화하고 일정 보드로 바꾸는 플래너
          </h1>

          <form className="mt-6 space-y-4" onSubmit={generateTrip}>
            <label className="block">
              <span className="label">여행지</span>
              <input
                className="field"
                onChange={(event) => setDestination(event.target.value)}
                value={destination}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="label">시작일</span>
                <input
                  className="field"
                  onChange={(event) => setStartDate(event.target.value)}
                  type="date"
                  value={startDate}
                />
              </label>
              <label className="block">
                <span className="label">종료일</span>
                <input
                  className="field"
                  onChange={(event) => setEndDate(event.target.value)}
                  type="date"
                  value={endDate}
                />
              </label>
            </div>

            <div>
              <span className="label">여행 속도</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["relaxed", "balanced", "packed"] as const).map((option) => (
                  <button
                    className={pace === option ? "segmented active" : "segmented"}
                    key={option}
                    onClick={() => setPace(option)}
                    type="button"
                  >
                    {option === "relaxed"
                      ? "여유"
                      : option === "packed"
                        ? "알참"
                        : "균형"}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="label">예산</span>
              <select
                className="field"
                onChange={(event) =>
                  setBudgetLevel(
                    event.target.value as TripInput["preference"]["budgetLevel"],
                  )
                }
                value={budgetLevel}
              >
                <option value="low">절약형</option>
                <option value="medium">보통</option>
                <option value="high">넉넉함</option>
              </select>
            </label>

            <div>
              <span className="label">관심사</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {interestOptions.map((option) => (
                  <button
                    className={interests.includes(option.id) ? "chip active" : "chip"}
                    key={option.id}
                    onClick={() => toggleInterest(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="label">추가 요청</span>
              <textarea
                className="field min-h-24 resize-none"
                onChange={(event) => setNotes(event.target.value)}
                value={notes}
              />
            </label>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                className="primary-button"
                disabled={status === "loading"}
                type="submit"
              >
                {status === "loading" ? "일정 생성 중..." : "일정 생성"}
              </button>
              <button
                className="secondary-button"
                disabled={!tripPlan}
                onClick={resetTrip}
                type="button"
              >
                초기화
              </button>
            </div>
          </form>

          <section className="mt-5 rounded-md bg-[var(--panel-muted)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">현재 상태</p>
              {sourceInfo ? (
                <span className={`source-badge ${source ?? ""}`}>
                  {sourceInfo.label}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {status === "empty" && "아직 생성된 여행 보드가 없습니다."}
              {status === "loading" &&
                "조건을 구조화해 여행 일정을 생성 중입니다."}
              {status === "editing" &&
                "기존 여행 보드에 수정 요청을 적용 중입니다."}
              {status === "generated" &&
                "일정이 보드에 반영되었고 브라우저에 저장됩니다."}
              {status === "error" && error}
            </p>
            {sourceInfo ? (
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {sourceInfo.description}
              </p>
            ) : null}
            {assistantMessage ? (
              <p className="mt-2 text-sm font-semibold text-[var(--accent-strong)]">
                {assistantMessage}
              </p>
            ) : null}
          </section>
        </aside>

        <section className="panel min-h-[720px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[var(--accent)]">
                생성된 여행 보드
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {tripPlan?.title ?? "Day별 타임라인"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {tripPlan?.styleSummary ??
                  "왼쪽 조건을 입력하면 구조화된 일정 데이터가 이 영역에 표시됩니다."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {sourceInfo ? (
                <span className={`source-badge ${source ?? ""}`}>
                  {sourceInfo.label}
                </span>
              ) : null}
              <span className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-bold text-slate-600">
                {tripPlan ? `${tripPlan.days.length}일 일정` : "비어 있음"}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {tripPlan ? (
              tripPlan.days.map((day) => (
                <article
                  className="rounded-lg border border-[var(--line)] p-4"
                  key={`${day.day}-${day.date}`}
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[var(--orange)]">
                        Day {day.day} · {day.date}
                      </p>
                      <h3 className="text-xl font-bold">{day.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {day.summary}
                      </p>
                    </div>
                  </div>

                  <ol className="space-y-3">
                    {day.items.map((item) => (
                      <li
                        className="grid grid-cols-[72px_1fr] gap-3"
                        key={item.id}
                      >
                        <time className="pt-2 text-sm font-bold text-slate-500">
                          {item.startTime}
                        </time>
                        <div className="rounded-md bg-[var(--panel-muted)] px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{item.title}</p>
                            <span className="rounded bg-white px-2 py-1 text-xs font-bold text-slate-600">
                              {itemTypeLabels[item.type]} · {item.durationMinutes}
                              분
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {item.note}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              ))
            ) : (
              <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-[var(--panel-muted)] p-8 text-center">
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  API가 반환한 TripPlan을 DayPlan과 ItineraryItem 단위로 보여줄
                  준비가 되어 있습니다.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <ChatModificationPanel
            disabled={!tripPlan || status === "editing"}
            isEditing={status === "editing"}
            messages={tripPlan?.chatMessages ?? []}
            onSubmit={modifyTrip}
          />

          <SavedTripList
            activeTripId={tripPlan?.id}
            onDelete={removeSavedTrip}
            onLoad={loadSavedTrip}
            onRename={renameTrip}
            trips={savedTrips}
          />

          <section className="panel p-5">
            <p className="text-sm font-bold text-[var(--accent)]">장소 후보</p>
            <h2 className="mt-1 text-2xl font-bold">장소 카드</h2>

            <div className="mt-5 space-y-3">
              {(tripPlan?.places ?? []).map((place) => (
                <article
                  className="rounded-lg border border-[var(--line)] p-4"
                  key={place.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{place.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {categoryLabels[place.category]} · {place.area} ·{" "}
                        {place.durationMinutes}분
                      </p>
                    </div>
                    <span
                      className={
                        selectedPlaceIds.has(place.id) ? "badge active" : "badge"
                      }
                    >
                      사용
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {place.description}
                  </p>
                </article>
              ))}
              {!tripPlan ? (
                <p className="text-sm leading-6 text-slate-600">
                  일정을 생성하면 장소 후보가 카드로 표시됩니다.
                </p>
              ) : null}
            </div>
          </section>

          <section className="panel p-5">
            <p className="text-sm font-bold text-[var(--accent)]">지도 자리</p>
            <div className="mt-4 aspect-[4/3] rounded-lg border border-dashed border-[var(--line)] bg-[var(--panel-muted)] p-4">
              <div className="flex h-full items-center justify-center rounded-md bg-white text-center text-sm font-bold text-slate-600">
                선택된 장소 좌표와 이동 동선이 여기에 연결됩니다.
              </div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function isTripResponse(
  data: unknown,
): data is { tripPlan: TripPlan; source: Exclude<PlanSource, "saved"> } {
  return (
    typeof data === "object" &&
    data !== null &&
    "tripPlan" in data &&
    "source" in data
  );
}

function isModifyResponse(
  data: unknown,
): data is {
  tripPlan: TripPlan;
  assistantMessage: string;
  source: Exclude<PlanSource, "saved">;
} {
  return (
    isTripResponse(data) &&
    "assistantMessage" in data &&
    typeof data.assistantMessage === "string"
  );
}
