import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { location, trip } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MapLegendPanel } from "../map-view";
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
    title: { absolute: `Discover Places in ${name}` },
  };
}

export default async function TripSwipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tripId = (await params).id;
  const header = await headers();

  const [user, [tripUserId]] = await Promise.all([
    auth.api.getSession({
      headers: header,
      query: {
        // @ts-expect-error there's some kinda bug with better-auth
        disableRefresh: true,
      },
    }),
    db
      .select({ userId: trip.userId })
      .from(trip)
      .where(eq(trip.id, tripId))
      .limit(1),
  ]);

  if (!user || user.user.id !== tripUserId.userId) redirect(`/trip/${tripId}`);

  return (
    <>
      <div className="sm:hidden">
        <MapLegendPanel />
      </div>
      <DiscoverManager tripId={tripId} />
      <MissingImageManager />
      <SwipeManager tripId={tripId} />
    </>
  );
}
