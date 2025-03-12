import { db } from "@/server/db";
import { place } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import PlaceDetails from "../place-details";
import ViewMapToggle from "../view-map-toggle";
import FullPlaceDetailsImages from "./full-details-images";

export default async function FullPlaceDetailsPage({
  params,
}: {
  params: Promise<{ id: string; placeId: string }>;
}) {
  const ids = await params;

  const [data] = await db.select().from(place).where(eq(place.id, ids.placeId));

  return (
    <ViewMapToggle>
      <div className="space-y-4 pb-[72px] pt-4 sm:pb-4">
        <FullPlaceDetailsImages
          placeId={data.id}
          displayName={data.displayName}
        />
        <PlaceDetails data={data} />
      </div>
    </ViewMapToggle>
  );
}
