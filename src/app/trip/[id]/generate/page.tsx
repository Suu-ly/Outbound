import { db } from "@/server/db";
import { place, trip, tripDay, tripPlace } from "@/server/db/schema";
import { Coordinates } from "@/server/types";
import { and, asc, eq, or, sql } from "drizzle-orm";
import Wizard from "./wizard";

const processQuery = (
  data: {
    trip: {
      id: string;
      startTime: string;
      endTime: string;
    };
    inner: {
      dayId: number | null;
      timeSpent: number | null;
      dayStartTime: string | null;
    };
    place: {
      id: string;
      location: Coordinates;
    } | null;
  }[],
): {
  days: { id: number; startTime: string }[];
  places: { id: string; location: Coordinates; timeSpent: number }[];
  trip: { id: string; startTime: string; endTime: string } | null;
} => {
  if (data.length === 0) return { days: [], places: [], trip: null };
  const firstRow = data[0];
  const days = [];
  const addedDays: Record<string | number, boolean> = {};
  const places = [];
  const tripData = { ...firstRow.trip };

  for (let i = 0, length = data.length; i < length; i++) {
    const row = data[i];
    // Day with no place
    if (!row.place) {
      days.push({
        id: row.inner.dayId!,
        startTime: row.inner.dayStartTime!,
      });
      addedDays[row.inner.dayId!] = true;
    } else {
      places.push({
        location: row.place.location,
        id: row.place.id,
        timeSpent: row.inner.timeSpent!,
      });
      // Add day to array if not already inside
      if (row.inner.dayId && !addedDays[row.inner.dayId]) {
        days.push({
          id: row.inner.dayId,
          startTime: row.inner.dayStartTime!,
        });
        addedDays[row.inner.dayId] = true;
      }
    }
  }

  return { days: days, places: places, trip: tripData };
};

export default async function TripGenerate({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const id = (await params).id;
  const inner = db.$with("inner").as(
    db
      .select({
        tripId:
          sql<string>`COALESCE(${tripDay.tripId}, ${tripPlace.tripId})`.as(
            "tripId",
          ),
        placeId: tripPlace.placeId,
        dayId: tripDay.id,
        timeSpent: tripPlace.timeSpent,
        dayOrder: sql<string>`${tripDay.order}`.as("dayOrder"),
        dayStartTime: tripDay.startTime,
      })
      .from(tripDay)
      .fullJoin(tripPlace, eq(tripPlace.dayId, tripDay.id))
      .where(
        and(
          eq(tripPlace.type, "saved"),
          or(eq(tripDay.tripId, id), eq(tripPlace.tripId, id)),
        ),
      ),
  );
  const data = await db
    .with(inner)
    .select({
      trip: {
        id: trip.id,
        startTime: trip.startTime,
        endTime: trip.endTime,
      },
      inner: {
        dayId: inner.dayId,
        timeSpent: inner.timeSpent,
        dayStartTime: inner.dayStartTime,
      },
      place: {
        id: place.id,
        location: place.location,
      },
    })
    .from(trip)
    .innerJoin(inner, eq(inner.tripId, trip.id))
    .leftJoin(place, eq(inner.placeId, place.id))
    .where(eq(trip.id, id))
    .orderBy(asc(inner.dayOrder));

  const processed = processQuery(data);

  return <Wizard data={processed} />;
}
