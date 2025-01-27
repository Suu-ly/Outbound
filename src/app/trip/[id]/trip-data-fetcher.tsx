import { db } from "@/server/db";
import { location, trip, tripDay } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import TripProviders from "./trip-providers";

export default async function TripDataFetcher({
  id,
  children,
}: Readonly<{
  id: string;
  children: React.ReactNode;
}>) {
  const data = await db
    .select()
    .from(trip)
    .innerJoin(tripDay, eq(trip.id, tripDay.tripId))
    .innerJoin(location, eq(location.id, trip.locationId))
    .where(eq(trip.id, id));

  return <TripProviders data={data}>{children}</TripProviders>;
}
