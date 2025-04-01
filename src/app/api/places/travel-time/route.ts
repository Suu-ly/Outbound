import { auth } from "@/server/auth";
import { redis } from "@/server/cache";
import { db } from "@/server/db";
import {
  SelectTripTravelTime,
  travelTime,
  tripTravelTime,
} from "@/server/db/schema";
import { DistanceType } from "@/server/types";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest } from "next/server";

type MapboxResponse =
  | {
      message: "Not Found";
    }
  | {
      message: "Not Authorized - Invalid Token";
    }
  | {
      message: "Not Authorized - Invalid Token";
      error_detail: "No valid token prefix found in access_token parameter";
    }
  | { message: "Forbidden" }
  | { message: string; code: "InvalidInput" }
  | {
      code: "NoSegment";
      message: string;
      routes: [];
    }
  | { code: "NoRoute"; message: string; routes: [] }
  | {
      routes: {
        waypoints: {
          distance: number;
          name: string;
          location: [number, number];
        }[];
        weight_name: "auto" | "bicycle" | "pedestrian";
        weight: number;
        duration: number; // Total duration in seconds
        distance: number; // Total distance in meters
        legs: {
          via_waypoints: {
            waypoint_index: number;
            distance_from_start: number;
            geometry_index: number;
          }[];
          admins: { iso_3166_1_alpha3: string; iso_3166_1: string }[];
          weight: number;
          steps: never[];
          duration: number; // Duration of this leg only in seconds
          distance: number; // Distance of this leg only in meters
          summary: string;
        }[];
        geometry: {
          coordinates: [number, number][];
          type: "LineString";
        };
      }[];
      code: "Ok";
      uuid: string;
    };

const getTravelTimesFromResponse = (
  data: Extract<MapboxResponse, { code: string }>,
): DistanceType => {
  if (
    data.code === "InvalidInput" ||
    data.code === "NoRoute" ||
    data.code === "NoSegment"
  )
    return { route: false };
  if (data.routes.length > 0) {
    const distance = data.routes[0].distance;
    return {
      route: true,
      geometry: data.routes[0].geometry,
      distance: distance / 1000,
      distanceDisplay:
        distance >= 1000
          ? (distance / 1000).toFixed(1) + " km"
          : Math.round(distance) + " m",
      duration: Math.round(data.routes[0].duration / 60), // Round to nearest minute
      summary:
        data.routes[0].legs.length > 0 && data.routes[0].legs[0].summary
          ? data.routes[0].legs[0].summary
          : null,
    };
  }
  return { route: false };
};

export async function GET(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    throw new Error("Mapbox token not set!");
  }
  const requestHeaders = await headers();
  const userSession = await auth.api
    .getSession({
      headers: requestHeaders,
      asResponse: true,
    })
    .catch(() => {
      throw new Error("Unable to verify user status");
    });

  const setCookies = userSession.headers.getSetCookie();
  const userSessionData = await userSession.json();
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
  const fromId = searchParams.get("fromId");
  const toId = searchParams.get("toId");
  const fromCoords = searchParams.get("fromCoords");
  const toCoords = searchParams.get("toCoords");
  const tripId = searchParams.get("tripId");
  const mode = searchParams.get("mode");

  if (!fromId || !toId || !fromCoords || !toCoords || !tripId) {
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

  const data = await redis.get<DistanceType>(`${fromCoords};${toCoords}`);
  if (data) {
    await db
      .insert(tripTravelTime)
      .values({
        from: fromId,
        to: toId,
        tripId: tripId,
        type: (mode as SelectTripTravelTime["type"]) ?? undefined,
      })
      .onConflictDoNothing();

    return Response.json(
      {
        data: data,
        status: "success",
      },
      { headers: updateCookies },
    );
  }

  const [driving, cycling, walking] = await Promise.all([
    fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoords};${toCoords}?geometries=geojson&exclude=ferry&waypoints_per_route=true&notifications=none&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          referer: requestHeaders.get("referer") || "",
        },
      },
    )
      .then((response) => response.json())
      .then((data) => data as MapboxResponse),
    fetch(
      `https://api.mapbox.com/directions/v5/mapbox/cycling/${fromCoords};${toCoords}?geometries=geojson&exclude=ferry&waypoints_per_route=true&notifications=none&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          referer: requestHeaders.get("referer") || "",
        },
      },
    )
      .then((response) => response.json())
      .then((data) => data as MapboxResponse),
    fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${fromCoords};${toCoords}?geometries=geojson&exclude=ferry&waypoints_per_route=true&notifications=none&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          referer: requestHeaders.get("referer") || "",
        },
      },
    )
      .then((response) => response.json())
      .then((data) => data as MapboxResponse),
  ]);

  if (!("code" in driving) || !("code" in cycling) || !("code" in walking))
    return Response.json(
      {
        message: "An unexpected error has occurred when fetching travel times",
        status: "error",
      },
      { headers: updateCookies },
    );

  const result = {
    drive: getTravelTimesFromResponse(driving),
    cycle: getTravelTimesFromResponse(cycling),
    walk: getTravelTimesFromResponse(walking),
  };

  // Ensure that the travel time is inserted
  try {
    await db
      .insert(travelTime)
      .values({ ...result, from: fromId, to: toId })
      .onConflictDoUpdate({
        target: [travelTime.to, travelTime.from],
        set: {
          drive: sql.raw(`excluded.${travelTime.drive.name}`),
          cycle: sql.raw(`excluded.${travelTime.cycle.name}`),
          walk: sql.raw(`excluded.${travelTime.walk.name}`),
        },
      });
  } catch {
    return Response.json(
      {
        message: "An error has occurred when fetching travel times",
        status: "error",
      },
      { headers: updateCookies },
    );
  }

  await Promise.all([
    db.insert(tripTravelTime).values({
      from: fromId,
      to: toId,
      tripId: tripId,
      type: (mode as SelectTripTravelTime["type"]) ?? undefined,
    }),
    redis.set(`${fromCoords};${toCoords}`, result, { ex: 2624016 }), // 1 month expiry
  ]);

  return Response.json(
    {
      data: result,
      status: "success",
    },
    { headers: updateCookies },
  );
}
