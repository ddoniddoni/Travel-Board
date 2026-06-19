import type { z } from "zod";
import type {
  dayPlanSchema,
  chatMessageSchema,
  itineraryItemSchema,
  placeCandidateSchema,
  travelerPreferenceSchema,
  tripInputSchema,
  tripModificationRequestSchema,
  tripPlanSchema,
} from "./schemas";

export type TravelerPreference = z.infer<typeof travelerPreferenceSchema>;
export type TripInput = z.infer<typeof tripInputSchema>;
export type PlaceCandidate = z.infer<typeof placeCandidateSchema>;
export type ItineraryItem = z.infer<typeof itineraryItemSchema>;
export type DayPlan = z.infer<typeof dayPlanSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type TripPlan = z.infer<typeof tripPlanSchema>;
export type TripModificationRequest = z.infer<
  typeof tripModificationRequestSchema
>;
