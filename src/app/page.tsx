import Footer from "@/components/footer";
import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ButtonLink from "@/components/ui/button-link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { location, trip, tripPlace } from "@/server/db/schema";
import { IconPlus } from "@tabler/icons-react";
import { and, count, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Image from "next/image";
import TripCard from "./trip-card";
import TripOverviewSortSelect from "./trip-overview-sort-select";
import { TripDialogs } from "./trip/[id]/trip-dialogs";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string }>;
}) {
  const session = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      console.log(e);
    });

  if (!session)
    return (
      <div className="flex min-h-dvh flex-col">
        <Header>
          <ButtonLink size="small" href="/login">
            Login
          </ButtonLink>
        </Header>
        <main className="flex w-full grow flex-col items-center justify-center gap-4 bg-zinc-50 py-8">
          <div className="flex items-baseline gap-2">
            <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
            <h1 className="font-display text-4xl font-semibold text-brand-900">
              Outbound
            </h1>
          </div>
          <ButtonLink href="/login" size="large">
            Login
          </ButtonLink>
        </main>
      </div>
    );
  const sortMethod = (await searchParams).sortBy;

  const trips = await db
    .select({
      tripId: trip.id,
      name: trip.name,
      coverImgSmall: location.coverImgSmall,
      startDate: trip.startDate,
      endDate: trip.endDate,
      private: trip.private,
      places: count(tripPlace.placeId),
    })
    .from(trip)
    .innerJoin(location, eq(location.id, trip.locationId))
    .leftJoin(
      tripPlace,
      and(eq(tripPlace.tripId, trip.id), eq(tripPlace.type, "saved")),
    )
    .where(eq(trip.userId, session.user.id))
    .groupBy(trip.id, location.coverImgSmall)
    .orderBy(sortMethod === "date" ? trip.startDate : desc(trip.updatedAt));

  return (
    <div className="flex min-h-dvh flex-col">
      <Header>
        <Avatar>
          <AvatarImage
            src={session.user.image ? session.user.image : undefined}
          />
          <AvatarFallback>
            {session.user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Header>
      <main className="mx-auto flex w-full max-w-sm grow flex-col gap-8 bg-zinc-50 px-4 py-8 sm:max-w-7xl">
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
          <h1 className="grow font-display text-4xl font-semibold text-slate-900">
            My Trips
          </h1>
          <ButtonLink href="/new" size="large">
            <IconPlus />
            New Trip
          </ButtonLink>
        </div>
        <div className="space-y-4">
          <TripOverviewSortSelect />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {trips.map((trip) => (
              <TripCard trip={trip} key={trip.tripId} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <TripDialogs />
    </div>
  );
}
