import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { InsertPlace, place } from "@/server/db/schema";
import { type GoogleError } from "@/server/types";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";

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

type PlaceDiscoverResponse =
  | {
      places: {
        name: string;
        id: string;
        types: string[];
        internationalPhoneNumber?: string;
        location: {
          latitude: number;
          longitude: number;
        };
        viewport: {
          low: {
            latitude: number;
            longitude: number;
          };
          high: {
            latitude: number;
            longitude: number;
          };
        };
        rating: number;
        userRatingCount: number;
        googleMapsUri: string;
        websiteUri?: string;
        regularOpeningHours?: {
          openNow: boolean;
          periods: {
            open: {
              day: number;
              hour: number;
              minute: number;
            };
            close: {
              day: number;
              hour: number;
              minute: number;
            };
          }[];
          weekdayDescriptions: string[];
          nextOpenTime: string;
        };
        iconBackgroundColor: keyof typeof typeColorLookup;
        displayName: {
          text: string;
          languageCode: string;
        };
        primaryTypeDisplayName?: {
          text: string;
          languageCode: string;
        };
        primaryType?: string;
        shortFormattedAddress: string;
        editorialSummary?: {
          text: string;
          languageCode: string;
        };
        reviews?: {
          name: string;
          relativePublishTimeDescription: string;
          rating: number;
          text: {
            text: string;
            languageCode: string;
          };
          originalText: {
            text: string;
            languageCode: string;
          };
          authorAttribution: {
            displayName: string;
            uri: string;
            photoUri: string;
          };
          publishTime: string;
          flagContentUri: string;
          googleMapsUri: string;
        }[];
        photos?: {
          name: string;
          widthPx: number;
          heightPx: number;
          authorAttributions: [
            {
              displayName: string;
              uri: string;
              photoUri: string;
            },
          ];
          flagContentUri: string;
          googleMapsUri: string;
        }[];
        paymentOptions?: {
          acceptsCreditCards?: boolean;
          acceptsDebitCards?: boolean;
          acceptsCashOnly?: boolean;
          acceptsNfc?: boolean;
        };
        parkingOptions: {
          freeParkingLot?: boolean;
          paidParkingLot?: boolean;
          freeStreetParking?: boolean;
          paidStreetParking?: boolean;
          valetParking?: boolean;
          freeGarageParking?: boolean;
          paidGarageParking?: boolean;
        };
        accessibilityOptions: {
          wheelchairAccessibleParking?: boolean;
          wheelchairAccessibleEntrance?: boolean;
          wheelchairAccessibleRestroom?: boolean;
          wheelchairAccessibleSeating?: boolean;
        };
        outdoorSeating: boolean;
        liveMusic: boolean;
        goodForChildren: boolean;
        allowsDogs: boolean;
        restroom: boolean;
        goodForGroups: boolean;
        goodForWatchingSports: boolean;
      }[];
      contextualContents: {
        justifications: [
          {
            reviewJustification: {
              highlightedText: {
                text: string;
              };
            };
          },
          Record<never, never>,
        ];
      }[];
    }
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
  const location = searchParams.get("location");
  const nextPageToken = searchParams.get("nextPageToken");
  const bounds = searchParams.getAll("bounds");

  if ((!location && !nextPageToken) || bounds.length !== 4) {
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
          "contextualContents.justifications.reviewJustification.highlightedText.text,places.id,places.name,nextPageToken,places.googleMapsUri,places.accessibilityOptions,places.shortFormattedAddress,places.displayName,places.iconBackgroundColor,places.location,places.photos,places.primaryType,places.primaryTypeDisplayName,places.types,places.viewport,places.regularOpeningHours,places.userRatingCount,places.websiteUri,places.rating,places.internationalPhoneNumber,places.allowsDogs,places.editorialSummary,places.goodForChildren,places.goodForGroups,places.goodForWatchingSports,places.liveMusic,places.parkingOptions,places.paymentOptions,places.outdoorSeating,places.restroom,places.reviews",
        "X-Goog-Api-Key": process.env.GOOGLE_SECRET,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        textQuery: `Tourist attractions in ${location}`,
        includedType: "tourist_attraction",
        includePureServiceAreaBusinesses: false,
        locationRestriction: {
          rectangle: {
            low: {
              latitude: bounds[1],
              longitude: bounds[0],
            },
            high: {
              latitude: bounds[3],
              longitude: bounds[2],
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
    const response: InsertPlace[] = [];
    for (let i = 0; i < places.places.length; i++) {
      const place = places.places[i];
      response.push({
        id: place.id,
        name: place.name,
        displayName: place.displayName.text,
        types: place.types,
        primaryTypeDisplayName:
          place.primaryTypeDisplayName?.text ?? "Tourist Attraction",
        address: place.shortFormattedAddress,
        typeColor: typeColorLookup[place.iconBackgroundColor] || "#0891b2",
        phone: place.internationalPhoneNumber ?? null,
        location: place.location,
        viewport: place.viewport,
        rating: place.rating,
        ratingCount: place.userRatingCount,
        reviews: place.reviews,
        reviewHighlight:
          places.contextualContents[i].justifications[0].reviewJustification
            .highlightedText.text,
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
      });
    }

    await db.insert(place).values(response).onConflictDoNothing();

    return Response.json({ data: response, status: "success" });
  }
  return Response.json({ data: [], status: "success" });
}
