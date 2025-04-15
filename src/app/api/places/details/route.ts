import { typeColorLookup } from "@/lib/color-lookups";
import { getCountry, safeJson } from "@/lib/utils";
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
      headers: request.headers,
      asResponse: true,
    })
    .catch(() => {
      throw new Error("Unable to verify user status");
    });
  const setCookies = userSession.headers.getSetCookie();
  const userSessionData = await safeJson(userSession);
  const updateCookies = new Headers();
  setCookies.forEach((cookie) => updateCookies.append("Set-Cookie", cookie));
  if (!userSessionData)
    return Response.json(
      {
        status: "error",
        message: "Unauthorised",
      },
      {
        status: 401,
        headers: updateCookies,
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
        headers: updateCookies,
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
          order: sql.raw(`excluded.${tripPlace.order.name}`),
          type: sql.raw(`excluded.${tripPlace.type.name}`),
          dayId: sql.raw(`excluded.${tripPlace.dayId.name}`),
        },
        setWhere: sql`${tripPlace.type} != 'saved'`,
      })
      .returning({ order: tripPlace.order });

    if (order.length === 0)
      return Response.json(
        {
          message: "Place already added",
          status: "error",
        },
        { headers: updateCookies, status: 400 },
      );

    return Response.json(
      {
        data: {
          place: data.data,
          order: order[0].order,
        },
        status: "success",
      },
      { headers: updateCookies },
    );
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places:searchText`,
    {
      method: "POST",
      headers: {
        "X-Goog-FieldMask":
          "contextualContents.justifications.reviewJustification.highlightedText.text,places.id,places.name,places.googleMapsUri,places.accessibilityOptions,places.shortFormattedAddress,places.formattedAddress,places.addressComponents,places.displayName,places.iconBackgroundColor,places.location,places.photos,places.primaryType,places.primaryTypeDisplayName,places.types,places.viewport,places.regularOpeningHours,places.userRatingCount,places.websiteUri,places.rating,places.internationalPhoneNumber,places.allowsDogs,places.editorialSummary,places.goodForChildren,places.goodForGroups,places.goodForWatchingSports,places.liveMusic,places.parkingOptions,places.paymentOptions,places.outdoorSeating,places.restroom,places.reviews",
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
      { status: response.status, headers: updateCookies },
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
      country: getCountry(place.addressComponents),
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

    //Ensure the place is inserted first and update the values
    await db
      .insert(placeTable)
      .values(placeInsert)
      .onConflictDoUpdate({
        target: placeTable.id,
        set: {
          id: sql.raw(`excluded.${placeTable.id.name}`),
          name: sql.raw(`excluded.${placeTable.name.name}`),
          displayName: sql.raw(`excluded.${placeTable.displayName.name}`),
          types: sql.raw(`excluded.${placeTable.types.name}`),
          primaryTypeDisplayName: sql.raw(
            `excluded.${placeTable.primaryTypeDisplayName.name}`,
          ),
          address: sql.raw(`excluded.${placeTable.address.name}`),
          country: sql.raw(`excluded.${placeTable.country.name}`),
          typeColor: sql.raw(`excluded.${placeTable.typeColor.name}`),
          phone: sql.raw(`excluded.${placeTable.phone.name}`),
          location: sql.raw(`excluded.${placeTable.location.name}`),
          viewport: sql.raw(`excluded.${placeTable.viewport.name}`),
          rating: sql.raw(`excluded.${placeTable.rating.name}`),
          ratingCount: sql.raw(`excluded.${placeTable.ratingCount.name}`),
          reviews: sql.raw(`excluded.${placeTable.reviews.name}`),
          website: sql.raw(`excluded.${placeTable.website.name}`),
          googleMapsLink: sql.raw(`excluded.${placeTable.googleMapsLink.name}`),
          description: sql.raw(`excluded.${placeTable.description.name}`),
          openingHours: sql.raw(`excluded.${placeTable.openingHours.name}`),
          accessibilityOptions: sql.raw(
            `excluded.${placeTable.accessibilityOptions.name}`,
          ),
          parkingOptions: sql.raw(`excluded.${placeTable.parkingOptions.name}`),
          paymentOptions: sql.raw(`excluded.${placeTable.paymentOptions.name}`),
          amenities: sql.raw(`excluded.${placeTable.amenities.name}`),
          additionalInfo: sql.raw(`excluded.${placeTable.additionalInfo.name}`),
        },
      });

    const [order] = await Promise.all([
      db
        .insert(tripPlace)
        .values(toInsert)
        .onConflictDoUpdate({
          target: [tripPlace.tripId, tripPlace.placeId],
          set: {
            order: sql.raw(`excluded.${tripPlace.order.name}`),
            type: sql.raw(`excluded.${tripPlace.type.name}`),
            dayId: sql.raw(`excluded.${tripPlace.dayId.name}`),
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
      return Response.json(
        {
          message: "Place already added",
          status: "error",
        },
        { headers: updateCookies, status: 400 },
      );

    return Response.json(
      {
        data: { place: result, order: order[0].order },
        status: "success",
      },
      { headers: updateCookies },
    );
  }
  // No places returned
  return Response.json(
    {
      message: "Unable to find place",
      status: "error",
    },
    {
      status: 404,
      headers: updateCookies,
    },
  );
}
