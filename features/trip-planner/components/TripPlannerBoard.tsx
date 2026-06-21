"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChatModificationPanel } from "./ChatModificationPanel";
import { SavedTripList } from "./SavedTripList";
import { ThemeToggle } from "./ThemeToggle";
import { TripMapPreview } from "./TripMapPreview";
import { StarterExamples, type StarterExample } from "./StarterExamples";
import { addItineraryQualityNotes } from "../itinerary-quality";
import {
  deleteSavedTrip,
  duplicateSavedTrip,
  exportSavedTrips,
  importSavedTrips,
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

const sourceLabels: Record<PlanSource, string> = {
  ai: "맞춤 일정",
  mock: "여행 일정",
  "mock-fallback": "여행 일정",
  saved: "저장됨",
};

const today = new Date().toISOString().slice(0, 10);

function addDays(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function shiftTime(time: string, minutes: number) {
  const [hours, currentMinutes] = time.split(":").map(Number);
  const totalMinutes = (hours * 60 + currentMinutes + minutes + 1440) % 1440;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function sortItemsByStartTime<T extends { startTime: string }>(items: T[]) {
  return items.toSorted((left, right) => left.startTime.localeCompare(right.startTime));
}

const starterExamples: StarterExample[] = [
  {
    id: "seoul-weekend",
    eyebrow: "1박 2일",
    title: "서울, 맛집과 카페",
    description: "느긋하게 걷고 맛있는 곳을 중심으로",
    input: {
      destination: "서울",
      startDate: addDays(today, 7),
      endDate: addDays(today, 8),
      preference: {
        pace: "relaxed",
        interests: ["food", "cafe"],
        budgetLevel: "medium",
        companions: ["친구"],
        notes: "걷기 좋은 동선으로 추천해줘",
      },
    },
  },
  {
    id: "busan-food",
    eyebrow: "주말 여행",
    title: "부산, 바다와 미식",
    description: "바다 풍경도 보고 로컬 맛집도 즐기기",
    input: {
      destination: "부산",
      startDate: addDays(today, 14),
      endDate: addDays(today, 15),
      preference: {
        pace: "balanced",
        interests: ["food", "nature"],
        budgetLevel: "medium",
        companions: ["친구"],
        notes: "바다를 볼 수 있는 코스를 넣어줘",
      },
    },
  },
  {
    id: "jeju-rainy",
    eyebrow: "비 오는 날",
    title: "제주, 실내 중심",
    description: "날씨가 흐려도 편안하게 즐기는 코스",
    input: {
      destination: "제주",
      startDate: addDays(today, 21),
      endDate: addDays(today, 23),
      preference: {
        pace: "relaxed",
        interests: ["cafe", "culture"],
        budgetLevel: "medium",
        companions: ["친구"],
        notes: "비가 와도 즐길 수 있는 실내 장소를 우선해줘",
      },
    },
  },
];

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
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>();
  const [undoPlan, setUndoPlan] = useState<TripPlan | null>(null);
  const [isConditionFormOpen, setIsConditionFormOpen] = useState(false);

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

  const displayedSelectedPlaceId = tripPlan?.places.some(
    (place) => place.id === selectedPlaceId,
  )
    ? selectedPlaceId
    : tripPlan?.days[0]?.items.find((item) => item.placeId)?.placeId;

  async function requestTrip(input: TripInput) {
    setStatus("loading");
    setError("");
    setAssistantMessage("");
    setUndoPlan(null);

    let response: Response;
    let data: unknown;
    try {
      response = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      data = await response.json().catch(() => null);
    } catch {
      setStatus("error");
      setError("서버에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.");
      return;
    }

    if (!response.ok || !isTripResponse(data)) {
      setStatus("error");
      setError(
        getApiErrorMessage(
          data,
          "일정을 생성하지 못했습니다. 조건을 확인하고 다시 시도해 주세요.",
        ),
      );
      return;
    }

    setTripPlan(data.tripPlan);
    setIsConditionFormOpen(false);
    setSource(data.source);
    setStatus("generated");
    setAssistantMessage(
      data.source === "ai"
        ? "AI가 새 여행 보드를 만들고 브라우저에 저장했습니다."
        : "여행 보드를 만들고 이 브라우저에 저장했습니다.",
    );
  }

  function generateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void requestTrip({
      destination,
      startDate,
      endDate,
      preference: { pace, interests, budgetLevel, companions: ["친구"], notes },
    });
  }

  function startExample(example: StarterExample) {
    const { input } = example;
    setDestination(input.destination);
    setStartDate(input.startDate);
    setEndDate(input.endDate);
    setPace(input.preference.pace);
    setBudgetLevel(input.preference.budgetLevel);
    setInterests(input.preference.interests);
    setNotes(input.preference.notes ?? "");
    void requestTrip(input);
  }

  function retryTrip() {
    void requestTrip({
      destination,
      startDate,
      endDate,
      preference: { pace, interests, budgetLevel, companions: ["친구"], notes },
    });
  }

  async function modifyTrip(message: string) {
    if (!tripPlan) return;

    setStatus("editing");
    setError("");
    setUndoPlan(null);

    let response: Response;
    let data: unknown;
    try {
      response = await fetch("/api/trips/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, tripPlan }),
      });
      data = await response.json().catch(() => null);
    } catch {
      setStatus("error");
      setError("서버에 연결하지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요.");
      return;
    }

    if (!response.ok || !isModifyResponse(data)) {
      setStatus("error");
      setError(
        getApiErrorMessage(
          data,
          "수정 요청을 반영하지 못했습니다. 다른 문장으로 다시 시도해 주세요.",
        ),
      );
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
    setIsConditionFormOpen(true);
    setUndoPlan(null);
    setSource(null);
    setStatus("empty");
    setError("");
    setAssistantMessage("저장된 여행 보드를 초기화했습니다.");
  }

  function loadSavedTrip(savedTrip: SavedTrip) {
    setTripPlan(savedTrip.tripPlan);
    setIsConditionFormOpen(false);
    setUndoPlan(null);
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

  function duplicateTrip(tripId: string) {
    const trips = duplicateSavedTrip(tripId);
    setSavedTrips(trips);
    const duplicatedTrip = trips[0];
    if (duplicatedTrip) {
      setTripPlan(duplicatedTrip.tripPlan);
      setUndoPlan(null);
      setSource(duplicatedTrip.source);
      setStatus("generated");
      setAssistantMessage("여행 보드 사본을 만들었습니다.");
    }
  }

  function exportTrips() {
    const blob = new Blob([exportSavedTrips(savedTrips)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-travel-board-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    setAssistantMessage("저장한 여행 보드를 JSON 파일로 내보냈습니다.");
  }

  function importTrips(value: string) {
    try {
      const trips = importSavedTrips(value);
      setSavedTrips(trips);
      setAssistantMessage(`${trips.length}개의 여행 보드를 불러왔습니다.`);
    } catch (importError) {
      setStatus("error");
      setError(importError instanceof Error ? importError.message : "파일을 가져오지 못했습니다.");
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

  function selectPlaceAndRevealMap(placeId: string) {
    setSelectedPlaceId(placeId);
    document.getElementById("trip-map-preview")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function selectPlaceFromCard(placeId: string) {
    setSelectedPlaceId(placeId);
    const itineraryItem = tripPlan?.days
      .flatMap((day) => day.items)
      .find((item) => item.placeId === placeId);

    if (itineraryItem) {
      document.getElementById(`itinerary-item-${itineraryItem.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  function shiftItineraryItem(itemId: string, minutes: number) {
    if (!tripPlan) return;
    setUndoPlan(tripPlan);
    const nextTripPlan = {
      ...tripPlan,
      updatedAt: new Date().toISOString(),
      days: tripPlan.days.map((day) => ({
        ...day,
        items: sortItemsByStartTime(
          day.items.map((item) =>
            item.id === itemId
              ? { ...item, startTime: shiftTime(item.startTime, minutes) }
              : item,
          ),
        ),
      })),
    };
    setTripPlan(addItineraryQualityNotes(nextTripPlan));
    setAssistantMessage(`일정 시간을 ${minutes > 0 ? "30분 늦췄어요." : "30분 앞당겼어요."}`);
  }

  function removeItineraryItem(itemId: string, dayNumber: number) {
    if (!tripPlan) return;
    const day = tripPlan.days.find((candidate) => candidate.day === dayNumber);
    if (!day || day.items.length === 1) {
      setAssistantMessage("하루에는 최소 한 개의 일정이 필요해요.");
      return;
    }

    setUndoPlan(tripPlan);
    const nextTripPlan = {
      ...tripPlan,
      updatedAt: new Date().toISOString(),
      days: tripPlan.days.map((candidate) =>
        candidate.day === dayNumber
          ? { ...candidate, items: candidate.items.filter((item) => item.id !== itemId) }
          : candidate,
      ),
    };
    setTripPlan(addItineraryQualityNotes(nextTripPlan));
    setAssistantMessage("일정 항목을 뺐어요.");
  }

  function undoLatestManualChange() {
    if (!undoPlan) return;

    setTripPlan(undoPlan);
    setUndoPlan(null);
    setAssistantMessage("방금 변경한 일정을 되돌렸어요.");
  }

  function updateStartDate(nextStartDate: string) {
    setStartDate(nextStartDate);
    setEndDate((currentEndDate) =>
      currentEndDate < nextStartDate ? nextStartDate : currentEndDate,
    );
  }

  const sourceLabel = source ? sourceLabels[source] : null;

  return (
    <main className="min-h-screen px-4 py-4 sm:px-5 sm:py-5">
      <header className="mx-auto mb-4 flex max-w-[1480px] items-start justify-between gap-4 sm:items-center">
        <div>
          <p className="text-sm font-bold text-[var(--accent)]">AI Travel Board</p>
          <p className="mt-1 text-sm text-[var(--muted)]">여행을 한눈에 정리하는 나만의 보드</p>
        </div>
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="secondary-button list-none select-none">
              내 여행 {savedTrips.length ? `(${savedTrips.length})` : ""}
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-96 max-w-[calc(100vw-2rem)]">
              <SavedTripList
                activeTripId={tripPlan?.id}
                onDelete={removeSavedTrip}
                onDuplicate={duplicateTrip}
                onExport={exportTrips}
                onImport={importTrips}
                onLoad={loadSavedTrip}
                onRename={renameTrip}
                trips={savedTrips}
              />
            </div>
          </details>
          <ThemeToggle />
        </div>
      </header>
      <section className="mx-auto grid max-w-[1480px] gap-4 xl:grid-cols-[340px_minmax(0,1fr)_380px]">
        <aside className="panel h-fit p-5 xl:sticky xl:top-4 xl:self-start">
          <p className="text-sm font-bold text-[var(--accent)]">
            AI Travel Board
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">
            여행 조건을 구조화하고 일정 보드로 바꾸는 플래너
          </h1>

          {tripPlan && !isConditionFormOpen ? (
            <section className="mt-5 rounded-lg bg-[var(--panel-muted)] p-4">
              <p className="text-sm font-bold">{tripPlan.destination} · {tripPlan.days.length}일 일정</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {interests.map((interest) => interestOptions.find((option) => option.id === interest)?.label ?? interest).join(" · ")}
              </p>
              <button
                className="secondary-button condition-edit-button mt-3 w-auto"
                onClick={() => setIsConditionFormOpen(true)}
                type="button"
              >
                조건 수정
              </button>
            </section>
          ) : null}

          {!tripPlan || isConditionFormOpen ? (
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
                  min={today}
                  onChange={(event) => updateStartDate(event.target.value)}
                  type="date"
                  value={startDate}
                />
              </label>
              <label className="block">
                <span className="label">종료일</span>
                <input
                  className="field"
                  min={startDate}
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
          ) : null}

          <section aria-live="polite" className="mt-5 rounded-md bg-[var(--panel-muted)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">현재 상태</p>
              {sourceLabel ? (
                <span className={`source-badge ${source ?? ""}`}>
                  {sourceLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {status === "empty" && "여행지와 취향을 고르거나, 가운데 예시로 바로 시작해 보세요."}
              {status === "loading" &&
                "여행 취향을 바탕으로 동선을 짜고 있어요. 잠시만 기다려 주세요."}
              {status === "editing" &&
                "기존 여행 보드에 수정 요청을 적용 중입니다."}
              {status === "generated" &&
                "일정이 완성됐어요. 마음에 드는 장소를 지도에서도 확인해 보세요."}
              {status === "error" && error}
            </p>
            {assistantMessage ? (
              <p className="mt-2 text-sm font-semibold text-[var(--accent-strong)]">
                {assistantMessage}
              </p>
            ) : null}
            {status === "error" ? (
              <button
                className="secondary-button mt-3 w-auto"
                onClick={retryTrip}
                type="button"
              >
                다시 시도
              </button>
            ) : null}
          </section>
          <ChatModificationPanel
            disabled={!tripPlan || status === "editing"}
            hasTrip={Boolean(tripPlan)}
            isEditing={status === "editing"}
            messages={tripPlan?.chatMessages ?? []}
            onSubmit={modifyTrip}
          />
        </aside>

        <section
          aria-busy={status === "loading" || status === "editing"}
          className="panel min-h-[520px] p-4 sm:p-5 xl:min-h-[720px]"
        >
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
              {undoPlan ? (
                <button
                  className="secondary-button w-auto"
                  onClick={undoLatestManualChange}
                  type="button"
                >
                  변경 되돌리기
                </button>
              ) : null}
              {sourceLabel ? (
                <span className={`source-badge ${source ?? ""}`}>
                  {sourceLabel}
                </span>
              ) : null}
              <span className="rounded-md border border-[var(--line)] px-3 py-2 text-sm font-bold text-slate-600">
                {tripPlan ? `${tripPlan.days.length}일 일정` : "비어 있음"}
              </span>
            </div>
          </div>

          {tripPlan?.qualityNotes.length ? (
            <section
              aria-label="일정 확인 사항"
              className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--panel-muted)] p-4"
            >
              <p className="text-sm font-bold text-[var(--accent)]">일정 확인 사항</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--muted)]">
                {tripPlan.qualityNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </section>
          ) : null}

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
                    {day.items.map((item) => {
                      const isSelected = item.placeId === displayedSelectedPlaceId;

                      return (
                      <li
                        className="grid grid-cols-[72px_1fr] gap-3"
                        key={item.id}
                      >
                        <time className="pt-2 text-sm font-bold text-slate-500">
                          {item.startTime}
                        </time>
                        <div className={isSelected ? "timeline-item selected" : "timeline-item"}>
                        <button
                          aria-pressed={isSelected}
                          className="timeline-item-main"
                          disabled={!item.placeId}
                          id={`itinerary-item-${item.id}`}
                          onClick={() => item.placeId && setSelectedPlaceId(item.placeId)}
                          type="button"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{item.title}</p>
                            <span className="rounded bg-white px-2 py-1 text-xs font-bold text-slate-600">
                              {itemTypeLabels[item.type]} · {item.durationMinutes}
                              분
                            </span>
                            {isSelected ? (
                              <span className="selection-label">선택한 장소</span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {item.note}
                          </p>
                        </button>
                        <div className="mt-2 flex flex-wrap gap-2 border-t border-[var(--line)] pt-2">
                          <button
                            className="quick-request"
                            onClick={() => shiftItineraryItem(item.id, -30)}
                            type="button"
                          >
                            30분 앞당기기
                          </button>
                          <button
                            className="quick-request"
                            onClick={() => shiftItineraryItem(item.id, 30)}
                            type="button"
                          >
                            30분 늦추기
                          </button>
                          <button
                            className="quick-request text-[var(--rose)]"
                            onClick={() => removeItineraryItem(item.id, day.day)}
                            type="button"
                          >
                            일정 빼기
                          </button>
                        </div>
                        </div>
                      </li>
                      );
                    })}
                  </ol>
                </article>
              ))
            ) : (
              <StarterExamples
                examples={starterExamples}
                isLoading={status === "loading"}
                onSelect={startExample}
              />
            )}
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <TripMapPreview
            onSelectPlace={setSelectedPlaceId}
            selectedPlaceId={selectedPlaceId}
            tripPlan={tripPlan}
          />

          <section className="panel p-5">
            <p className="text-sm font-bold text-[var(--accent)]">장소 후보</p>
            <h2 className="mt-1 text-2xl font-bold">장소 카드</h2>

            <div className="mt-5 space-y-3">
              {(tripPlan?.places ?? []).map((place) => (
                <article
                  className={
                    displayedSelectedPlaceId === place.id
                      ? "place-card selected"
                      : "place-card"
                  }
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
                        selectedPlaceIds.has(place.id)
                          ? "badge active whitespace-nowrap"
                          : "badge whitespace-nowrap"
                      }
                    >
                      {displayedSelectedPlaceId === place.id
                        ? "선택됨"
                        : selectedPlaceIds.has(place.id)
                          ? "일정 포함"
                          : "후보 장소"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {place.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    <button
                      className="text-sm font-bold text-[var(--accent)]"
                      onClick={() => selectPlaceFromCard(place.id)}
                      type="button"
                    >
                      일정에서 보기
                    </button>
                    <button
                      className="text-sm font-bold text-[var(--accent)]"
                      onClick={() => selectPlaceAndRevealMap(place.id)}
                      type="button"
                    >
                      지도에서 보기
                    </button>
                  </div>
                </article>
              ))}
              {!tripPlan ? (
                <p className="text-sm leading-6 text-slate-600">
                  일정을 생성하면 장소 후보가 카드로 표시됩니다.
                </p>
              ) : null}
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

function getApiErrorMessage(data: unknown, fallback: string) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "object" &&
    data.error !== null &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    return data.error.message;
  }

  return fallback;
}
