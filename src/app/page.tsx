import Footer from "@/components/footer";
import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ButtonLink from "@/components/ui/button-link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { location, trip, tripPlace } from "@/server/db/schema";
import { IconPlus } from "@tabler/icons-react";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
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
      query: {
        // @ts-expect-error there's some kinda bug with better-auth
        disableRefresh: true,
      },
    })
    .catch((e) => {
      console.error(e);
    });

  if (!session)
    return (
      <div className="flex min-h-dvh flex-col">
        <Header>
          <ButtonLink size="small" href="/login" prefetch={false}>
            Login
          </ButtonLink>
        </Header>
        <main className="flex w-full grow flex-col items-center justify-center gap-4 bg-gray-50 py-8">
          <div className="flex items-baseline gap-2">
            <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
            <h1 className="font-display text-4xl font-semibold text-brand-900">
              Outbound
            </h1>
          </div>
          <ButtonLink href="/login" size="large" prefetch={false}>
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
    .orderBy(
      sortMethod === "date"
        ? sql`${trip.startDate} < CURRENT_DATE, abs(${trip.startDate} - CURRENT_DATE)`
        : desc(trip.updatedAt),
    );

  return (
    <div className="flex min-h-dvh flex-col">
      <Header>
        <Link
          href="/account"
          className="rounded-full ring-slate-400 ring-offset-white transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Avatar>
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback>
              {session.user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </Header>
      <main className="px-4 py-8">
        <div className="mx-auto flex w-full max-w-sm grow flex-col gap-8 bg-gray-50 sm:max-w-7xl">
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
        </div>
      </main>
      <Footer />
      <TripDialogs />
    </div>
  );
}
