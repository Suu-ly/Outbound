import { auth } from "@/server/auth";
import { type GoogleError } from "@/server/types";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";

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
  const id = searchParams.get("id");
  const session = searchParams.get("session");

  if (!id || !session) {
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
    return Response.json(
      { message: bounds.error.message, status: "error" },
      { status: 500 },
    );
  }
  return Response.json({
    data: {
      id: bounds.id,
      viewport: [
        [bounds.viewport.low.longitude, bounds.viewport.low.latitude],
        [bounds.viewport.high.longitude, bounds.viewport.high.latitude],
      ],
      name: bounds.displayName.text,
    },
    status: "success",
  });
}
