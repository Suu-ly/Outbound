import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ButtonLink from "@/components/ui/button-link";
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

  if (data.length === 0)
    return (
      <div className="flex min-h-dvh flex-col">
        <Header>
          <Avatar>
            <AvatarImage
              src={
                userSession && userSession.user.image
                  ? userSession.user.image
                  : undefined
              }
            />
            <AvatarFallback>
              {userSession
                ? userSession.user.name.substring(0, 2).toUpperCase()
                : "NA"}
            </AvatarFallback>
          </Avatar>
        </Header>
        <main className="mx-auto flex w-full max-w-screen-sm grow flex-col items-center justify-center gap-12 p-4">
          <div className="text-center">
            <h1 className="mb-3 font-display text-4xl font-semibold">
              Trip Not Found!
            </h1>
            <h3 className="text-lg text-slate-700">
              We can&apos;t seem to find the trip that you&apos;re looking for.
              The trip id may be incorrect or the trip may have been deleted.
            </h3>
          </div>
          <ButtonLink href="/" size="large">
            Back to Home
          </ButtonLink>
        </main>
      </div>
    );

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
