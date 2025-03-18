import { typeColorLookup } from "@/lib/color-lookups";
import { auth } from "@/server/auth";
import { redis } from "@/server/cache";
import { db } from "@/server/db";
import { place as placeTable, tripPlace } from "@/server/db/schema";
import {
  ApiResponse,
  TripPlaceDetails,
  type GoogleError,
  type PlacesResult,
} from "@/server/types";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";
import getBingImage from "../get-bing-image";

type PlaceDetailsResponse =
  | Omit<PlacesResult, "nextPageToken">
  | Record<never, never>
  | GoogleError;

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_SECRET) {
    throw new Error("Google API Key is not set");
  }
  const userSession = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch(() => {
      throw new Error("Unable to verify user status");
    });

  if (!userSession)
    return Response.json(
      {
        status: "error",
        message: "Unauthorized",
      },
      {
        status: 403,
      },
    );

  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");
  const secondary = searchParams.get("secondary");
  const dayIdRaw = searchParams.get("dayId");
  const tripId = searchParams.get("tripId");
  const dayId = Number(dayIdRaw);
  if (!name || !secondary || !tripId || !dayIdRaw || Number.isNaN(dayIdRaw)) {
    return Response.json(
      {
        status: "error",
        message: "Missing query parameters",
      },
      {
        status: 400,
      },
    );
  }

  const data = await redis.get<
    Extract<ApiResponse<TripPlaceDetails>, { status: "success" }>
  >(name + secondary + "details");
  if (data) {
    // insert into tripPlaces
    const toInsert = {
      placeId: data.data.id,
      tripId: tripId,
      order: sql`insert_after(
                (SELECT MAX(${tripPlace.order}) from ${tripPlace} WHERE 
                ${tripPlace.tripId} = ${tripId} AND 
                ${tripPlace.dayId} = ${dayId} AND 
                ${tripPlace.type} = 'saved')
                )`,
      type: "saved" as const,
      dayId: dayId,
    };
    const order = await db
      .insert(tripPlace)
      .values(toInsert)
      .onConflictDoUpdate({
        target: [tripPlace.tripId, tripPlace.placeId],
        set: {
          order: sql`excluded.order`,
          type: sql`excluded.type`,
          dayId: sql`excluded.day_id`,
        },
        setWhere: sql`${tripPlace.type} != 'saved'`,
      })
      .returning({ order: tripPlace.order });

    if (order.length === 0)
      return Response.json({
        message: "Place already added",
        status: "error",
      });

    return Response.json({
      data: {
        place: data.data,
        order: order[0].order,
      },
      status: "success",
    });
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places:searchText`,
    {
      method: "POST",
      headers: {
        "X-Goog-FieldMask":
          "contextualContents.justifications.reviewJustification.highlightedText.text,places.id,places.name,places.googleMapsUri,places.accessibilityOptions,places.shortFormattedAddress,places.formattedAddress,places.displayName,places.iconBackgroundColor,places.location,places.photos,places.primaryType,places.primaryTypeDisplayName,places.types,places.viewport,places.regularOpeningHours,places.userRatingCount,places.websiteUri,places.rating,places.internationalPhoneNumber,places.allowsDogs,places.editorialSummary,places.goodForChildren,places.goodForGroups,places.goodForWatchingSports,places.liveMusic,places.parkingOptions,places.paymentOptions,places.outdoorSeating,places.restroom,places.reviews",
        "X-Goog-Api-Key": process.env.GOOGLE_SECRET,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        textQuery: `${name} ${secondary}`,
        includePureServiceAreaBusinesses: false,
        pageSize: 1,
      }),
    },
  );
  const places = (await response.json()) as PlaceDetailsResponse;

  if ("error" in places) {
    return Response.json(
      { message: places.error.message, status: "error" },
      { status: response.status },
    );
  }

  if ("places" in places) {
    const place = places.places[0];
    // Fetch cover images from Bing
    const queryUrl = new URLSearchParams([
      ["q", `${place.displayName.text} ${secondary}`],
    ]);

    const placeCoverImage = await getBingImage(queryUrl.toString());

    const images =
      placeCoverImage.status === "success"
        ? {
            coverImg: placeCoverImage.data.image,
            coverImgSmall: placeCoverImage.data.thumbnail,
          }
        : {
            coverImg: "",
            coverImgSmall: "",
          };
    const result = {
      id: place.id,
      name: place.name,
      displayName: place.displayName.text,
      types: place.types,
      primaryTypeDisplayName:
        place.primaryTypeDisplayName?.text ?? "Tourist Attraction",
      address: place.shortFormattedAddress ?? place.formattedAddress,
      typeColor: typeColorLookup[place.iconBackgroundColor] || "#0891b2",
      phone: place.internationalPhoneNumber ?? null,
      location: place.location,
      viewport: place.viewport,
      rating: place.rating ?? null,
      ratingCount: place.userRatingCount ?? null,
      reviews: place.reviews ?? null,
      reviewHighlight:
        places.contextualContents[0].justifications &&
        places.contextualContents[0].justifications![0].reviewJustification
          ? places.contextualContents[0].justifications![0].reviewJustification!
              .highlightedText.text
          : null,
      photos: place.photos ?? null,
      website: place.websiteUri ?? null,
      googleMapsLink: place.googleMapsUri,
      description: place.editorialSummary?.text ?? null,
      openingHours: place.regularOpeningHours
        ? {
            periods: place.regularOpeningHours.periods,
            text: place.regularOpeningHours.weekdayDescriptions,
          }
        : null,
      accessibilityOptions: place.accessibilityOptions ?? null,
      parkingOptions: place.parkingOptions ?? null,
      paymentOptions: place.paymentOptions ?? null,
      amenities:
        place.outdoorSeating || place.restroom
          ? {
              outdoorSeating: place.outdoorSeating,
              restroom: place.restroom,
            }
          : null,
      additionalInfo:
        place.allowsDogs ||
        place.goodForChildren ||
        place.goodForGroups ||
        place.goodForWatchingSports ||
        place.liveMusic
          ? {
              allowsDogs: place.allowsDogs,
              goodForChildren: place.goodForChildren,
              goodForGroups: place.goodForGroups,
              goodForWatchingSports: place.goodForWatchingSports,
              liveMusic: place.liveMusic,
            }
          : null,
      ...images,
    };

    const toInsert = {
      placeId: place.id,
      tripId: tripId,
      order: sql`insert_after(
                (SELECT MAX(${tripPlace.order}) from ${tripPlace} WHERE 
                ${tripPlace.tripId} = ${tripId} AND 
                ${tripPlace.dayId} = ${dayId} AND 
                ${tripPlace.type} = 'saved')
                )`,
      type: "saved" as const,
      dayId: dayId,
    };

    const placeInsert = { ...result, photos: undefined };

    //Ensure the place is inserted first
    await db.insert(placeTable).values(placeInsert).onConflictDoNothing();

    const [order] = await Promise.all([
      db
        .insert(tripPlace)
        .values(toInsert)
        .onConflictDoUpdate({
          target: [tripPlace.tripId, tripPlace.placeId],
          set: {
            order: sql`excluded.order`,
            type: sql`excluded.type`,
            dayId: sql`excluded.day_id`,
          },
          setWhere: sql`${tripPlace.type} != 'saved'`,
        })
        .returning({ order: tripPlace.order }),
      redis.set(
        name + secondary + "details",
        {
          data: result,
          status: "success",
        },
        { ex: 1209600 },
      ),
    ]);

    if (order.length === 0)
      return Response.json({
        message: "Place already added",
        status: "error",
      });

    return Response.json({
      data: { place: result, order: order[0].order },
      status: "success",
    });
  }
  // No places returned
  return Response.json(
    {
      message: "Unable to find place",
      status: "error",
    },
    {
      status: 404,
    },
  );
}
