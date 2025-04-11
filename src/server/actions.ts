"use server";

import { GMM } from "@/lib/gmm";
import { digitStringToMins, getStartingIndex, insertAfter } from "@/lib/utils";
import distance from "@turf/distance";
import { differenceInCalendarDays } from "date-fns";
import { and, asc, eq, inArray, isNull, or, SQL, sql } from "drizzle-orm";
import { customAlphabet, nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
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
import {
  ApiResponse,
  DayData,
  InitialQuery,
  LngLat,
  PlaceData,
  PlaceDataEntry,
} from "./types";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const ID_LENGTH = 12;
const MAX_RETRIES = 20;

async function refresh() {
  (await cookies()).set("revalidate", Date.now().toString());
}

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
          console.warn("This ID already exists", tripId);
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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
    await refresh();
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

  const res = await auth.api.updateUser({
    headers: await headers(),
    body: {
      image: path.publicUrl + `?v=${nanoid(6)}`,
    },
  });
  if (res.status) {
    revalidatePath("/account");
    return {
      status: "success",
      data: true,
    };
  }
  return {
    status: "error",
    message: "Unable to update avatar!",
  };
}

export async function updateUserName(name: string): Promise<ApiResponse<true>> {
  const res = await auth.api.updateUser({
    headers: await headers(),
    body: {
      name: name,
    },
  });
  if (res.status) {
    revalidatePath("/account");
    return { status: "success", data: true };
  }
  return { status: "error", message: "Unable to update your name!" };
}

export async function updatePassword(
  password: string,
  currentPassword: string,
): Promise<ApiResponse<true>> {
  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        newPassword: password,
        currentPassword: currentPassword,
      },
    });

    return { status: "success", data: true };
  } catch (e: unknown) {
    if (e instanceof Error) return { status: "error", message: e.message };
    else return { status: "error", message: "Unable to update password!" };
  }
}

// -------------------------------------------------------------------------
//                  Generate itinerary functions
// -------------------------------------------------------------------------

type MapboxResponse =
  | {
      message: "Not Found";
    }
  | {
      message: "Not Authorized - Invalid Token";
    }
  | {
      message: "Not Authorized - Invalid Token";
      error_detail: "No valid token prefix found in access_token parameter";
    }
  | { message: "Forbidden" }
  | { message: string; code: "InvalidInput" }
  | {
      code: "NoSegment";
      message: string;
      routes: [];
    }
  | { code: "NoRoute"; message: string; routes: [] }
  | {
      code: "Ok";
      durations: number[][];
      destinations: {
        name: string;
        location: LngLat;
        distance: number;
      }[];

      sources: {
        name: string;
        location: LngLat;
        distance: number;
      }[];
    };

// Generate Haversine distance matrix of the points in km
const generateDistanceMatrix = async (data: PlaceDataEntry[]) => {
  const length = data.length;
  if (length <= 25) {
    const matrix = await fetch(
      `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${data.map((placeEntry) => `${placeEntry.placeInfo.location.longitude},${placeEntry.placeInfo.location.latitude}`).join(";")}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          referer: (await headers()).get("referer") || "",
        },
      },
    )
      .then((response) => response.json())
      .then((data) => data as MapboxResponse);

    if ("code" in matrix && matrix.code === "Ok") {
      const distanceMatrix = matrix.durations; // We use duration instead of distance as we want to minimise travel time
      // Value will be null if there are no routes
      for (let i = 0; i < distanceMatrix.length; i++) {
        for (let j = 0; j < distanceMatrix[i].length; j++) {
          if (distanceMatrix[i][j] === null) distanceMatrix[i][j] = Infinity;
        }
      }
      return distanceMatrix;
    }
  }
  const distanceMatrix = Array.from(
    { length: length },
    () => new Array(length),
  );
  for (let i = 0; i < length; i++) {
    for (let j = i; j < length; j++) {
      if (j === i) distanceMatrix[i][j] = 0;
      else {
        distanceMatrix[i][j] = distance(
          [
            data[i].placeInfo.location.longitude,
            data[i].placeInfo.location.latitude,
          ],
          [
            data[j].placeInfo.location.longitude,
            data[j].placeInfo.location.latitude,
          ],
        );
        distanceMatrix[j][i] = distanceMatrix[i][j];
      }
    }
  }
  return distanceMatrix;
};

// Swaps the two indices of the array
const swap = (tour: number[], i: number, j: number) => {
  const newArr = tour.slice(0);
  const temp = newArr[i];
  newArr[i] = newArr[j];
  newArr[j] = temp;
  return newArr;
};

const swapEdges = (tour: number[], first: number, second: number) => {
  return tour.slice(0, first + 1).concat(
    tour
      .slice(first + 1, second + 1)
      .reverse()
      .concat(tour.slice(second + 1)),
  );
};

const detour = (
  before: number,
  insert: number,
  after: number,
  distanceMatrix: number[][],
) => {
  return (
    distanceMatrix[before][insert] +
    distanceMatrix[insert][after] -
    distanceMatrix[before][after]
  );
};

const generateRandomPath = (N: number) => {
  const path = Array.from({ length: N }, (_, i) => i);
  for (let i = path.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = path[i];
    path[i] = path[j];
    path[j] = temp;
  }
  return path;
};

const getTourDistance = (path: number[], distanceMatrix: number[][]) => {
  if (path.length <= 1) return 0;
  let distance = distanceMatrix[path[0]][path[path.length - 1]];
  for (let i = 1; i < path.length; i++) {
    distance += distanceMatrix[path[i - 1]][path[i]];
  }
  return distance;
};
async function TSP(data: PlaceDataEntry[]) {
  if (data.length <= 1) return data;
  const distances = await generateDistanceMatrix(data);
  let remaining = generateRandomPath(data.length);
  // Traversal order indexes
  let tour: number[] = [remaining[0]];

  // Farthest insertion heuristic
  for (let i = 1; i < data.length; i++) {
    let indexInRemaining = 0;
    let indexInPath = 0;
    let minDistance = Infinity;
    let maximalDistanceToTour = -1;

    for (let j = i; j < data.length; j++) {
      minDistance = Infinity;

      for (let k = 0; k < tour.length; k++) {
        const currentDistance = distances[tour[k]][remaining[j]];
        // find minimal distance from j to a point in the subtour
        if (currentDistance < minDistance) {
          minDistance = currentDistance;
        }
      }
      // for farthest insertion store the point whose minimal distance to the tour is maximal
      if (minDistance > maximalDistanceToTour) {
        if (minDistance > maximalDistanceToTour) {
          maximalDistanceToTour = minDistance;
          indexInRemaining = j;
        }
      }
    }

    remaining = swap(remaining, indexInRemaining, i);

    // look for the edge in the subtour where insertion would be least costly
    let smallestDetour = Infinity;
    for (let k = 0; k < tour.length - 1; k++) {
      const currentDetour = detour(
        tour[k],
        remaining[i],
        tour[k + 1],
        distances,
      );
      if (currentDetour < smallestDetour) {
        smallestDetour = currentDetour;
        indexInPath = k;
      }
    }
    // check the detour between last point and first
    if (
      detour(tour[tour.length - 1], remaining[i], tour[0], distances) <
      smallestDetour
    ) {
      tour.splice(tour.length, 0, remaining[i]);
    } else {
      tour.splice(indexInPath + 1, 0, remaining[i]);
    }
  }

  // 2-opt heuristic improvement
  let bestDistance = getTourDistance(tour, distances);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < tour.length - 2; i++) {
      for (let j = i + 2; j < tour.length - 1; j++) {
        if (
          distances[tour[i]][tour[i + 1]] + distances[tour[j]][tour[j + 1]] >
          distances[tour[i]][tour[j]] + distances[tour[j + 1]][tour[i + 1]]
        ) {
          tour = swapEdges(tour, i, j);
          const newDistance = getTourDistance(tour, distances);
          if (newDistance < bestDistance) {
            improved = true;
            bestDistance = newDistance;
          }
        }
      }
      // check the edge from last point to first point
      if (
        distances[tour[i]][tour[i + 1]] +
          distances[tour[tour.length - 1]][tour[0]] >
        distances[tour[i]][tour[tour.length - 1]] +
          distances[tour[0]][tour[i + 1]]
      ) {
        tour = swapEdges(tour, i, tour.length - 1);
        const newDistance = getTourDistance(tour, distances);
        if (newDistance < bestDistance) {
          improved = true;
          bestDistance = newDistance;
        }
      }
    }
  }

  // Find the largest distance and set the index after it to be the starting
  let farthest = distances[tour[0]][tour[1]];
  let farthestIndex = 0;
  for (let i = 1; i < tour.length - 1; i++) {
    const distance = distances[tour[i]][tour[i + 1]];
    if (distance > farthest) {
      farthest = distance;
      farthestIndex = i;
    }
  } // Check distance of first and last indexes
  const distance = distances[tour[tour.length - 1]][tour[0]];
  if (distance > farthest) {
    farthestIndex = tour.length - 1;
  }
  tour =
    farthestIndex < tour.length - 1
      ? tour.slice(farthestIndex + 1).concat(tour.slice(0, farthestIndex + 1))
      : tour;

  const result = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[tour[i]];
  }

  return result;
}

const TRAVEL_SPEED = 32 / 60; // in km/min
const HIGH_PROB = 0.8;
const LOW_PROB = 0.2;
const TRAVEL_TIME_BUFFER = 15;

const getCandidateDays = (
  probs: (PlaceDataEntry & {
    probability: number;
  })[][],
  allowance: number,
  numDays: number,
) => {
  // Array containing all the candidate days
  const output = [];
  // Keeps track of variables for each candidate day for second pass
  const resume: {
    timeLeft: number;
    gaussian: number;
  }[] = [];
  // Keeps track of the index we ended the first pass at for each gaussian
  const gaussianIndex: number[] = [];
  // keeps track of which places have already been added to a day
  const visited: Record<string, boolean> = {};

  // First pass, we accept days only with a high probability of belonging
  for (let i = 0, length = probs.length; i < length; i++) {
    if (probs[i].length === 0) continue;
    let minIndex = 0;
    let placesAdded;
    do {
      let timeAllowance = allowance + TRAVEL_TIME_BUFFER; // Some extra buffer
      let travelTime = 0;
      let currentPlace = probs[i][0];
      let prevPlace = currentPlace;
      const possibleDay = [];
      placesAdded = 0;
      // Loop through each place and add to possible day if there is time remaining
      for (
        let placeIndex = minIndex, length = probs[i].length;
        placeIndex < length;
        placeIndex++
      ) {
        currentPlace = probs[i][placeIndex];
        if (visited[currentPlace.placeInfo.placeId]) continue;
        travelTime =
          distance(
            [
              prevPlace.placeInfo.location.longitude,
              prevPlace.placeInfo.location.latitude,
            ],
            [
              currentPlace.placeInfo.location.longitude,
              currentPlace.placeInfo.location.latitude,
            ],
          ) / TRAVEL_SPEED;
        if (
          timeAllowance >= currentPlace.userPlaceInfo.timeSpent + travelTime &&
          currentPlace.probability >= HIGH_PROB
        ) {
          possibleDay.push(probs[i][placeIndex]);
          if (placeIndex === minIndex + 1) minIndex = placeIndex; // Update minIndex so next loop starts slightly earlier
          placesAdded += 1;
          timeAllowance -= currentPlace.userPlaceInfo.timeSpent + travelTime;
          visited[currentPlace.placeInfo.placeId] = true;
        }
        prevPlace = currentPlace;
      }
      if (possibleDay.length) {
        output.push(possibleDay);
        resume.push({
          timeLeft: timeAllowance,
          gaussian: i,
        });
      }
    } while (placesAdded !== 0); // Stop when there is no more places being added
    gaussianIndex.push(minIndex);
  }

  // Second pass, we accept days that have a lower probability
  for (let j = 0; j < resume.length; j++) {
    const gaussian = resume[j].gaussian;
    let minIndex = gaussianIndex[gaussian];
    if (minIndex >= probs[gaussian].length) continue; // Go next iteration if minIndex exceeds range
    let timeAllowance = resume[j].timeLeft;
    let currentPlace = probs[gaussian][minIndex];
    let prevPlace = minIndex > 0 ? probs[gaussian][minIndex - 1] : currentPlace;
    let travelTime;

    for (
      let placeIndex = minIndex, length = probs[gaussian].length;
      placeIndex < length;
      placeIndex++
    ) {
      currentPlace = probs[gaussian][placeIndex];
      if (visited[currentPlace.placeInfo.placeId]) continue;
      travelTime =
        distance(
          [
            prevPlace.placeInfo.location.longitude,
            prevPlace.placeInfo.location.latitude,
          ],
          [
            currentPlace.placeInfo.location.longitude,
            currentPlace.placeInfo.location.latitude,
          ],
        ) / TRAVEL_SPEED;
      if (
        timeAllowance >= currentPlace.userPlaceInfo.timeSpent + travelTime &&
        currentPlace.probability >= LOW_PROB
      ) {
        output[j].push(probs[gaussian][placeIndex]);
        if (placeIndex === minIndex + 1) minIndex = placeIndex; // Update minIndex so next loop starts slightly earlier
        timeAllowance -= currentPlace.userPlaceInfo.timeSpent + travelTime;
        visited[currentPlace.placeInfo.placeId] = true;
      }
      prevPlace = currentPlace;
    }
  }

  output.sort((a, b) => b.length - a.length);

  // Get the list of days that are not in the final plan
  const unvisited = [];
  const rejected = output.slice(numDays);
  for (let i = 0, length = probs.length; i < length; i++) {
    for (let j = 0; j < probs[i].length; j++) {
      if (!visited[probs[i][j].placeInfo.placeId]) {
        unvisited.push(probs[i][j]);
      }
    }
  }
  for (let i = 0, length = rejected.length; i < length; i++) {
    for (let j = 0; j < rejected[i].length; j++) {
      unvisited.push(rejected[i][j]);
    }
  }

  return { days: output.slice(0, numDays), unvisited: unvisited };
};

const getDays = (data: {
  trip: {
    id: string;
    userId: string;
    startTime: string;
    endTime: string;
  };
  days: DayData[];
  places: PlaceDataEntry[];
}): {
  days: PlaceDataEntry[][];
  unvisited: PlaceDataEntry[];
} => {
  const nClusters =
    data.places.length / 3 > data.days.length
      ? data.days.length
      : Math.ceil(data.places.length / 3);
  // GMM does not work when cluster is 1
  if (nClusters <= 1) return { days: [data.places], unvisited: [] };
  const gmm = new GMM(nClusters, 72);

  const placesCoords = data.places.map((place) => [
    place.placeInfo.location.longitude,
    place.placeInfo.location.latitude,
  ]);
  gmm.cluster(placesCoords);

  const probs = gmm.predictProbs(placesCoords);
  const dayProbs: (PlaceDataEntry & { probability: number })[][] = Array.from(
    { length: data.days.length },
    () => [],
  );
  const allPlaces = data.places;

  // Get probability of places grouped by day instead
  for (let i = 0; i < probs.length; i++) {
    const place = allPlaces[i];
    for (let j = 0; j < probs[0].length; j++) {
      dayProbs[j].push({
        ...place,
        probability: probs[i][j],
      });
    }
  }
  // Sort each day according to probability
  for (let i = 0; i < dayProbs.length; i++) {
    dayProbs[i].sort((a, b) => b.probability - a.probability);
  }

  const startMins = digitStringToMins(data.trip.startTime);
  const endMins = digitStringToMins(data.trip.endTime);
  return getCandidateDays(dayProbs, endMins - startMins, data.days.length);
};

function prepareData(
  data: {
    trip: {
      id: string;
      userId: string;
      startTime: string;
      endTime: string;
    };
    inner: {
      dayId: number | null;
      dayOrder: string;
      dayStartTime: string | null;
      placeId: string | null;
      note: string | null;
      timeSpent: number | null;
      tripOrder: string;
    };
    place: InitialQuery["place"];
  }[],
) {
  const firstRow = data[0];
  const trip = {
    ...firstRow.trip,
  };
  const days: DayData[] = [];
  const places: PlaceDataEntry[] = [];

  for (let i = 0, length = data.length; i < length; i++) {
    const rowData = data[i];
    // Day with no place
    if (!rowData.place) {
      days.push({
        dayId: rowData.inner.dayId!,
        dayOrder: rowData.inner.dayOrder,
        dayStartTime: rowData.inner.dayStartTime!,
      });
    } else {
      // Place exists
      const tempPlaceData = {
        placeInfo: {
          placeId: rowData.inner.placeId!,
          displayName: rowData.place.displayName,
          primaryTypeDisplayName: rowData.place.primaryTypeDisplayName,
          typeColor: rowData.place.typeColor,
          location: rowData.place.location,
          viewport: rowData.place.viewport,
          coverImgSmall: rowData.place.coverImgSmall,
          rating: rowData.place.rating,
          googleMapsLink: rowData.place.googleMapsLink,
          openingHours: rowData.place.openingHours,
        },
        userPlaceInfo: {
          note: rowData.inner.note,
          timeSpent: rowData.inner.timeSpent!,
          tripOrder: rowData.inner.tripOrder,
        },
      };
      places.push(tempPlaceData);
      if (rowData.inner.dayId) {
        if (!days.some((day) => day.dayId === rowData.inner.dayId))
          days.push({
            dayId: rowData.inner.dayId,
            dayOrder: rowData.inner.dayOrder,
            dayStartTime: rowData.inner.dayStartTime!,
          });
      }
    }
  }

  return {
    trip,
    days,
    places,
  };
}

export async function generateItinerary(
  tripId: string,
): Promise<ApiResponse<{ days: DayData[]; places: PlaceData }>> {
  const session = await authenticate();
  if (!session) return { message: "Unauthorized", status: "error" };

  const inner = db.$with("inner").as(
    db
      .select({
        tripId:
          sql<string>`COALESCE(${tripDay.tripId}, ${tripPlace.tripId})`.as(
            "tripId",
          ),
        placeId: tripPlace.placeId,
        dayId: tripDay.id,
        note: tripPlace.note,
        type: tripPlace.type,
        timeSpent: tripPlace.timeSpent,
        tripOrder: sql<string>`${tripPlace.order}`.as("tripOrder"),
        dayOrder: sql<string>`${tripDay.order}`.as("dayOrder"),
        dayStartTime: tripDay.startTime,
      })
      .from(tripDay)
      .fullJoin(tripPlace, eq(tripPlace.dayId, tripDay.id))
      .where(
        and(
          or(isNull(tripPlace.type), eq(tripPlace.type, "saved")),
          or(eq(tripDay.tripId, tripId), eq(tripPlace.tripId, tripId)),
        ),
      ),
  );
  const rawData = await db
    .with(inner)
    .select({
      trip: {
        id: trip.id,
        userId: trip.userId,
        startTime: trip.startTime,
        endTime: trip.endTime,
      },
      inner: {
        placeId: inner.placeId,
        dayId: inner.dayId,
        note: inner.note,
        timeSpent: inner.timeSpent,
        tripOrder: inner.tripOrder,
        dayOrder: inner.dayOrder,
        dayStartTime: inner.dayStartTime,
      },
      place: {
        id: place.id,
        name: place.name,
        types: place.types,
        displayName: place.displayName,
        primaryTypeDisplayName: place.primaryTypeDisplayName,
        typeColor: place.typeColor,
        phone: place.phone,
        address: place.address,
        location: place.location,
        viewport: place.viewport,
        coverImg: place.coverImg,
        coverImgSmall: place.coverImgSmall,
        rating: place.rating,
        ratingCount: place.ratingCount,
        reviews: place.reviews,
        reviewHighlight: place.reviewHighlight,
        website: place.website,
        googleMapsLink: place.googleMapsLink,
        description: place.description,
        openingHours: place.openingHours,
        accessibilityOptions: place.accessibilityOptions,
        parkingOptions: place.parkingOptions,
        paymentOptions: place.paymentOptions,
        amenities: place.amenities,
        additionalInfo: place.additionalInfo,
      },
    })
    .from(trip)
    .innerJoin(inner, eq(inner.tripId, trip.id))
    .leftJoin(place, eq(inner.placeId, place.id))
    .where(eq(trip.id, tripId))
    .orderBy(asc(inner.dayOrder));
  const data = prepareData(rawData);

  if (data.trip.userId !== session.user.id)
    return { message: "Unauthorized", status: "error" };

  const { days: dayWithPlaces, unvisited } = getDays(data);
  for (let i = 0; i < dayWithPlaces.length; i++) {
    dayWithPlaces[i] = await TSP(dayWithPlaces[i]);
  }
  // If nClusters is 1, day is not truncated so we truncate here
  if (dayWithPlaces.length === 1) {
    let timeAllowance =
      digitStringToMins(data.trip.endTime) -
      digitStringToMins(data.trip.startTime) +
      TRAVEL_TIME_BUFFER;
    let currentPlace = dayWithPlaces[0][0];
    let prevPlace = currentPlace;
    let travelTime;
    let cutoffIndex = 0;
    for (
      let placeIndex = 0, length = dayWithPlaces[0].length;
      placeIndex < length;
      placeIndex++
    ) {
      currentPlace = dayWithPlaces[0][placeIndex];
      travelTime =
        distance(
          [
            prevPlace.placeInfo.location.longitude,
            prevPlace.placeInfo.location.latitude,
          ],
          [
            currentPlace.placeInfo.location.longitude,
            currentPlace.placeInfo.location.latitude,
          ],
        ) / TRAVEL_SPEED;
      if (timeAllowance >= currentPlace.userPlaceInfo.timeSpent + travelTime) {
        cutoffIndex = placeIndex + 1;
        timeAllowance -= currentPlace.userPlaceInfo.timeSpent + travelTime;
      } else {
        unvisited.push(currentPlace);
      }
      prevPlace = currentPlace;
    }
    dayWithPlaces[0] = dayWithPlaces[0].slice(0, cutoffIndex);
  }
  const placesToReturn: PlaceData = { saved: [] };

  // Update database
  const updateDayId: SQL[] = [];
  const updatePlaceOrderSQL: SQL[] = [];
  const ids: string[] = [];
  updateDayId.push(sql`(CASE`);
  updatePlaceOrderSQL.push(sql`(CASE`);
  for (let i = 0; i < dayWithPlaces.length; i++) {
    let order = getStartingIndex();
    placesToReturn[data.days[i].dayId] = [];
    for (let j = 0; j < dayWithPlaces[i].length; j++) {
      updateDayId.push(
        sql`WHEN ${tripPlace.placeId} = ${dayWithPlaces[i][j].placeInfo.placeId} THEN ${data.days[i].dayId}::integer`,
      );
      updatePlaceOrderSQL.push(
        sql`WHEN ${tripPlace.placeId} = ${dayWithPlaces[i][j].placeInfo.placeId} THEN ${order}`,
      );
      ids.push(dayWithPlaces[i][j].placeInfo.placeId);
      dayWithPlaces[i][j].userPlaceInfo.tripOrder = order; // We can mutate directly because this doesn't concern rendering logic
      placesToReturn[data.days[i].dayId].push(dayWithPlaces[i][j]);
      order = insertAfter(order);
    }
  }
  let order = getStartingIndex();
  for (let i = 0; i < unvisited.length; i++) {
    updateDayId.push(
      sql`WHEN ${tripPlace.placeId} = ${unvisited[i].placeInfo.placeId} THEN NULL`,
    );
    updatePlaceOrderSQL.push(
      sql`WHEN ${tripPlace.placeId} = ${unvisited[i].placeInfo.placeId} THEN ${order}`,
    );
    ids.push(unvisited[i].placeInfo.placeId);
    unvisited[i].userPlaceInfo.tripOrder = order;
    placesToReturn.saved.push(unvisited[i]);
    order = insertAfter(order);
  }
  updateDayId.push(sql`END)`);
  updatePlaceOrderSQL.push(sql`END)`);
  const finalUpdateDayIdSQL: SQL = sql.join(updateDayId, sql.raw(" "));
  const finalUpdatePlaceOrderSQL: SQL = sql.join(
    updatePlaceOrderSQL,
    sql.raw(" "),
  );
  // Make sure placesToReturn contains an empty array for empty days
  for (let i = 0; i < data.days.length; i++) {
    if (!placesToReturn[data.days[i].dayId])
      placesToReturn[data.days[i].dayId] = [];
  }

  try {
    await Promise.all([
      db
        .update(tripPlace)
        .set({ dayId: finalUpdateDayIdSQL, order: finalUpdatePlaceOrderSQL })
        .where(
          and(inArray(tripPlace.placeId, ids), eq(tripPlace.tripId, tripId)),
        ),
      db
        .update(tripDay)
        .set({ startTime: "auto" })
        .where(eq(tripDay.tripId, tripId)),
    ]);
    await refresh();
    return {
      status: "success",
      data: {
        days: data.days.map((day) => {
          day.dayStartTime = "auto";
          return day;
        }),
        places: placesToReturn,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      status: "error",
      message: "Unable to generate itinerary!",
    };
  }
}
