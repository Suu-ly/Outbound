import Footer from "@/components/footer";
import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { location, trip, tripPlace } from "@/server/db/schema";
import { IconDotsVertical, IconPlus } from "@tabler/icons-react";
import { and, count, desc, eq, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
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
    .leftJoin(tripPlace, eq(tripPlace.tripId, trip.id))
    .where(
      and(
        eq(trip.userId, session.user.id),
        or(eq(tripPlace.type, "skipped"), isNull(tripPlace.type)),
      ),
    )
    .groupBy(trip.id, location.coverImgSmall)
    .orderBy(desc(trip.updatedAt));

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
      <main className="mx-auto flex w-full max-w-7xl grow flex-col gap-8 bg-zinc-50 px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
          <h1 className="grow font-display text-4xl font-semibold text-slate-900">
            My Trips
          </h1>
          <ButtonLink href="/new" size="large">
            <IconPlus />
            New Trip
          </ButtonLink>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {trips.map((trip) => (
            <div
              key={trip.tripId}
              className="group relative space-y-2 rounded-2xl border-2 border-slate-200 bg-white p-3 ring-0 ring-slate-200 transition hover:ring-2 active:ring-slate-400"
            >
              <div className="relative aspect-[5/4] overflow-hidden rounded-lg">
                <img
                  src={trip.coverImgSmall}
                  alt={trip.name}
                  className="absolute size-full object-cover transition-transform duration-500 group-hover:scale-[102%]"
                />
              </div>
              <div className="flex">
                <div className="flex grow flex-col">
                  <Link href={`/trip/${trip.tripId}`}>
                    <span
                      className="absolute inset-0"
                      role="presentation"
                    ></span>
                    <h4 className="line-clamp-2 grow font-display text-2xl font-medium text-slate-900">
                      {trip.name}
                    </h4>
                  </Link>
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    {trip.startDate.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}{" "}
                    –{" "}
                    {trip.endDate.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </p>
                  <p className="text-slate-700">{trip.places} Places</p>
                </div>
                <Button
                  size="small"
                  variant="ghost"
                  iconOnly
                  aria-label="More options"
                >
                  <IconDotsVertical />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
