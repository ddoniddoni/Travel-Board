"use client";

import type { SavedTrip } from "../storage";

type SavedTripListProps = {
  activeTripId?: string;
  trips: SavedTrip[];
  onDelete: (tripId: string) => void;
  onLoad: (trip: SavedTrip) => void;
};

function formatSavedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "방금 저장됨"
    : new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}

export function SavedTripList({
  activeTripId,
  trips,
  onDelete,
  onLoad,
}: SavedTripListProps) {
  return (
    <section className="panel p-5">
      <p className="text-sm font-bold text-[var(--accent)]">저장한 여행</p>
      <h2 className="mt-1 text-2xl font-bold">내 여행 보드</h2>

      {trips.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          일정을 생성하면 이 브라우저에 최대 8개의 여행 보드가 저장됩니다.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {trips.map((trip) => (
            <li
              className={
                activeTripId === trip.tripPlan.id
                  ? "saved-trip active"
                  : "saved-trip"
              }
              key={trip.tripPlan.id}
            >
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => onLoad(trip)}
                type="button"
              >
                <p className="truncate text-sm font-bold">{trip.tripPlan.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {trip.tripPlan.destination} · {trip.tripPlan.days.length}일 · {formatSavedAt(trip.savedAt)}
                </p>
              </button>
              <button
                aria-label={`${trip.tripPlan.title} 삭제`}
                className="saved-trip-delete"
                onClick={() => onDelete(trip.tripPlan.id)}
                type="button"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
