"use server";

import { differenceInCalendarDays } from "date-fns";
import { eq } from "drizzle-orm";
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
} from "./db/schema";
import { ApiResponse } from "./types";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 12;
const MAX_RETRIES = 20;

export async function addNewTrip(
  locationId: string,
  locationName: string,
  userId: string,
  dates: DateRange,
) {
  const result = await db.transaction(async (tx) => {
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
        // Id already exists
        if (retries === 1)
          throw new Error(`Failed to generate a unique trip ID!`);
        retries -= 1;
      }
    }

    const numberOfDays = differenceInCalendarDays(dates.to, dates.from) + 1;
    const days: InsertTripDay[] = new Array(numberOfDays).fill({
      tripId: validId,
    });
    const newDays = await tx
      .insert(tripDay)
      .values(days)
      .returning({ id: tripDay.id });

    if (newDays.length > 1) {
      const queries = [];
      for (let i = 0; i < newDays.length; i++) {
        queries.push(
          tx
            .update(tripDay)
            .set({
              prevDay: i === 0 ? undefined : newDays[i - 1].id,
              nextDay: i === newDays.length - 1 ? undefined : newDays[i + 1].id,
            })
            .where(eq(tripDay.id, newDays[i].id)),
        );
      }
      await Promise.all(queries);
    }

    return validId;
  });

  if (!result)
    return { message: "Required information are not set!", status: "error" };

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
