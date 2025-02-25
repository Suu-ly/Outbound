"use server";

import { getStartingIndex, insertAfter } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { and, eq, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { db } from "./db";
import {
  InsertTrip,
  InsertTripDay,
  SelectTrip,
  trip,
  tripDay,
  tripPlace,
} from "./db/schema";
import { ApiResponse } from "./types";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 12;
const MAX_RETRIES = 20;

// TODO protect functions with auth check

export async function addNewTrip(
  locationId: string,
  locationName: string,
  userId: string,
  dates: DateRange,
) {
  const result = await db
    .transaction(async (tx) => {
      if (!dates.from || !dates.to || !locationId || !userId) return false;

      let validId = "";
      let retries = MAX_RETRIES;

      while (!validId) {
        const tripId = customAlphabet(ALPHABET, ID_LENGTH)();

        const tripData: InsertTrip = {
          id: tripId,
          userId: userId,
          locationId: locationId,
          name: `Trip to ${locationName}`,
          startDate: dates.from,
          endDate: dates.to,
        };
        try {
          await tx.transaction(async (tx2) => {
            await tx2.insert(trip).values(tripData);
          });
          validId = tripId;
        } catch {
          console.log("This ID already exists", tripId);
          // Id already exists
          if (retries === 0)
            throw new Error(`Failed to generate a unique trip ID!`);
          retries -= 1;
        }
      }

      const numberOfDays = differenceInCalendarDays(dates.to, dates.from) + 1;
      const days: InsertTripDay[] = new Array(numberOfDays);
      let order = getStartingIndex();
      for (let day = 0; day < numberOfDays; day++) {
        days[day] = {
          tripId: validId,
          order: order,
        };
        order = insertAfter(order);
      }

      await tx.insert(tripDay).values(days);

      return validId;
    })
    .catch(() => undefined);

  if (!result)
    return { message: "Error while creating a new trip!", status: "error" };

  redirect(`/trip/${result}/discover`);
}

export async function updateTripWindows(
  newWindows: Pick<SelectTrip, "currentSearchIndex" | "nextPageToken">,
  id: string,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(trip)
      .set({
        currentSearchIndex: newWindows.currentSearchIndex,
        nextPageToken: newWindows.nextPageToken,
      })
      .where(eq(trip.id, id));
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update search windows",
    };
  }
}

export async function setPlaceAsUninterested(
  tripPlaceId: string,
  tripId: string,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(tripPlace)
      .set({
        type: "skipped",
      })
      .where(
        and(eq(tripPlace.placeId, tripPlaceId), eq(tripPlace.tripId, tripId)),
      );
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update place preferences",
    };
  }
}

export async function setPlaceAsInterested(
  tripPlaceId: string,
  tripId: string,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(tripPlace)
      .set({
        order: sql`insert_after(
        (SELECT ${tripPlace.order} from ${tripPlace} WHERE 
        ${tripPlace.tripId} = ${tripId} AND 
        ${tripPlace.dayId} IS NULL AND 
        ${tripPlace.type} = 'saved' AND
        ${tripPlace.order} IS NOT NULL 
        ORDER BY ${tripPlace.order} DESC LIMIT 1))`,
        type: "saved",
      })
      .where(
        and(eq(tripPlace.placeId, tripPlaceId), eq(tripPlace.tripId, tripId)),
      );
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update place preferences",
    };
  }
}

export async function removePlaceFromInterested(
  tripId: string,
  tripPlaceId: string,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(tripPlace)
      .set({
        order: null,
        type: "skipped",
      })
      .where(
        and(eq(tripPlace.placeId, tripPlaceId), eq(tripPlace.tripId, tripId)),
      );
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update place preferences",
    };
  }
}

export async function updateTripPlaceOrder(
  tripId: string,
  tripPlaceId: string,
  newOrder: string,
  newDay?: number | null,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(tripPlace)
      .set({
        order: newOrder,
        dayId: newDay,
      })
      .where(
        and(eq(tripPlace.placeId, tripPlaceId), eq(tripPlace.tripId, tripId)),
      );
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update place preferences",
    };
  }
}

export async function updateTripPlaceNote(
  tripId: string,
  tripPlaceId: string,
  note: string | null,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(tripPlace)
      .set({
        note: note,
      })
      .where(
        and(eq(tripPlace.placeId, tripPlaceId), eq(tripPlace.tripId, tripId)),
      );
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update place preferences",
    };
  }
}

export async function updateTripDayOrder(
  tripId: string,
  tripDayId: number,
  newOrder: string,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(tripDay)
      .set({
        order: newOrder,
      })
      .where(and(eq(tripDay.id, tripDayId), eq(tripDay.tripId, tripId)));
    return {
      status: "success",
      data: true,
    };
  } catch (e) {
    console.log(e);
    return {
      status: "error",
      message: "Unable to update place preferences",
    };
  }
}
