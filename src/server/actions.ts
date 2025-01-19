"use server";

import { headers } from "next/headers";
import { auth } from "./auth";

//TODO make a proper api instead of this
const verifyUser = async () => {
  const userSession = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch(() => {
      throw new Error("Unable to verify user status");
    });

  if (!userSession) throw new Error("Unauthorized");
};

export type ApiResponse<T> =
  | {
      data: T;
      status: "success";
    }
  | {
      status: "error";
      message: string;
    };

type GoogleError = {
  error: {
    code: number;
    message: string;
    status: string;
  };
};

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

export type AutocompleteReturn = {
  id: string;
  label: string;
  subtitle?: string;
}[];

export async function googleMapsAutocomplete(
  query: string,
  session: string,
): Promise<ApiResponse<AutocompleteReturn>> {
  if (!process.env.GOOGLE_SECRET) {
    throw new Error("Google API Key is not set");
  }
  verifyUser();

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
        includedPrimaryTypes: [
          "country",
          "administrative_area_level_1",
          "locality",
        ],
      }),
    },
  )
    .then((response) => response.json())
    .then((data) => data as AutocompleteResponse);

  if ("error" in suggestions) {
    return { message: suggestions.error.message, status: "error" };
  }

  if ("suggestions" in suggestions) {
    const response: AutocompleteReturn = [];
    for (let i = 0; i < suggestions.suggestions.length; i++) {
      const place = suggestions.suggestions[i].placePrediction;
      response.push({
        id: place.placeId,
        label: place.structuredFormat.mainText.text,
        subtitle: place.structuredFormat.secondaryText?.text,
      });
    }
    return { data: response, status: "success" };
  }
  return { data: [], status: "success" };
}

type BoundsResponse =
  | {
      id: string;
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
      displayName: {
        text: string;
        languageCode: string;
      };
    }
  | GoogleError;

export type BoundsReturn = {
  id: string;
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
  name: string;
};

export async function getGoogleMapsLocationBounds(
  id: string,
  session: string,
): Promise<ApiResponse<BoundsReturn>> {
  if (!process.env.GOOGLE_SECRET) {
    throw new Error("Google API Key is not set");
  }

  verifyUser();

  const bounds = await fetch(
    `https://places.googleapis.com/v1/places/${id}?sessionToken=${session}`,
    {
      method: "GET",
      headers: {
        "X-Goog-FieldMask": "viewport,displayName,id",
        "X-Goog-Api-Key": process.env.GOOGLE_SECRET,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  )
    .then((response) => response.json())
    .then((data) => data as BoundsResponse);

  if ("error" in bounds) {
    return { message: bounds.error.message, status: "error" };
  }
  return {
    data: {
      id: bounds.id,
      viewport: bounds.viewport,
      name: bounds.displayName.text,
    },
    status: "success",
  };
}
