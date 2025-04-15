import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ButtonLink from "@/components/ui/button-link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  location,
  place,
  travelTime,
  trip,
  tripDay,
  tripPlace,
  tripTravelTime,
} from "@/server/db/schema";
import {
  DayData,
  InitialQuery,
  InitialQueryPrepared,
  PlaceData,
  TravelTimeGraphType,
  TripPlaceDetails,
} from "@/server/types";
import { and, asc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import MapView from "./map-view";
import { TripPageDialogs } from "./trip-dialogs";
import TripHeaderItems from "./trip-header-items";
import TripProviders from "./trip-providers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const tripId = (await params).id;
  const result = await db
    .select({ name: trip.name })
    .from(trip)
    .where(eq(trip.id, tripId))
    .limit(1);

  if (result.length === 0)
    return {
      title: "Trip not found!",
    };

  return {
    title: { default: result[0].name, template: `%s - ${result[0].name}` },
  };
}

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
  const travelTimeData: TravelTimeGraphType = {};

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
      if (rowData.travelTime.drive) {
        const travelTimes = {
          drive: rowData.travelTime.drive!,
          cycle: rowData.travelTime.cycle!,
          walk: rowData.travelTime.walk!,
          mode: rowData.travelTime.selectedMode ?? undefined,
        };
        travelTimeData[rowData.inner.placeId!] = {
          [rowData.travelTime.nextId!]: travelTimes,
        };
      }
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

  return {
    tripData,
    windowData,
    dayData,
    discoverData,
    placeData,
    travelTimeData,
  };
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
        tripPlaceUpdated: tripPlace.updatedAt,
        dayStartTime: tripDay.startTime,
        nextId:
          sql<string>`CASE WHEN ${tripDay.id} = LEAD(${tripDay.id}) OVER (PARTITION BY ${tripDay.id} ORDER BY ${tripDay.order}, ${tripPlace.order}) 
                    THEN LEAD(${tripPlace.placeId}) OVER (PARTITION BY ${tripDay.id} ORDER BY ${tripDay.order}, ${tripPlace.order}) 
                    END`.as("next_id"),
      })
      .from(tripDay)
      .fullJoin(tripPlace, eq(tripPlace.dayId, tripDay.id))
      .where(
        and(
          or(isNull(tripPlace.type), ne(tripPlace.type, "skipped")),
          or(eq(tripDay.tripId, id), eq(tripPlace.tripId, id)),
        ),
      ),
  );

  const [userSession, data] = await Promise.all([
    auth.api.getSession({
      headers: header,
      query: {
        disableRefresh: true,
      },
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
        travelTime: {
          nextId: inner.nextId,
          drive: travelTime.drive,
          cycle: travelTime.cycle,
          walk: travelTime.walk,
          selectedMode: tripTravelTime.type,
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
      .leftJoin(
        travelTime,
        and(
          eq(travelTime.from, inner.placeId),
          eq(travelTime.to, inner.nextId),
        ),
      )
      .leftJoin(
        tripTravelTime,
        and(
          eq(tripTravelTime.from, travelTime.from),
          eq(tripTravelTime.to, travelTime.to),
          eq(tripTravelTime.tripId, trip.id),
        ),
      )
      .where(eq(trip.id, id))
      .orderBy(asc(inner.dayOrder), asc(inner.tripOrder)),
  ]);

  if (data.length === 0)
    return (
      <div className="flex min-h-dvh flex-col">
        <Header>
          {userSession ? (
            <Link
              href="/account"
              className="rounded-full ring-slate-400 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Avatar>
                <AvatarImage src={userSession.user.image ?? undefined} />
                <AvatarFallback>
                  {userSession.user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <ButtonLink
              href={
                "/login?" +
                new URLSearchParams([["redirect", `/trip/${id}`]]).toString()
              }
              size="small"
              prefetch={false}
            >
              Login
            </ButtonLink>
          )}
        </Header>
        <main className="mx-auto flex w-full max-w-screen-sm grow flex-col items-center justify-center gap-4 p-4">
          <h1 className="mt-4 text-center font-display text-5xl font-semibold text-slate-900 sm:text-7xl">
            Trip Not Found!
          </h1>
          <h3 className="text-center text-lg font-medium text-gray-500 sm:text-xl">
            We can&apos;t seem to find the trip that you&apos;re looking for.
            The trip id may be incorrect or the trip may have been deleted.
          </h3>
          <ButtonLink href="/" size="large" className="mt-8">
            Back to Home
          </ButtonLink>
        </main>
      </div>
    );

  if (data[0].trip.userId !== userSession?.user.id && data[0].trip.private) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header>
          {userSession ? (
            <Avatar>
              <AvatarImage src={userSession.user.image ?? undefined} />
              <AvatarFallback>
                {userSession
                  ? userSession.user.name.substring(0, 2).toUpperCase()
                  : "NA"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <ButtonLink
              href={
                "/login?" +
                new URLSearchParams([["redirect", `/trip/${id}`]]).toString()
              }
              size="small"
              prefetch={false}
            >
              Login
            </ButtonLink>
          )}
        </Header>
        <main className="mx-auto flex w-full max-w-screen-sm grow flex-col items-center justify-center gap-4 p-4">
          <h1 className="mt-4 text-center font-display text-5xl font-semibold text-slate-900 sm:text-7xl">
            No access to trip
          </h1>
          <h3 className="text-center text-lg font-medium text-gray-500 sm:text-xl">
            It seems like this trip has been set to private. The owner of the
            trip has to set the trip to public before you are able to view it.
          </h3>
          <ButtonLink href="/" size="large" className="mt-8">
            Back to Home
          </ButtonLink>
        </main>
      </div>
    );
  }

  const preparedData = prepareData(data);

  return (
    <TripProviders data={preparedData} session={userSession}>
      <Header fixed>
        <TripHeaderItems loggedIn={!!userSession} />
      </Header>
      <TripPageDialogs />
      <div className="relative mt-14 flex h-[calc(100dvh-56px)] overflow-hidden">
        {children}
        <MapView initialBounds={preparedData.tripData.viewport} />
      </div>
    </TripProviders>
  );
}
