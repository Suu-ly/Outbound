import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { InsertLocation, location } from "@/server/db/schema";
import { BingImageResponse, type GoogleError } from "@/server/types";
import { eq } from "drizzle-orm";
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
  if (!process.env.GOOGLE_SECRET || !process.env.BING_SECRET) {
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
  const name = searchParams.get("name");
  const country = searchParams.get("country");

  if (!id || !session || !name) {
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

  // Check if location already exists in database
  const locationResult = await db
    .select({
      bounds: location.bounds,
      name: location.name,
    })
    .from(location)
    .where(eq(location.id, id))
    .limit(1);

  if (locationResult.length > 0)
    return Response.json({
      data: id,
      status: "success",
    });

  const nameURL = new URLSearchParams([
    ["q", `${name}${country ? " " + country : ""} visit`],
    ["safeSearch", "moderate"],
    ["imageType", "photo"],
    ["size", "large"],
    ["count", "5"],
  ]);

  const [bounds, images] = await Promise.all([
    fetch(
      `https://places.googleapis.com/v1/places/${id}?sessionToken=${session}`,
      {
        method: "GET",
        headers: {
          "X-Goog-FieldMask": "viewport,displayName,id",
          "X-Goog-Api-Key": process.env.GOOGLE_SECRET,
          Accept: "application/json",
        },
      },
    )
      .then((response) => response.json())
      .then((data) => data as BoundsResponse),
    fetch(
      `https://api.bing.microsoft.com/v7.0/images/search?${nameURL.toString()}`,
      {
        method: "GET",
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.BING_SECRET,
          Accept: "application/json",
        },
      },
    )
      .then((response) => response.json())
      .then((data: BingImageResponse) => {
        if (data._type === "ErrorResponse")
          return { error: data.errors, type: "error" };
        if (data.value.length === 0)
          // TODO return a better empty value, although this is unlikely to happen
          return {
            data: {
              image: "",
              thumbnail: "",
            },
            type: "success",
          };
        return {
          data: {
            image: data.value[0].contentUrl,
            thumbnail: data.value[0].thumbnailUrl,
          },
          type: "success",
        };
      }),
  ]);

  if ("error" in bounds) {
    return Response.json(
      { message: bounds.error.message, status: "error" },
      { status: 500 },
    );
  }

  if ("error" in images) {
    return Response.json(
      { message: images.error, status: "error" },
      { status: 500 },
    );
  }

  const insertValue: InsertLocation = {
    id: id,
    bounds: [
      [
        bounds.viewport.low.longitude.toString(),
        bounds.viewport.low.latitude.toString(),
      ],
      [
        bounds.viewport.high.longitude.toString(),
        bounds.viewport.high.latitude.toString(),
      ],
    ],
    name: bounds.displayName.text,
    coverImg: images.data.image,
    coverImgSmall: images.data.thumbnail,
    windowXStep: Math.ceil(
      bounds.viewport.high.longitude - bounds.viewport.low.longitude,
    ),
    windowYStep: Math.ceil(
      bounds.viewport.high.latitude - bounds.viewport.low.latitude,
    ),
  };
  // Insert information into database
  await db.insert(location).values(insertValue);

  return Response.json({
    data: id,
    status: "success",
  });
}
