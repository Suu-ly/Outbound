import BackButton from "@/components/back-button";
import { Input } from "@/components/ui/input";
import { db } from "@/server/db";
import { location, place, trip, tripPlace } from "@/server/db/schema";
import { IconSearch } from "@tabler/icons-react";
import { and, eq } from "drizzle-orm";
import PlaceDetailsSkipped from "../place-details-skipped";
import ViewMapToggle from "../view-map-toggle";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const skippedPlaces = await db
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
    .orderBy(tripPlace.createdAt);

  return (
    <ViewMapToggle>
      <div className="space-y-4 p-4 xl:space-y-6">
        <BackButton className="-ml-2" />
        <h1 className="font-display text-2xl font-semibold xl:text-4xl">
          Skipped Places
        </h1>
        <Input
          left={<IconSearch />}
          placeholder="Search for a skipped place..."
        />
        <div className="space-y-2">
          {skippedPlaces.map((place) => (
            <PlaceDetailsSkipped key={place.placeId} data={place} />
          ))}
        </div>
      </div>
    </ViewMapToggle>
  );
}
