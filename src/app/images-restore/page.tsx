import { db } from "@/server/db";
import { location, place, trip, tripPlace } from "@/server/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { Metadata } from "next";
import getGoogleImage from "../api/places/get-google-image";
import ImageGetter from "./image-getter";

export const metadata: Metadata = {
  title: "Update empty images",
};

export const revalidate = 3600;

export default async function ImageRestorePage() {
  const [places, placesNoLocation] = await Promise.all([
    db
      .select({
        location: location.name,
        name: place.displayName,
        id: place.id,
      })
      .from(tripPlace)
      .innerJoin(trip, eq(trip.id, tripPlace.tripId))
      .innerJoin(location, eq(location.id, trip.locationId))
      .innerJoin(place, eq(place.id, tripPlace.placeId))
      .where(eq(place.coverImgSmall, "")),
    db
      .select({
        name: place.displayName,
        id: place.id,
        location: place.country,
      })
      .from(place)
      .leftJoin(tripPlace, eq(tripPlace.placeId, place.id))
      .where(and(eq(place.coverImgSmall, ""), isNull(tripPlace.createdAt))),
  ]);

  const getGoogleImageFromServer = async (place: {
    location?: string;
    name: string;
  }) => {
    "use server";
    const queryUrl = new URLSearchParams([
      ["q", `${place.name}${place.location ? " " + place.location : ""}`],
    ]);
    const response = await getGoogleImage(queryUrl.toString());
    return response;
  };

  return (
    <ImageGetter
      places={places}
      placesNoLocation={placesNoLocation}
      fetch={getGoogleImageFromServer}
    />
  );
}
