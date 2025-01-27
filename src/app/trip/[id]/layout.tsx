import Header from "@/components/header";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { location, trip, tripDay } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import MapView from "./map-view";
import TripHeaderItems from "./trip-header-items";
import TripProviders from "./trip-providers";

export default async function TripLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}>) {
  const id = (await params).id;

  const [userSession, data] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    db
      .select()
      .from(trip)
      .innerJoin(tripDay, eq(trip.id, tripDay.tripId))
      .innerJoin(location, eq(location.id, trip.locationId))
      .where(eq(trip.id, id)),
  ]);

  return (
    <TripProviders data={data} session={userSession}>
      <Header>
        <TripHeaderItems />
      </Header>
      <div className="flex h-[calc(100dvh-56px)]">
        {children}
        <MapView />
      </div>
    </TripProviders>
  );
}
