import { minsToString } from "@/lib/utils";
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
    return {
      route: true,
      geometry: data.routes[0].geometry,
      distance: data.routes[0].distance / 1000,
      distanceDisplay:
        data.routes[0].distance >= 1000
          ? (data.routes[0].distance / 1000).toFixed(1) + " km"
          : Math.round(data.routes[0].distance) + " m",
      duration: Math.round((data.routes[0].duration / 60) * 1000) / 1000, // Round to 3dp
      durationDisplay: minsToString(data.routes[0].duration / 60),
      durationDisplayRoundUp: minsToString(data.routes[0].duration / 60, true),
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

    return Response.json({
      data: data,
      status: "success",
    });
  }

  const [driving, cycling, walking] = await Promise.all([
    fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${fromCoords};${toCoords}?geometries=geojson&waypoints_per_route=true&notifications=none&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
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
      `https://api.mapbox.com/directions/v5/mapbox/cycling/${fromCoords};${toCoords}?geometries=geojson&waypoints_per_route=true&notifications=none&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
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
      `https://api.mapbox.com/directions/v5/mapbox/walking/${fromCoords};${toCoords}?geometries=geojson&waypoints_per_route=true&notifications=none&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
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
    return Response.json({
      message: "An unexpected error has occurred when fetching travel times",
      status: "error",
    });

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
          drive: sql`excluded.drive`,
          cycle: sql`excluded.cycle`,
          walk: sql`excluded.walk`,
        },
      });
  } catch {
    return Response.json({
      message: "An error has occurred when fetching travel times",
      status: "error",
    });
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

  return Response.json({
    data: result,
    status: "success",
  });
}
