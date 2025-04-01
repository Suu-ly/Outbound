import BackButton from "@/components/back-button";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { location, place, trip, tripPlace } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Metadata } from "next/types";
import ViewMapToggle from "../view-map-toggle";
import SkipPlaceSearch from "./skip-place-search";

export const metadata: Metadata = {
  title: "Skipped Places",
};

export default async function SkippedPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  const header = await headers();
  const [user, [tripUserId], skippedPlacesInitial] = await Promise.all([
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
      .where(eq(trip.id, id))
      .limit(1),
    db
      .select({
        placeId: place.id,
        name: place.name,
        displayName: place.displayName,
        primaryTypeDisplayName: place.primaryTypeDisplayName,
        typeColor: place.typeColor,
        location: place.location,
        viewport: place.viewport,
        coverImgSmall: place.coverImgSmall,
        rating: place.rating,
        googleMapsLink: place.googleMapsLink,
        openingHours: place.openingHours,
      })
      .from(trip)
      .innerJoin(tripPlace, eq(tripPlace.tripId, trip.id))
      .innerJoin(place, eq(tripPlace.placeId, place.id))
      .innerJoin(location, eq(trip.locationId, location.id))
      .where(and(eq(tripPlace.type, "skipped"), eq(trip.id, id)))
      .orderBy(desc(tripPlace.updatedAt)),
  ]);

  if (!user || user.user.id !== tripUserId.userId) redirect(`/trip/${id}`);

  return (
    <ViewMapToggle>
      <div className="space-y-4 p-4 xl:space-y-6">
        <BackButton className="-ml-2" />
        <h1 className="font-display text-2xl font-semibold xl:text-4xl">
          Skipped Places
        </h1>
        <SkipPlaceSearch
          skippedPlacesInitial={skippedPlacesInitial}
          tripId={id}
        />
      </div>
    </ViewMapToggle>
  );
}
