import { typeColorLookup } from "@/lib/color-lookups";
import { getCountry, safeJson } from "@/lib/utils";
import { auth } from "@/server/auth";
import { redis } from "@/server/cache";
import { db } from "@/server/db";
import { InsertTripPlace, place, tripPlace } from "@/server/db/schema";
import {
  ApiResponse,
  TripPlaceDetails,
  type GoogleError,
  type PlacesResult,
} from "@/server/types";
import { sql } from "drizzle-orm";
import { type NextRequest } from "next/server";
import getBingImage from "../get-bing-image";

type PlaceDiscoverResponse = PlacesResult | Record<never, never> | GoogleError;

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
        message: "Unauthorized",
      },
      {
        status: 401,
        headers: updateCookies,
      },
    );

  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get("location");
  const nextPageToken = searchParams.get("nextPageToken");
  const id = searchParams.get("id");
  const bounds = searchParams.getAll("bounds");

  if (!location || bounds.length !== 4 || !id) {
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
    Extract<
      ApiResponse<{ places: TripPlaceDetails[]; nextPageToken: string | null }>,
      { status: "success" }
    >
  >(location + bounds.toString() + nextPageToken);
  if (data) {
    const tripPlaceInsert: InsertTripPlace[] = [];
    for (let i = 0; i < data.data.places.length; i++) {
      tripPlaceInsert.push({
        placeId: data.data.places[i].id,
        tripId: id,
      });
    }
    // No need to insert places into db first as places alr exist if redis cache is hit
    // Insert places into trip place
    const returnedIds = await db
      .insert(tripPlace)
      .values(tripPlaceInsert)
      .onConflictDoNothing()
      .returning({ id: tripPlace.placeId });

    const newIds: string[] = [];
    for (let i = 0; i < returnedIds.length; i++) {
      newIds.push(returnedIds[i].id);
    }

    return Response.json(
      {
        data: {
          places: data.data.places.filter((place) => newIds.includes(place.id)),
          nextPageToken: data.data.nextPageToken,
        },
        status: "success",
      },
      { headers: updateCookies },
    );
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "X-Goog-FieldMask":
          "contextualContents.justifications.reviewJustification.highlightedText.text,places.id,places.name,nextPageToken,places.googleMapsUri,places.accessibilityOptions,places.shortFormattedAddress,places.formattedAddress,places.addressComponents,places.displayName,places.iconBackgroundColor,places.location,places.photos,places.primaryType,places.primaryTypeDisplayName,places.types,places.viewport,places.regularOpeningHours,places.userRatingCount,places.websiteUri,places.rating,places.internationalPhoneNumber,places.allowsDogs,places.editorialSummary,places.goodForChildren,places.goodForGroups,places.goodForWatchingSports,places.liveMusic,places.parkingOptions,places.paymentOptions,places.outdoorSeating,places.restroom,places.reviews",
        "X-Goog-Api-Key": process.env.GOOGLE_SECRET,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        textQuery: `Tourist attractions in ${location}`,
        includedType: "tourist_attraction",
        includePureServiceAreaBusinesses: false,
        pageSize: 10,
        pageToken: nextPageToken ?? undefined,
        locationRestriction: {
          rectangle: {
            low: {
              latitude: parseFloat(bounds[1]),
              longitude: parseFloat(bounds[0]),
            },
            high: {
              latitude: parseFloat(bounds[3]),
              longitude: parseFloat(bounds[2]),
            },
          },
        },
      }),
    },
  );
  const places = (await response.json()) as PlaceDiscoverResponse;

  if ("error" in places) {
    return Response.json(
      { message: places.error.message, status: "error" },
      { status: response.status, headers: updateCookies },
    );
  }

  if ("places" in places) {
    // Fetch cover images from Bing
    const imageQueries = [];
    for (let i = 0; i < places.places.length; i++) {
      const queryUrl = new URLSearchParams([
        ["q", `${places.places[i].displayName.text} ${location}`],
      ]);
      imageQueries.push(getBingImage(queryUrl.toString()));
    }
    const placeCoverImages = await Promise.all(imageQueries);

    const response: (TripPlaceDetails & { country: string })[] = [];
    const tripPlaceInsert: InsertTripPlace[] = [];

    for (let i = 0; i < places.places.length; i++) {
      const place = places.places[i];
      const placeCoverImage = placeCoverImages[i];
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
      response.push({
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
          places.contextualContents[i].justifications &&
          places.contextualContents[i].justifications![0].reviewJustification
            ? places.contextualContents[i].justifications![0]
                .reviewJustification!.highlightedText.text
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
      });

      tripPlaceInsert.push({
        placeId: place.id,
        tripId: id,
      });
    }

    //Ensure the place is inserted first and update the values
    await db
      .insert(place)
      .values(
        response.map((place) => ({
          ...place,
          photos: undefined,
        })),
      )
      .onConflictDoUpdate({
        target: place.id,
        set: {
          id: sql.raw(`excluded.${place.id.name}`),
          name: sql.raw(`excluded.${place.name.name}`),
          displayName: sql.raw(`excluded.${place.displayName.name}`),
          types: sql.raw(`excluded.${place.types.name}`),
          primaryTypeDisplayName: sql.raw(
            `excluded.${place.primaryTypeDisplayName.name}`,
          ),
          address: sql.raw(`excluded.${place.address.name}`),
          country: sql.raw(`excluded.${place.country.name}`),
          typeColor: sql.raw(`excluded.${place.typeColor.name}`),
          phone: sql.raw(`excluded.${place.phone.name}`),
          location: sql.raw(`excluded.${place.location.name}`),
          viewport: sql.raw(`excluded.${place.viewport.name}`),
          rating: sql.raw(`excluded.${place.rating.name}`),
          ratingCount: sql.raw(`excluded.${place.ratingCount.name}`),
          reviews: sql.raw(`excluded.${place.reviews.name}`),
          website: sql.raw(`excluded.${place.website.name}`),
          googleMapsLink: sql.raw(`excluded.${place.googleMapsLink.name}`),
          description: sql.raw(`excluded.${place.description.name}`),
          openingHours: sql.raw(`excluded.${place.openingHours.name}`),
          accessibilityOptions: sql.raw(
            `excluded.${place.accessibilityOptions.name}`,
          ),
          parkingOptions: sql.raw(`excluded.${place.parkingOptions.name}`),
          paymentOptions: sql.raw(`excluded.${place.paymentOptions.name}`),
          amenities: sql.raw(`excluded.${place.amenities.name}`),
          additionalInfo: sql.raw(`excluded.${place.additionalInfo.name}`),
        },
      });

    const [returnedIds] = await Promise.all([
      db
        .insert(tripPlace)
        .values(tripPlaceInsert)
        .onConflictDoNothing()
        .returning({ id: tripPlace.placeId }),
      redis.set(
        location + bounds.toString() + nextPageToken,
        {
          data: {
            places: response,
            nextPageToken: places.nextPageToken ?? null,
          },
          status: "success",
        },
        { ex: 1209600 },
      ),
    ]);

    const newIds: string[] = [];
    for (let i = 0; i < returnedIds.length; i++) {
      newIds.push(returnedIds[i].id);
    }

    return Response.json(
      {
        data: {
          places: response.filter((place) => newIds.includes(place.id)),
          nextPageToken: places.nextPageToken ?? null,
        },
        status: "success",
      },
      { headers: updateCookies },
    );
  }
  // No places returned
  return Response.json(
    {
      data: { places: [], nextPageToken: null },
      status: "success",
    },
    { headers: updateCookies },
  );
}
