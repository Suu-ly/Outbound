import { db } from "@/server/db";
import { trip } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import TripPage from "./trip-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const tripId = (await params).id;
  const [{ name }] = await db
    .select({ name: trip.name })
    .from(trip)
    .where(eq(trip.id, tripId))
    .limit(1);

  return {
    title: name,
  };
}

export default async function MainTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tripId = (await params).id;

  return <TripPage tripId={tripId} />;
}
