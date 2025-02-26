import { auth } from "@/server/auth";
import { type AutocompleteReturn, type GoogleError } from "@/server/types";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";

type AutocompleteResponse =
  | {
      suggestions: {
        placePrediction: {
          placeId: string;
          structuredFormat: {
            mainText: {
              text: string;
            };
            secondaryText?: {
              text: string;
            };
          };
          types: string[];
        };
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
  const query = searchParams.get("query");
  const session = searchParams.get("session");
  const isTrip = searchParams.get("trip");
  const bias = searchParams.getAll("bias");

  if (!query || !session) {
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

  const suggestions = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "X-Goog-FieldMask":
          "suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text,suggestions.placePrediction.placeId,suggestions.placePrediction.types",
        "X-Goog-Api-Key": process.env.GOOGLE_SECRET,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        input: query,
        sessionToken: session,
        includedPrimaryTypes: isTrip
          ? [
              "food",
              "point_of_interest",
              "lodging",
              "establishment",
              "transit_station",
            ]
          : ["country", "administrative_area_level_1", "locality"],
        locationRestriction: bias
          ? {
              rectangle: {
                low: {
                  latitude: parseFloat(bias[1]),
                  longitude: parseFloat(bias[0]),
                },
                high: {
                  latitude: parseFloat(bias[3]),
                  longitude: parseFloat(bias[2]),
                },
              },
            }
          : undefined,
      }),
    },
  )
    .then((response) => response.json())
    .then((data) => data as AutocompleteResponse);

  if ("error" in suggestions) {
    return Response.json(
      { message: suggestions.error.message, status: "error" },
      { status: 500 },
    );
  }

  if ("suggestions" in suggestions) {
    const response: AutocompleteReturn[] = [];
    for (let i = 0; i < suggestions.suggestions.length; i++) {
      const place = suggestions.suggestions[i].placePrediction;
      response.push({
        id: place.placeId,
        label: place.structuredFormat.mainText.text,
        subtitle: place.structuredFormat.secondaryText?.text,
      });
    }
    return Response.json({ data: response, status: "success" });
  }
  return Response.json({ data: [], status: "success" });
}
