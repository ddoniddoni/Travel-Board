import type { DayPlan, TripPlan } from "./types";

const MINIMUM_TRANSFER_BUFFER_MINUTES = 15;
const GENERATED_NOTE_PREFIX = /^Day \d+:/;

export function addItineraryQualityNotes(tripPlan: TripPlan): TripPlan {
  const generatedNotes = tripPlan.days.flatMap(getDayQualityNotes);
  const preservedNotes = tripPlan.qualityNotes.filter(
    (note) => !GENERATED_NOTE_PREFIX.test(note),
  );
  const qualityNotes = [...new Set([...preservedNotes, ...generatedNotes])];

  return { ...tripPlan, qualityNotes };
}

function getDayQualityNotes(day: DayPlan) {
  const items = day.items.toSorted((left, right) =>
    left.startTime.localeCompare(right.startTime),
  );
  const notes: string[] = [];

  for (let index = 1; index < items.length; index += 1) {
    const previous = items[index - 1];
    const current = items[index];
    const gapMinutes = toMinutes(current.startTime) - endMinutes(previous);

    if (gapMinutes < 0) {
      notes.push(
        `Day ${day.day}: ${previous.title} 일정이 ${current.title} 일정과 겹칩니다.`,
      );
      continue;
    }

    if (
      previous.placeId &&
      current.placeId &&
      previous.placeId !== current.placeId &&
      gapMinutes < MINIMUM_TRANSFER_BUFFER_MINUTES
    ) {
      notes.push(
        `Day ${day.day}: ${previous.title}에서 ${current.title}까지 이동 여유가 ${MINIMUM_TRANSFER_BUFFER_MINUTES}분보다 짧습니다.`,
      );
    }
  }

  return notes;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function endMinutes(item: DayPlan["items"][number]) {
  return toMinutes(item.startTime) + item.durationMinutes;
}
