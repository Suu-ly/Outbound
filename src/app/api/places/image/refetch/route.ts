import { auth } from "@/server/auth";
import { redis } from "@/server/cache";
import { PlacesPhoto, type GoogleError } from "@/server/types";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";

type GooglePlaceDetailsImagesResponse =
  | { photos: PlacesPhoto[] }
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
  const placeId = searchParams.getAll("placeId");

  if (!placeId || placeId.length === 0) {
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

  const result: Record<string, PlacesPhoto[]> = {};

  const redisQueries = placeId.map((id) =>
    redis.get<PlacesPhoto[]>(id + " image"),
  );

  const redisData = await Promise.all(redisQueries);
  for (let i = 0, length = redisData.length; i < length; i++) {
    if (redisData[i] !== null) {
      result[placeId[i]] = redisData[i]!;
    }
  }

  const googleHeaders = new Headers({
    "X-Goog-FieldMask": "photos",
    "X-Goog-Api-Key": process.env.GOOGLE_SECRET,
    Accept: "application/json",
  });

  const queries = placeId.map((id) => {
    if (id in result) return;
    return fetch(`https://places.googleapis.com/v1/places/${id}`, {
      method: "GET",
      headers: googleHeaders,
    })
      .then((response) => response.json())
      .then((data) => ({
        id: id,
        data: data as GooglePlaceDetailsImagesResponse,
      }));
  });

  const imagesCollection = await Promise.all(queries);
  const redisSet = [];
  for (let i = 0, length = imagesCollection.length; i < length; i++) {
    const currentImages = imagesCollection[i];
    if (currentImages) {
      if ("error" in currentImages.data) {
        return []; // Just ignore the error and return nothing
      }
      if ("photos" in currentImages.data) {
        redisSet.push(
          redis.set(currentImages.id + " image", currentImages.data.photos, {
            ex: 259200,
          }),
        );
        result[currentImages.id] = currentImages.data.photos;
      }
    }
  }

  await Promise.all(redisSet);

  return Response.json({
    data: result,
    status: "success",
  });
}
