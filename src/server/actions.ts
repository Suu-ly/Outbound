"use server";

import { getStartingIndex, insertAfter } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";
import { and, eq, inArray, sql } from "drizzle-orm";
import { customAlphabet, nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { auth } from "./auth";
import { db } from "./db";
import {
  InsertTrip,
  InsertTripDay,
  place,
  SelectTrip,
  SelectTripTravelTime,
  trip,
  tripDay,
  tripPlace,
  tripTravelTime,
} from "./db/schema";
import { supabase } from "./supabase";
import { ApiResponse, DayData } from "./types";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 12;
const MAX_RETRIES = 20;

async function authenticate() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function addNewTrip(
  locationId: string,
  locationName: string,
  dates: DateRange,
) {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  const result = await db
    .transaction(async (tx) => {
      if (!dates.from || !dates.to || !locationId) return false;

      let validId = "";
      let retries = MAX_RETRIES;

      while (!validId) {
        const tripId = customAlphabet(ALPHABET, ID_LENGTH)();

        const tripData: InsertTrip = {
          id: tripId,
          userId: session.user.id,
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
    .catch((e) => {
      console.error(e.message);
    });

  if (!result)
    return { message: "Error while creating a new trip!", status: "error" };

  redirect(`/trip/${result}/discover`);
}

export async function updateTripWindows(
  newWindows: Pick<SelectTrip, "currentSearchIndex" | "nextPageToken">,
  id: string,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(trip)
      .set({
        currentSearchIndex: newWindows.currentSearchIndex,
        nextPageToken: newWindows.nextPageToken,
      })
      .where(and(eq(trip.id, id), eq(trip.userId, session.user.id)));
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
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(tripPlace)
      .set({
        type: "skipped",
        dayId: null,
        order: null,
        note: null,
      })
      .from(trip)
      .where(
        and(
          eq(tripPlace.placeId, tripPlaceId),
          eq(tripPlace.tripId, tripId),
          eq(trip.id, tripPlace.tripId),
          eq(trip.userId, session.user.id),
        ),
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
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
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
      .from(trip)
      .where(
        and(
          eq(tripPlace.placeId, tripPlaceId),
          eq(tripPlace.tripId, tripId),
          eq(trip.id, tripPlace.tripId),
          eq(trip.userId, session.user.id),
        ),
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
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(tripPlace)
      .set({
        order: newOrder,
        dayId: newDay,
      })
      .from(trip)
      .where(
        and(
          eq(tripPlace.placeId, tripPlaceId),
          eq(tripPlace.tripId, tripId),
          eq(trip.id, tripPlace.tripId),
          eq(trip.userId, session.user.id),
        ),
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

export async function moveTripPlace(
  tripId: string,
  tripPlaceId: string,
  newDay: number | null,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(tripPlace)
      .set({
        order: newDay
          ? sql`insert_after(
        (SELECT MAX(${tripPlace.order}) from ${tripPlace} WHERE 
        ${tripPlace.tripId} = ${tripId} AND 
        ${tripPlace.dayId} = ${Number(newDay)} AND 
        ${tripPlace.type} = 'saved')
        )`
          : sql`insert_after(
          (SELECT MAX(${tripPlace.order}) from ${tripPlace} WHERE 
          ${tripPlace.tripId} = ${tripId} AND 
          ${tripPlace.dayId} IS NULL AND 
          ${tripPlace.type} = 'saved')
          )`,
        dayId: newDay,
      })
      .from(trip)
      .where(
        and(
          eq(tripPlace.placeId, tripPlaceId),
          eq(tripPlace.tripId, tripId),
          eq(trip.id, tripPlace.tripId),
          eq(trip.userId, session.user.id),
        ),
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
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(tripPlace)
      .set({
        note: note,
      })
      .from(trip)
      .where(
        and(
          eq(tripPlace.placeId, tripPlaceId),
          eq(tripPlace.tripId, tripId),
          eq(trip.id, tripPlace.tripId),
          eq(trip.userId, session.user.id),
        ),
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
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(tripDay)
      .set({
        order: newOrder,
      })
      .from(trip)
      .where(
        and(
          eq(tripDay.id, tripDayId),
          eq(tripDay.tripId, tripId),
          eq(trip.id, tripDay.tripId),
          eq(trip.userId, session.user.id),
        ),
      );
    return {
      status: "success",
      data: true,
    };
  } catch (e) {
    console.error(e);
    return {
      status: "error",
      message: "Unable to update place preferences",
    };
  }
}

export async function addTripDays(
  newDays: InsertTripDay[],
): Promise<ApiResponse<DayData[]>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    if (!newDays.length)
      return {
        status: "error",
        message: "No new days to add",
      };
    const [tripUserId] = await db
      .select({ userId: trip.userId })
      .from(trip)
      .where(eq(trip.id, newDays[0].tripId))
      .limit(1);
    if (!tripUserId || tripUserId.userId !== session.user.id)
      return { message: "Unauthorized", status: "error" };

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
    console.error(e);
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
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    const [tripUserId] = await db
      .select({ userId: trip.userId })
      .from(trip)
      .where(eq(trip.id, tripId))
      .limit(1);
    if (!tripUserId || tripUserId.userId !== session.user.id)
      return { message: "Unauthorized", status: "error" };
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
    console.error(e);
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
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(trip)
      .set({ startDate: startDate, endDate: endDate })
      .where(and(eq(trip.id, tripId), eq(trip.userId, session.user.id)));
    return {
      status: "success",
      data: true,
    };
  } catch (e) {
    console.error(e);
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
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(tripTravelTime)
      .set({ type: mode })
      .from(trip)
      .where(
        and(
          eq(tripTravelTime.from, fromId),
          eq(tripTravelTime.to, toId),
          eq(tripTravelTime.tripId, tripId),
          eq(tripTravelTime.tripId, trip.id),
          eq(trip.userId, session.user.id),
        ),
      );
    return {
      status: "success",
      data: true,
    };
  } catch (e) {
    console.error(e);
    return {
      status: "error",
      message: "Unable to preferred travel method",
    };
  }
}

export async function updateTripTimeSpent(
  tripId: string,
  tripPlaceId: string,
  timeSpent: number,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(tripPlace)
      .set({
        timeSpent: timeSpent,
      })
      .from(trip)
      .where(
        and(
          eq(tripPlace.placeId, tripPlaceId),
          eq(tripPlace.tripId, tripId),
          eq(tripPlace.tripId, trip.id),
          eq(trip.userId, session.user.id),
        ),
      );
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update time spent",
    };
  }
}

export async function updateDayStartTime(
  dayId: number,
  newTime: string,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(tripDay)
      .set({
        startTime: newTime,
      })
      .from(trip)
      .where(
        and(
          eq(tripDay.id, dayId),
          eq(tripDay.tripId, trip.id),
          eq(trip.userId, session.user.id),
        ),
      );
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update time spent",
    };
  }
}

export async function updateTripStartTime(
  tripId: string,
  newTime: string,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(trip)
      .set({
        startTime: newTime,
      })
      .where(and(eq(trip.id, tripId), eq(trip.userId, session.user.id)));
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update default start time",
    };
  }
}
export async function updateTripEndTime(
  tripId: string,
  newTime: string,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(trip)
      .set({
        endTime: newTime,
      })
      .where(and(eq(trip.id, tripId), eq(trip.userId, session.user.id)));
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update end time",
    };
  }
}
export async function updateTripRoundUpTime(
  tripId: string,
  roundUpTime: boolean,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(trip)
      .set({
        roundUpTime: roundUpTime,
      })
      .where(and(eq(trip.id, tripId), eq(trip.userId, session.user.id)));
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update trip travel time estimates preference",
    };
  }
}
export async function updateTripPrivacy(
  tripId: string,
  privacy: boolean,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(trip)
      .set({
        private: privacy,
      })
      .where(and(eq(trip.id, tripId), eq(trip.userId, session.user.id)));
    revalidatePath("/");
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update trip privacy",
    };
  }
}
export async function updateTripName(
  tripId: string,
  newName: string,
): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .update(trip)
      .set({
        name: newName,
      })
      .where(and(eq(trip.id, tripId), eq(trip.userId, session.user.id)));
    revalidatePath("/");
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update trip name",
    };
  }
}

export async function deleteTrip(tripId: string): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };
  try {
    await db
      .delete(trip)
      .where(and(eq(trip.id, tripId), eq(trip.userId, session.user.id)));
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to delete trip",
    };
  }
}

export async function updatePlaceImage(
  coverImg: string,
  coverImgSmall: string,
  placeId: string,
): Promise<ApiResponse<true>> {
  try {
    await db
      .update(place)
      .set({ coverImg: coverImg, coverImgSmall: coverImgSmall })
      .where(eq(place.id, placeId));
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update cover image!",
    };
  }
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function updateAvatar(image: string): Promise<ApiResponse<true>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };

  const { data, error } = await supabase.storage
    .from("profile-pictures")
    .upload(
      `${session.user.id}.jpeg`,
      base64ToArrayBuffer(image.split("base64,")[1]),
      {
        contentType: "image/jpeg",
        upsert: true,
      },
    );

  if (error || !data) {
    console.error(error.message);
    return { message: error.message, status: "error" };
  }

  const { data: path } = supabase.storage
    .from("profile-pictures")
    .getPublicUrl(`${session.user.id}.jpeg`);

  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        image: path.publicUrl + `?v=${nanoid(6)}`,
      },
    });
    revalidatePath("/account");
    return {
      status: "success",
      data: true,
    };
  } catch {
    return {
      status: "error",
      message: "Unable to update avatar!",
    };
  }
}
