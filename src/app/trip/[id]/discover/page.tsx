import { db } from "@/server/db";
import { location, trip } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import DiscoverManager from "./discover-manager";
import MissingImageManager from "./missing-image-manager";
import SwipeManager from "./swipe-manager";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const tripId = (await params).id;
  const [{ name }] = await db
    .select({ name: location.name })
    .from(trip)
    .innerJoin(location, eq(location.id, trip.locationId))
    .where(eq(trip.id, tripId))
    .limit(1);

  return {
    title: `Discover Places in ${name}`,
  };
}

export default async function TripSwipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const realData = process.env.NEXT_PUBLIC_USE_REAL_DATA === "true";
  const tripId = (await params).id;
  return (
    <>
      {realData && <DiscoverManager tripId={tripId} />}
      <MissingImageManager />
      <SwipeManager tripId={tripId} />
    </>
  );
}
