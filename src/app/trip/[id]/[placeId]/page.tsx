import BackButton from "@/components/back-button";
import ButtonLink from "@/components/ui/button-link";
import { db } from "@/server/db";
import { place, tripPlace } from "@/server/db/schema";
import { and, eq, getTableColumns } from "drizzle-orm";
import PlaceDetails from "../place-details";
import ViewMapToggle from "../view-map-toggle";
import DetailsMarkerManager from "./details-marker-manager";
import FullPlaceDetailsImages from "./full-details-images";

export default async function FullPlaceDetailsPage({
  params,
}: {
  params: Promise<{ id: string; placeId: string }>;
}) {
  const ids = await params;

  const [data] = await db
    .select({
      place: { ...getTableColumns(place) },
      trip: {
        dayId: tripPlace.dayId,
        type: tripPlace.type,
      },
    })
    .from(place)
    .innerJoin(tripPlace, eq(tripPlace.placeId, place.id))
    .where(and(eq(place.id, ids.placeId), eq(tripPlace.tripId, ids.id)))
    .limit(1);

  if (!data.place)
    return (
      <main className="flex h-full items-center justify-center sm:w-1/2 xl:w-1/3">
        <div className="text-center">
          <h1 className="mb-3 font-display text-4xl font-semibold">
            Place Not Found!
          </h1>
          <h3 className="text-lg text-slate-700">
            It seems like we can&apos;t find the place you&apos;re looking for.
            The ID may be incorrect.
          </h3>
        </div>
        <ButtonLink href={`/trip/${ids.id}`} size="large">
          Back to trip
        </ButtonLink>
      </main>
    );
  // TODO: Maybe add some buttons to move to saved places or something
  return (
    <ViewMapToggle>
      <div className="space-y-4 pb-[72px] pt-4 sm:pb-4">
        <BackButton className="ml-2" />
        <DetailsMarkerManager data={data.place} trip={data.trip} />
        <FullPlaceDetailsImages
          placeId={data.place.id}
          displayName={data.place.displayName}
        />
        <PlaceDetails data={data.place} />
      </div>
    </ViewMapToggle>
  );
}
