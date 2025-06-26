import { safeJson } from "@/lib/utils";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { InsertLocation, location } from "@/server/db/schema";
import {
  BoundingBox,
  NominatimResponse,
  type GoogleError,
} from "@/server/types";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";
import getGoogleImage from "../get-google-image";

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
      addressComponents: {
        longText: string;
        shortText: string;
        types: string[];
        languageCode: string;
      }[];
    }
  | GoogleError;

const getPlaceName = (
  name: string,
  subtitle: string | null,
  components: {
    longText: string;
    shortText: string;
    types: string[];
    languageCode: string;
  }[],
) => {
  if (!subtitle) return name;
  let country = "",
    city = "";
  for (let i = components.length - 1; i >= 0 || (!city && !country); i--) {
    // if (components[i].types.includes("postal_code"))
    //   return components[i].longText;
    if (!country && components[i].types.includes("country"))
      country = components[i].longText;
    if (!city && components[i].types.includes("administrative_area_level_1"))
      city = components[i].longText;
  }
  if (city && city !== name)
    return name + ", " + city.replace(/(State of|Province|department)/gi, "");
  return name + ", " + country;
};

// Visualise https://www.desmos.com/calculator/ldhs15ostc
const getNumWindows = (high: number, low: number) => {
  return Math.ceil(1.5 * Math.log2(high - low + 1) + 0.5);
};

const polygonIntersects = (
  box: BoundingBox,
  polygon: [number, number][],
  gradients: number[],
) => {
  // For loop counts down so it's easier to check the middle point first
  for (let corner = 4; corner >= 0; corner--) {
    let count = 0;
    let point;
    if (corner < 4)
      point = [box[Math.floor(corner / 2)][0], box[corner % 2][1]];
    // Check middle point
    else point = [(box[0][0] + box[1][0]) / 2, (box[0][1] + box[1][1]) / 2];
    for (let i = 0; i < polygon.length - 1; i++) {
      const y1 = polygon[i][1];
      const y2 = polygon[i + 1][1];
      const x1 = polygon[i][0];
      if (
        point[1] < y1 !== point[1] < y2 &&
        point[0] < x1 + (point[1] - y1) * gradients[i]
      )
        count += 1;
    }
    if (count % 2 === 1) return true;
  }
  return false;
};

const getSearchWindows = (
  geojson: NominatimResponse[number]["geojson"],
): BoundingBox[] => {
  if (geojson.type === "Point")
    return [
      [
        [geojson.coordinates[0] - 0.1, geojson.coordinates[1] - 0.1],
        [geojson.coordinates[0] + 0.1, geojson.coordinates[1] + 0.1],
      ],
    ];
  const windows: BoundingBox[] = [];
  // Check all polygons
  let currentPolygon: [number, number][];
  for (let i = 0; i < geojson.coordinates.length; i++) {
    if (geojson.type === "Polygon") currentPolygon = geojson.coordinates[0];
    else currentPolygon = geojson.coordinates[i][0];
    let minLon = currentPolygon[0][0];
    let maxLon = currentPolygon[0][0];
    let minLat = currentPolygon[0][1];
    let maxLat = currentPolygon[0][1];
    const memoizeGradients: number[] = new Array(currentPolygon.length - 1);
    memoizeGradients[0] =
      (currentPolygon[1][0] - currentPolygon[0][0]) /
      (currentPolygon[1][1] - currentPolygon[0][1]);
    // Get bounding box of polygon and gradient reciprocal of edges
    for (let j = 1; j < currentPolygon.length - 1; j++) {
      const currentPoint = currentPolygon[j];
      if (minLon > currentPoint[0]) minLon = currentPoint[0];
      if (maxLon < currentPoint[0]) maxLon = currentPoint[0];
      if (minLat > currentPoint[1]) minLat = currentPoint[1];
      if (maxLat < currentPoint[1]) maxLat = currentPoint[1];

      memoizeGradients[j] =
        (currentPolygon[j + 1][0] - currentPoint[0]) /
        (currentPolygon[j + 1][1] - currentPoint[1]);
    }
    const yWindow = getNumWindows(maxLat, minLat);
    const xWindow = getNumWindows(maxLon, minLon);
    const yStep = (maxLat - minLat) / yWindow;
    const xStep = (maxLon - minLon) / xWindow;
    // Only store search window if it intersects with polygon
    for (let i = 0; i < yWindow * xWindow; i++) {
      const xIndex = i % xWindow;
      const yIndex = Math.floor(i / xWindow);
      const box: BoundingBox = [
        [minLon + xIndex * xStep, minLat + yIndex * yStep],
        [minLon + (xIndex + 1) * xStep, minLat + (yIndex + 1) * yStep],
      ];
      if (
        xWindow * yWindow < 3 ||
        polygonIntersects(box, currentPolygon, memoizeGradients)
      ) {
        windows.push(box);
      }
    }
  }
  return windows;
};

const getViewport = (viewport: {
  low: {
    latitude: number;
    longitude: number;
  };
  high: {
    latitude: number;
    longitude: number;
  };
}): BoundingBox => {
  let high = viewport.high.longitude;
  // Viewport crosses the antimeridian
  if (viewport.high.longitude < viewport.low.longitude) {
    high += 360;
  }
  return [
    [viewport.low.longitude, viewport.low.latitude],
    [high, viewport.high.latitude],
  ];
};

export async function GET(request: NextRequest) {
  if (!process.env.GOOGLE_SECRET) {
    throw new Error("Google API Key is not set");
  }
  const requestHeaders = request.headers;
  const userSession = await auth.api
    .getSession({
      headers: requestHeaders,
      asResponse: true,
    })
    .catch(() => {
      throw new Error("Unable to verify user status");
    });

  const setCookies = userSession.headers.getSetCookie();
  const userSessionData = await safeJson(userSession);
  const updateCookies = new Headers();
  setCookies.forEach((cookie) => updateCookies.append("Set-Cookie", cookie));
  if (!userSessionData)
    return Response.json(
      {
        status: "error",
        message: "Unauthorised",
      },
      {
        status: 401,
        headers: updateCookies,
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
        headers: updateCookies,
      },
    );
  }

  // Check if location already exists in database
  const locationResult = await db
    .select({
      name: location.name,
    })
    .from(location)
    .where(eq(location.id, id))
    .limit(1);

  if (locationResult.length > 0)
    return Response.json({
      data: {
        id: id,
        label: name,
        subtitle: country,
      },
      status: "success",
    });

  const queryUrl = new URLSearchParams([
    ["q", `${name}${country ? " " + country : ""} scenic`],
  ]);

  const [bounds, images] = await Promise.all([
    fetch(
      `https://places.googleapis.com/v1/places/${id}?sessionToken=${session}`,
      {
        method: "GET",
        headers: {
          "X-Goog-FieldMask": "viewport,displayName,id,addressComponents",
          "X-Goog-Api-Key": process.env.GOOGLE_SECRET,
          Accept: "application/json",
        },
      },
    )
      .then((response) => response.json())
      .then((data) => data as BoundsResponse),
    getGoogleImage(queryUrl.toString(), [420, 320]),
  ]);

  if ("error" in bounds) {
    return Response.json(
      { message: bounds.error.message, status: "error" },
      { status: 500, headers: updateCookies },
    );
  }

  if (images.status === "error") {
    return Response.json(
      { message: images.message, status: "error" },
      { status: 500, headers: updateCookies },
    );
  }

  const boundsQueryUrl = new URLSearchParams([
    ["q", `${getPlaceName(name, country, bounds.addressComponents)}`],
    ["polygon_threshold", "0.05"],
    ["polygon_geojson", "1"],
    ["format", "json"],
    ["limit", "1"],
  ]);

  const polygon = await fetch(
    `https://nominatim.openstreetmap.org/search.php?${boundsQueryUrl.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "user-agent": requestHeaders.get("user-agent") || "",
        referer: requestHeaders.get("referer") || "",
      },
    },
  )
    .then((response) => response.json() as Promise<NominatimResponse>)
    .then((data) => data[0].geojson);
  const searchWindows = getSearchWindows(polygon);

  const viewport = getViewport(bounds.viewport);

  const insertValue: InsertLocation = {
    id: id,
    viewport: viewport,
    name: bounds.displayName.text,
    coverImg: images.data.image,
    coverImgSmall: images.data.thumbnail,
    windows: searchWindows,
    geometry: polygon,
  };
  // Insert information into database
  await db.insert(location).values(insertValue).onConflictDoNothing();

  return Response.json(
    {
      data: {
        id: id,
        label: name,
        subtitle: country,
      },
      status: "success",
    },
    { headers: updateCookies },
  );
}
