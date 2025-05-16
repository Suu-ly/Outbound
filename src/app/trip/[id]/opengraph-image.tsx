import { db } from "@/server/db";
import { location, trip, tripPlace, user } from "@/server/db/schema";
import { and, count, eq } from "drizzle-orm";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Image metadata
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export async function generateImageMetadata({
  params,
}: {
  params: { id: string };
}) {
  const [tripDetails] = await db
    .select({ title: trip.name })
    .from(trip)
    .where(eq(trip.id, params.id));

  return [
    {
      alt: tripDetails.title,
    },
  ];
}

// Image generation
export default async function Image({ params }: { params: { id: string } }) {
  const tripId = params.id;
  // Font loading, process.cwd() is Next.js project directory
  const [clashDisplay, generalSans, [tripDetails]] = await Promise.all([
    readFile(join(process.cwd(), "src/app/ClashDisplay-Semibold.ttf")),
    readFile(join(process.cwd(), "src/app/GeneralSans-Medium.ttf")),
    db
      .select({
        title: trip.name,
        coverImg: location.coverImg,
        location: location.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        userName: user.name,
        userImg: user.image,
        places: count(tripPlace.placeId),
      })
      .from(trip)
      .innerJoin(user, eq(user.id, trip.userId))
      .innerJoin(location, eq(location.id, trip.locationId))
      .leftJoin(
        tripPlace,
        and(eq(tripPlace.tripId, trip.id), eq(tripPlace.type, "saved")),
      )
      .groupBy(
        trip.name,
        location.coverImg,
        location.name,
        trip.startDate,
        trip.endDate,
        user.name,
        user.image,
      )
      .where(eq(trip.id, tripId)),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(107deg, #FFF 40.11%, #EBF8FE 98.1%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "64px",
          padding: "64px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "48px",
            width: "576px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#0A3057",
              height: "24px",
            }}
          >
            <img
              src={`${process.env.NEXT_PUBLIC_URL}/outbound.svg`}
              width={24}
              height={24}
              alt="Outbound"
            />
            <p
              style={{
                fontFamily: "Clash-display",
                fontSize: "36px",
                letterSpacing: "-0.72px",
                lineHeight: "24px",
              }}
            >
              Outbound
            </p>
          </div>
          <h1
            style={{
              fontFamily: "Clash-display",
              fontSize: "72px",
              lineHeight: "72px",
              letterSpacing: "-0.72px",
              color: "#0F172A",
              margin: 0,
              lineClamp: 3,
              display: "block",
            }}
          >
            {tripDetails.title}
          </h1>
          <div
            style={{
              background: "#F1F5F9",
              borderRadius: "64px",
              display: "flex",
              padding: "12px 32px",
              gap: "12px",
              alignItems: "center",
              color: "#475569",
              fontSize: "30px",
              lineHeight: "36px",
              fontFamily: "General-sans",
              alignSelf: "flex-start",
            }}
          >
            <span>
              {tripDetails.startDate.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "2-digit",
                timeZone: "UTC",
              })}{" "}
              –{" "}
              {tripDetails.endDate.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "2-digit",
                timeZone: "UTC",
              })}
            </span>
            <span>·</span>
            <span>{tripDetails.places} Places</span>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {tripDetails.userImg ? (
              <img
                src={tripDetails.userImg}
                width={40}
                height={40}
                style={{ objectFit: "cover", borderRadius: "64px" }}
                alt={tripDetails.userName}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  height: "40px",
                  width: "40px",
                  borderRadius: "64px",
                  background: "#CBD5E1",
                  color: "#334155",
                  padding: "8px",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {tripDetails.userName.toUpperCase().substring(0, 2)}
              </div>
            )}
            <span
              style={{
                lineClamp: 1,
                display: "block",
                color: "#334155",
                fontFamily: "General-sans",
                fontSize: "24px",
                lineHeight: "32px",
              }}
            >
              {tripDetails.userName}
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            borderRadius: "24px",
            border: "2px solid #E2E8F0",
            boxShadow:
              "0px 10px 15px -3px rgba(0, 0, 0, 0.10), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)",
            position: "relative",
            overflow: "hidden",
            flexGrow: 1,
            height: "100%",
          }}
        >
          <img
            src={tripDetails.coverImg}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            alt={tripDetails.location}
          />
        </div>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
      fonts: [
        {
          name: "General-sans",
          data: generalSans,
          style: "normal",
          weight: 400,
        },
        {
          name: "Clash-display",
          data: clashDisplay,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
