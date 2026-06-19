import { tripPlanSchema } from "./schemas";
import type { TripPlan } from "./types";

export type PersistedPlanSource = "ai" | "mock" | "mock-fallback";

export type SavedTrip = {
  tripPlan: TripPlan;
  source: PersistedPlanSource;
  savedAt: string;
};

const storageKey = "ai-travel-board.saved-trips.v1";
const legacyStorageKey = "ai-travel-board.trip-plan";
const maxSavedTrips = 8;

function parseSavedTrips(value: string | null): SavedTrip[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      !("trips" in parsed) ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.trips)
    ) {
      return [];
    }

    return parsed.trips.flatMap((trip): SavedTrip[] => {
      if (typeof trip !== "object" || trip === null) return [];
      const candidate = trip as Partial<SavedTrip>;
      const tripPlan = tripPlanSchema.safeParse(candidate.tripPlan);
      const source = candidate.source;

      if (
        !tripPlan.success ||
        (source !== "ai" && source !== "mock" && source !== "mock-fallback") ||
        typeof candidate.savedAt !== "string"
      ) {
        return [];
      }

      return [{ tripPlan: tripPlan.data, source, savedAt: candidate.savedAt }];
    });
  } catch {
    return [];
  }
}

function writeSavedTrips(trips: SavedTrip[]) {
  window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, trips }));
}

function loadLegacyTrip(): SavedTrip[] {
  const value = window.localStorage.getItem(legacyStorageKey);
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    const candidate =
      typeof parsed === "object" && parsed !== null && "tripPlan" in parsed
        ? parsed.tripPlan
        : parsed;
    const tripPlan = tripPlanSchema.safeParse(candidate);

    if (!tripPlan.success) return [];

    return [{ tripPlan: tripPlan.data, source: "mock", savedAt: tripPlan.data.updatedAt }];
  } catch {
    return [];
  }
}

export function loadSavedTrips(): SavedTrip[] {
  const trips = parseSavedTrips(window.localStorage.getItem(storageKey));
  if (trips.length > 0) return trips;

  const legacyTrips = loadLegacyTrip();
  if (legacyTrips.length > 0) {
    writeSavedTrips(legacyTrips);
    window.localStorage.removeItem(legacyStorageKey);
  }

  return legacyTrips;
}

export function saveTrip(
  tripPlan: TripPlan,
  source: PersistedPlanSource,
): SavedTrip[] {
  const savedAt = new Date().toISOString();
  const previousTrips = loadSavedTrips().filter(
    (savedTrip) => savedTrip.tripPlan.id !== tripPlan.id,
  );
  const trips = [{ tripPlan, source, savedAt }, ...previousTrips]
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    .slice(0, maxSavedTrips);

  writeSavedTrips(trips);
  return trips;
}

export function deleteSavedTrip(tripId: string): SavedTrip[] {
  const trips = loadSavedTrips().filter(
    (savedTrip) => savedTrip.tripPlan.id !== tripId,
  );
  writeSavedTrips(trips);
  return trips;
}

export function renameSavedTrip(tripId: string, title: string): SavedTrip[] {
  const normalizedTitle = title.trim().slice(0, 80);
  if (!normalizedTitle) return loadSavedTrips();

  const savedAt = new Date().toISOString();
  const trips = loadSavedTrips()
    .map((savedTrip) =>
      savedTrip.tripPlan.id === tripId
        ? {
            ...savedTrip,
            tripPlan: {
              ...savedTrip.tripPlan,
              title: normalizedTitle,
              updatedAt: savedAt,
            },
            savedAt,
          }
        : savedTrip,
    )
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt));

  writeSavedTrips(trips);
  return trips;
}
