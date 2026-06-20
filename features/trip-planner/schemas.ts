import { z } from "zod";

export const travelerPreferenceSchema = z.object({
  pace: z.enum(["relaxed", "balanced", "packed"]),
  interests: z.array(z.string().min(1)).min(1),
  budgetLevel: z.enum(["low", "medium", "high"]),
  companions: z.array(z.string().min(1)).default([]),
  notes: z.string().max(600).optional(),
});

export const tripInputSchema = z
  .object({
    destination: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    preference: travelerPreferenceSchema,
  })
  .refine((input) => input.startDate <= input.endDate, {
    message: "End date must be after start date.",
    path: ["endDate"],
  });

export const placeCandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["food", "cafe", "sightseeing", "culture", "shopping", "rest"]),
  area: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  description: z.string().min(1),
  tags: z.array(z.string()).default([]),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  address: z.string().min(1).optional(),
  rating: z.number().min(0).max(5).optional(),
  openingHoursSummary: z.string().min(1).optional(),
  provider: z.enum(["mock", "google"]).optional(),
  providerPlaceId: z.string().min(1).optional(),
});

export const itineraryItemSchema = z.object({
  id: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().min(1),
  type: z.enum(["meal", "activity", "cafe", "move", "rest"]),
  placeId: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  note: z.string().min(1),
});

export const dayPlanSchema = z.object({
  day: z.number().int().positive(),
  date: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  items: z.array(itineraryItemSchema).min(1),
});

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(800),
  createdAt: z.string().min(1),
});

export const tripPlanSchema = z.object({
  id: z.string().min(1),
  destination: z.string().min(1),
  title: z.string().min(1),
  styleSummary: z.string().min(1),
  input: tripInputSchema,
  days: z.array(dayPlanSchema).min(1),
  places: z.array(placeCandidateSchema).min(1),
  qualityNotes: z.array(z.string()).default([]),
  chatMessages: z.array(chatMessageSchema).default([]),
  updatedAt: z.string().min(1),
});

export const tripModificationRequestSchema = z.object({
  message: z.string().min(1).max(800),
  tripPlan: tripPlanSchema,
});

export const generateTripResponseSchema = z.object({
  tripPlan: tripPlanSchema,
  source: z.enum(["ai", "mock", "mock-fallback"]),
});

export const modifyTripResponseSchema = z.object({
  tripPlan: tripPlanSchema,
  assistantMessage: z.string().min(1),
  source: z.enum(["ai", "mock", "mock-fallback"]),
});
