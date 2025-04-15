import { redis } from "@/server/cache";
import { ApiResponse, type GoogleError } from "@/server/types";
import { type NextRequest } from "next/server";

type PlaceImageResponse =
  | {
      name: string;
      photoUri: string;
    }
  | GoogleError;

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_SECRET) {
    throw new Error("Google API Key is not set");
  }
  if (!process.env.NEXT_PUBLIC_URL) {
    throw new Error("URL is not set!");
  }
  const referer = request.headers.get("Referer");
  if (!referer?.startsWith(process.env.NEXT_PUBLIC_URL))
    return Response.json(
      {
        status: "error",
        message: "Unauthorised",
      },
      {
        status: 401,
      },
    );

  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (!name) {
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

  const data =
    await redis.get<Extract<ApiResponse<string>, { status: "success" }>>(name);

  if (data) return Response.json(data);

  const URLParams = new URLSearchParams([
    ["key", process.env.GOOGLE_SECRET],
    ["maxWidthPx", "854"],
    ["skipHttpRedirect", "true"],
  ]);

  const image = await fetch(
    `https://places.googleapis.com/v1/${name}/media?${URLParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  )
    .then((response) => response.json())
    .then((data) => data as PlaceImageResponse);

  if ("error" in image) {
    return Response.json(
      { message: image.error.message, status: "error" },
      { status: 500 },
    );
  }

  await redis.set(
    name,
    {
      data: image.photoUri,
      status: "success",
    },
    { ex: 1209600 }, // 14 days
  );

  return Response.json({
    data: image.photoUri,
    status: "success",
  });
}
