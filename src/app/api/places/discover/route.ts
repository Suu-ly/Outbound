import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { InsertTripPlace, place, tripPlace } from "@/server/db/schema";
import {
  TripPlaceDetails,
  type GoogleError,
  type PlacesResult,
} from "@/server/types";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";
import getBingImage from "../get-bing-image";

const typeColorLookup = {
  "#FF9E67": "#EA580C",
  "#4B96F3": "#2563eb",
  "#909CE1": "#7c3aed",
  "#13B5C7": "#0d9488",
  "#10BDFF": "#0284c7",
  "#7B9EB0": "#57534e",
  "#4DB546": "#059669",
  "#F88181": "#db2777",
};

type PlaceDiscoverResponse = PlacesResult | Record<never, never> | GoogleError;

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
      },
    );
  }

  const places = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "X-Goog-FieldMask":
          "contextualContents.justifications.reviewJustification.highlightedText.text,places.id,places.name,nextPageToken,places.googleMapsUri,places.accessibilityOptions,places.shortFormattedAddress,places.formattedAddress,places.displayName,places.iconBackgroundColor,places.location,places.photos,places.primaryType,places.primaryTypeDisplayName,places.types,places.viewport,places.regularOpeningHours,places.userRatingCount,places.websiteUri,places.rating,places.internationalPhoneNumber,places.allowsDogs,places.editorialSummary,places.goodForChildren,places.goodForGroups,places.goodForWatchingSports,places.liveMusic,places.parkingOptions,places.paymentOptions,places.outdoorSeating,places.restroom,places.reviews",
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
  )
    .then((response) => response.json())
    .then((data) => data as PlaceDiscoverResponse);

  if ("error" in places) {
    return Response.json(
      { message: places.error.message, status: "error" },
      { status: 500 },
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

    const response: TripPlaceDetails[] = [];
    const tripPlaceInsert: InsertTripPlace[] = [];

    for (let i = 0; i < places.places.length; i++) {
      const place = places.places[i];
      const placeCoverImage = placeCoverImages[i];
      const images = placeCoverImage.data
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
        typeColor: typeColorLookup[place.iconBackgroundColor] || "#0891b2",
        phone: place.internationalPhoneNumber ?? null,
        location: place.location,
        viewport: place.viewport,
        rating: place.rating,
        ratingCount: place.userRatingCount,
        reviews: place.reviews ?? null,
        reviewHighlight: places.contextualContents[i].justifications
          ? places.contextualContents[i].justifications![0].reviewJustification
              .highlightedText.text
          : null,
        photos: place.photos,
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
        allowsDogs: place.allowsDogs || null,
        goodForChildren: place.goodForChildren || null,
        goodForGroups: place.goodForGroups || null,
        goodForWatchingSports: place.goodForWatchingSports || null,
        liveMusic: place.liveMusic || null,
        outdoorSeating: place.outdoorSeating || null,
        restroom: place.restroom || null,
        ...images,
      });

      tripPlaceInsert.push({
        placeId: place.id,
        tripId: id,
      });
    }

    await db
      .insert(place)
      .values(
        response.map((place) => {
          delete place.photos;
          return place;
        }),
      )
      .onConflictDoNothing();
    await db.insert(tripPlace).values(tripPlaceInsert).onConflictDoNothing();

    return Response.json({
      data: { places: response, nextPageToken: places.nextPageToken ?? null },
      status: "success",
    });
  }
  return Response.json({
    data: { places: [], nextPageToken: null },
    status: "success",
  });
}
