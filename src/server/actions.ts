"use server";

import { getStartingIndex, insertAfter } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { and, eq, inArray, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { db } from "./db";
import {
  InsertTrip,
  InsertTripDay,
  SelectTrip,
  SelectTripTravelTime,
  trip,
  tripDay,
  tripPlace,
  tripTravelTime,
} from "./db/schema";
import { ApiResponse, DayData } from "./types";

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
        dayId: null,
        order: null,
        note: null,
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
        (SELECT MAX(${tripPlace.order}) from ${tripPlace} WHERE 
        ${tripPlace.tripId} = ${tripId} AND 
        ${tripPlace.dayId} IS NULL AND 
        ${tripPlace.type} = 'saved')
        )`,
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

export async function addTripDays(
  newDays: InsertTripDay[],
): Promise<ApiResponse<DayData[]>> {
  try {
    const result = await db.insert(tripDay).values(newDays).returning({
      dayId: tripDay.id,
      dayOrder: tripDay.order,
      dayStartTime: tripDay.startTime,
    });

    // Makes sure the retured values are in order
    result.sort((a, b) => {
      if (a.dayOrder < b.dayOrder) {
        return -1;
      }
      if (a.dayOrder > b.dayOrder) {
        return 1;
      }
      return 0;
    });

    return {
      status: "success",
      data: result,
    };
  } catch (e) {
    console.log(e);
    return {
      status: "error",
      message: "Unable to add trip days",
    };
  }
}

export async function deleteTripDays(
  deleteDays: number[],
  tripId: string,
): Promise<ApiResponse<true>> {
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        WITH RECURSIVE 
        places_to_move AS (
          SELECT ${tripPlace.placeId}, ROW_NUMBER() OVER (ORDER BY ${tripDay.order},${tripPlace.order}) as rn
          FROM ${tripPlace}
          LEFT JOIN ${tripDay} ON ${tripDay.id} = ${tripPlace.dayId}
          WHERE ${tripPlace.dayId} IN ${deleteDays}
          ORDER BY rn
        ),
        new_orders (place_id, new_order, rn) AS (
          SELECT ptm.place_id, insert_after(
            (
              SELECT MAX(${tripPlace.order}) 
              FROM ${tripPlace} 
              WHERE ${tripPlace.tripId} = ${tripId} 
              AND ${tripPlace.dayId} IS NULL 
              AND ${tripPlace.type} = 'saved'
            )
          ), 1::bigint
          FROM places_to_move ptm
          WHERE ptm.rn = 1
          UNION ALL
          SELECT ptm.place_id, insert_after(no.new_order), ptm.rn
          FROM places_to_move ptm
          JOIN new_orders no ON ptm.rn = no.rn + 1
        )
        UPDATE ${tripPlace}
        SET
          "day_id" = NULL,
          "order" = no.new_order
        FROM new_orders no
        WHERE ${tripPlace.placeId} = no.place_id;  
        `);
      await tx.delete(tripDay).where(inArray(tripDay.id, deleteDays));
    });
    return {
      status: "success",
      data: true,
    };
  } catch (e) {
    console.log(e);
    return {
      status: "error",
      message: "Unable to delete trip days",
    };
  }
}

export async function updateTripDates(
  startDate: Date,
  endDate: Date,
  tripId: string,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(trip)
      .set({ startDate: startDate, endDate: endDate })
      .where(eq(trip.id, tripId));
    return {
      status: "success",
      data: true,
    };
  } catch (e) {
    console.log(e);
    return {
      status: "error",
      message: "Unable to update trip dates",
    };
  }
}

export async function updatePreferredTravelMode(
  fromId: string,
  toId: string,
  tripId: string,
  mode: SelectTripTravelTime["type"],
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(tripTravelTime)
      .set({ type: mode })
      .where(
        and(
          eq(tripTravelTime.from, fromId),
          eq(tripTravelTime.to, toId),
          eq(tripTravelTime.tripId, tripId),
        ),
      );
    return {
      status: "success",
      data: true,
    };
  } catch (e) {
    console.log(e);
    return {
      status: "error",
      message: "Unable to preferred travel method",
    };
  }
}
