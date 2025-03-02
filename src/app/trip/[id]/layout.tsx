import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ButtonLink from "@/components/ui/button-link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { location, place, trip, tripDay, tripPlace } from "@/server/db/schema";
import {
  DayData,
  InitialQuery,
  InitialQueryPrepared,
  PlaceData,
  TripPlaceDetails,
} from "@/server/types";
import { and, asc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import MapView from "./map-view";
import TripHeaderItems from "./trip-header-items";
import TripProviders from "./trip-providers";

function prepareData(data: InitialQuery[]): InitialQueryPrepared {
  const firstRow = data[0];
  const tripData = {
    ...firstRow.trip,
    viewport: firstRow.location.viewport,
    coverImg: firstRow.location.coverImg,
  };
  const windowData = {
    name: firstRow.location.name,
    windows: firstRow.location.windows,
    currentSearchIndex: firstRow.trip.currentSearchIndex,
    nextPageToken: firstRow.trip.nextPageToken,
  };
  const dayData: DayData[] = [];
  const discoverData: TripPlaceDetails[] = [];
  const placeData: PlaceData = { saved: [] };

  for (let i = 0, length = data.length; i < length; i++) {
    const rowData = data[i];
    // Day with no place
    if (!rowData.place) {
      dayData.push({
        dayId: rowData.inner.dayId!,
        dayOrder: rowData.inner.dayOrder,
        dayStartTime: rowData.inner.dayStartTime!,
      });
      placeData[rowData.inner.dayId!] = [];
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
      // Unplanned place
      if (!rowData.inner.dayId && rowData.inner.type === "saved")
        placeData.saved.push(tempPlaceData);
      // Day
      else if (rowData.inner.dayId) {
        if (!dayData.some((day) => day.dayId === rowData.inner.dayId))
          dayData.push({
            dayId: rowData.inner.dayId,
            dayOrder: rowData.inner.dayOrder,
            dayStartTime: rowData.inner.dayStartTime!,
          });
        // Day with place
        if (rowData.inner.dayId in placeData)
          placeData[rowData.inner.dayId].push(tempPlaceData);
        else placeData[rowData.inner.dayId] = [tempPlaceData];
        // Undecided place
      } else if (rowData.inner.type === "undecided") {
        discoverData.push(rowData.place);
      }
    }
  }

  return { tripData, windowData, dayData, discoverData, placeData };
}

export default async function TripLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}>) {
  const id = (await params).id;
  const header = await headers();

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
        tripPlaceCreated: tripPlace.createdAt,
        dayStartTime: tripDay.startTime,
      })
      .from(tripDay)
      .fullJoin(tripPlace, eq(tripPlace.dayId, tripDay.id)),
  );

  const [userSession, data] = await Promise.all([
    auth.api.getSession({
      headers: header,
    }),
    db
      .with(inner)
      .select({
        trip: {
          id: trip.id,
          name: trip.name,
          userId: trip.userId,
          startDate: trip.startDate,
          endDate: trip.endDate,
          private: trip.private,
          roundUpTime: trip.roundUpTime,
          currentSearchIndex: trip.currentSearchIndex,
          nextPageToken: trip.nextPageToken,
          startTime: trip.startTime,
          endTime: trip.endTime,
        },
        inner: {
          placeId: inner.placeId,
          dayId: inner.dayId,
          note: inner.note,
          timeSpent: inner.timeSpent,
          type: inner.type,
          tripOrder: inner.tripOrder,
          dayOrder: inner.dayOrder,
          dayStartTime: inner.dayStartTime,
        },
        location: {
          name: location.name,
          coverImg: location.coverImg,
          viewport: location.viewport,
          windows: location.windows,
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
      .innerJoin(location, eq(trip.locationId, location.id))
      .where(
        and(or(isNull(inner.type), ne(inner.type, "skipped")), eq(trip.id, id)),
      )
      .orderBy(
        asc(inner.dayOrder),
        asc(inner.tripOrder),
        asc(inner.dayStartTime),
      ),
  ]);

  if (data.length === 0)
    return (
      <div className="flex min-h-dvh flex-col">
        <Header>
          <Avatar>
            <AvatarImage
              src={
                userSession && userSession.user.image
                  ? userSession.user.image
                  : undefined
              }
            />
            <AvatarFallback>
              {userSession
                ? userSession.user.name.substring(0, 2).toUpperCase()
                : "NA"}
            </AvatarFallback>
          </Avatar>
        </Header>
        <main className="mx-auto flex w-full max-w-screen-sm grow flex-col items-center justify-center gap-12 p-4">
          <div className="text-center">
            <h1 className="mb-3 font-display text-4xl font-semibold">
              Trip Not Found!
            </h1>
            <h3 className="text-lg text-slate-700">
              We can&apos;t seem to find the trip that you&apos;re looking for.
              The trip id may be incorrect or the trip may have been deleted.
            </h3>
          </div>
          <ButtonLink href="/" size="large">
            Back to Home
          </ButtonLink>
        </main>
      </div>
    );

  const preparedData = prepareData(data);

  return (
    <TripProviders data={preparedData} session={userSession}>
      <Header>
        <TripHeaderItems />
      </Header>
      <div className="relative flex h-[calc(100dvh-56px)] overflow-hidden">
        {children}
        <MapView initialBounds={preparedData.tripData.viewport} />
      </div>
    </TripProviders>
  );
}
