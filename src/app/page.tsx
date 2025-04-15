import Footer from "@/components/footer";
import Header from "@/components/header";
import Arrow from "@/components/ui/arrow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ButtonLink from "@/components/ui/button-link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { location, trip, tripPlace } from "@/server/db/schema";
import {
  IconClick,
  IconHandStop,
  IconMapPinBolt,
  IconNote,
  IconPlus,
  IconReport,
  IconRoute2,
  IconStopwatch,
  IconUsersGroup,
} from "@tabler/icons-react";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import Friends from "../../public/Friends.png";
import Generate from "../../public/Generate.png";
import Splash from "../../public/Home.png";
import Itinerary from "../../public/Itinerary.png";
import Schedule from "../../public/Schedule.png";
import Swipe from "../../public/Swipe.png";
import TripCard from "./trip-card";
import TripOverviewSortSelect from "./trip-overview-sort-select";
import { TripDialogs } from "./trip/[id]/trip-dialogs";

const HomeFeature = ({
  header,
  description,
  firstPoint,
  secondPoint,
  firstIcon,
  secondIcon,
  pointColor,
  iconColor,
  image,
  reverse = false,
}: {
  header: string;
  description: string;
  firstPoint: string;
  secondPoint: string;
  firstIcon: ReactNode;
  secondIcon: ReactNode;
  pointColor: string;
  iconColor: string;
  image: ReactNode;
  reverse?: boolean;
}) => {
  return (
    <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-20">
      <div className={`space-y-4 lg:space-y-8 ${reverse ? "sm:order-2" : ""}`}>
        <h3 className="font-display text-4xl font-medium text-slate-900 lg:text-5xl">
          {header}
        </h3>
        <p className="text-slate-700 lg:text-xl">{description}</p>
        <ul className="space-y-2 lg:space-y-4 lg:text-xl">
          <li className={`flex items-center gap-3 ${pointColor}`}>
            <span
              className={`shrink-0 [&_svg]:size-5 lg:[&_svg]:size-auto ${iconColor}`}
            >
              {firstIcon}
            </span>
            {firstPoint}
          </li>
          <li className={`flex items-center gap-3 ${pointColor}`}>
            <span
              className={`shrink-0 [&_svg]:size-5 lg:[&_svg]:size-auto ${iconColor}`}
            >
              {secondIcon}
            </span>
            {secondPoint}
          </li>
        </ul>
      </div>
      {image}
    </div>
  );
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string }>;
}) {
  const session = await auth.api
    .getSession({
      headers: await headers(),
      query: {
        disableRefresh: true,
      },
    })
    .catch((e) => {
      console.error(e);
    });

  if (!session)
    return (
      <div className="flex min-h-screen flex-col">
        <Header>
          <ButtonLink
            href="/login"
            prefetch={false}
            variant="secondary"
            size="small"
          >
            Login
          </ButtonLink>
        </Header>
        <main className="grow overflow-x-hidden px-4">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-16 bg-gray-50 pt-12 sm:max-w-5xl sm:gap-24 lg:gap-48">
            <div className="grid grid-cols-1 items-center gap-16 sm:grid-cols-2 lg:grid-cols-5 xl:gap-20">
              <div className="flex flex-col items-start gap-6 lg:col-span-3 lg:gap-8">
                <h1 className="font-display text-6xl font-semibold text-slate-900 lg:text-7xl">
                  Trip planning should be easy.
                </h1>
                <p className="text-xl font-medium text-slate-700 lg:text-2xl">
                  We know planning trips can be frustrating. Plan your trips the
                  enjoyable way, with Outbound.
                </p>
                <ButtonLink
                  href="/register"
                  prefetch={false}
                  className="mx-auto sm:mx-0"
                  size="large"
                >
                  Start Planning
                </ButtonLink>
              </div>
              <div className="relative aspect-[3/2] min-h-96 w-[48rem] overflow-hidden rounded-2xl border-2 border-slate-200 shadow-xl sm:min-h-[512px] sm:w-[57rem] lg:col-span-2 lg:min-h-[768px] lg:w-auto lg:rounded-3xl">
                <Image
                  src={Splash.src}
                  alt="Screenshot of Outbound"
                  fill
                  sizes="(max-width: 767px) 48rem, (max-width: 1023px) 57rem, 1152px"
                  priority
                  quality={92}
                  placeholder="blur"
                  blurDataURL={Splash.blurDataURL}
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="sm:text-center">
                <h3 className="mb-4 font-display text-4xl font-medium text-slate-900 lg:text-5xl">
                  Swipe, save and explore!
                </h3>
                <p className="mb-2 text-slate-700 lg:text-xl">
                  Decision paralysis when choosing which places to go? We
                  don&apos;t think so.
                </p>
                <p className="text-slate-700 lg:text-xl">
                  Just swipe left or right to decide which places to go—planning
                  has never been this easy.
                </p>
              </div>
              <div className="relative aspect-[4/3]">
                <Image
                  src={Swipe.src}
                  alt="Outbound swipe feature screenshot"
                  fill
                  sizes="(max-width: 1023px) 100vw, 1024px"
                  className="rounded-2xl border-2 border-slate-200 object-cover shadow-md lg:rounded-3xl"
                  quality={92}
                  placeholder="blur"
                  blurDataURL={Swipe.blurDataURL}
                />
              </div>
            </div>
            <HomeFeature
              header="Drag, Drop, and Personalise!"
              description="Build your perfect trip with our easy drag-and-drop itinerary
                  planner. Organise your saved places, add personal notes, and
                  adjust your schedule in seconds."
              firstIcon={<IconHandStop />}
              secondIcon={<IconNote />}
              firstPoint="Simple drag-and-drop editing"
              secondPoint="Add notes for plans, tips, or reminders"
              iconColor="text-orange-500"
              pointColor="text-orange-600"
              image={
                <div className="relative -mx-16 overflow-hidden px-16 sm:rotate-1">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={Itinerary.src}
                      alt="Outbound itinerary planner screenshot"
                      fill
                      sizes="(max-width: 639px) 384px, (max-width: 1023px) 50vw, 512px"
                      quality={92}
                      className="rounded-2xl border-2 border-slate-200 object-cover shadow-2xl lg:rounded-3xl"
                      placeholder="blur"
                      blurDataURL={Itinerary.blurDataURL}
                    />
                  </div>
                  <div
                    className="absolute inset-x-0 -bottom-1 h-24 bg-gradient-to-t from-gray-50 from-10% to-transparent sm:h-32"
                    role="presentation"
                    aria-hidden="true"
                  ></div>
                </div>
              }
            />
            <HomeFeature
              header="No More Guesswork!"
              description="Make scheduling easy! Our planner calculates travel times
                  between locations and shows your expected arrival time at each
                  spot."
              firstIcon={<IconRoute2 />}
              secondIcon={<IconReport />}
              firstPoint="Accurate travel time estimates"
              secondPoint="Auto-adjusted arrival times"
              pointColor="text-lime-600"
              iconColor="text-lime-500"
              image={
                <div className="relative -mx-16 overflow-hidden px-16 sm:-rotate-1">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={Schedule.src}
                      alt="Outbound schedule feature screenshot"
                      fill
                      sizes="(max-width: 639px) 384px, (max-width: 1023px) 50vw, 512px"
                      quality={92}
                      className="rounded-2xl border-2 border-slate-200 object-cover shadow-2xl lg:rounded-3xl"
                      placeholder="blur"
                      blurDataURL={Schedule.blurDataURL}
                    />
                  </div>
                  <div
                    className="absolute inset-x-0 -bottom-1 h-24 bg-gradient-to-t from-gray-50 from-10% to-transparent sm:h-32"
                    role="presentation"
                    aria-hidden="true"
                  ></div>
                </div>
              }
              reverse
            />
            <HomeFeature
              header="Your Trip, Made in Seconds!"
              description="Short on time? Let us arrange your itinerary for you!
                  We'll organise your saved spots into a day-by-day
                  itinerary optimised for the best route and timing."
              firstIcon={<IconMapPinBolt />}
              secondIcon={<IconStopwatch />}
              firstPoint="Instantly turns saved places into an itinerary"
              secondPoint="Optimises order to minimise travel time"
              iconColor="text-violet-500"
              pointColor="text-violet-600"
              image={
                <div className="relative aspect-square sm:rotate-1">
                  <Image
                    src={Generate.src}
                    alt="Outbound itinerary generation feature screenshot"
                    fill
                    sizes="(max-width: 639px) 384px, (max-width: 1023px) 50vw, 512px"
                    quality={92}
                    className="rounded-2xl border-2 border-slate-200 object-cover shadow-md lg:rounded-3xl"
                    placeholder="blur"
                    blurDataURL={Generate.blurDataURL}
                  />
                </div>
              }
            />
            <HomeFeature
              header="Better With Friends!"
              description="Trip planned? Share the final itinerary with friends and
                  family in just one tap! Whether it's for travel buddies,
                  parents keeping tabs, or just some friends, your trip is ready
                  to be seen."
              firstIcon={<IconClick />}
              secondIcon={<IconUsersGroup />}
              firstPoint="One-click sharing"
              secondPoint="No login required—viewable by anyone"
              pointColor="text-brand-600"
              iconColor="text-brand-500"
              image={
                <div className="relative aspect-[6/7] sm:-rotate-1">
                  <Image
                    src={Friends.src}
                    alt="Outbound share screenshot"
                    fill
                    sizes="(max-width: 639px) 384px, (max-width: 1023px) 50vw, 512px"
                    quality={92}
                    className="rounded-2xl border-2 border-slate-200 object-cover shadow-md lg:rounded-3xl"
                    placeholder="blur"
                    blurDataURL={Friends.blurDataURL}
                  />
                </div>
              }
              reverse
            />
          </div>
          <div className="relative z-10 -mx-4 mt-16 flex min-h-[512px] w-[calc(100%+2rem)] flex-col items-center justify-center gap-8 overflow-hidden bg-brand-900 bg-gradient-to-tr from-sky-950 via-brand-900 via-30% to-brand-800 p-4 text-center before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-sky-950 before:via-brand-900 before:via-10% before:to-brand-700 before:opacity-0 before:transition-opacity before:duration-1000 hover:before:opacity-100 sm:mx-0 sm:mb-4 sm:mt-24 sm:w-full sm:rounded-2xl lg:mt-48 lg:rounded-3xl xl:min-h-[768px]">
            <h3 className="font-display text-4xl font-semibold text-brand-50 lg:text-5xl">
              Let&apos;s plan your next adventure.
            </h3>
            <ButtonLink
              href="/register"
              size="large"
              prefetch={false}
              className="bg-brand-300 text-brand-900"
            >
              Start Planning
            </ButtonLink>
          </div>
        </main>
        <Footer />
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
    <div className="flex min-h-screen flex-col">
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
      <main className="grow px-4 py-8">
        <div className="mx-auto flex w-full max-w-sm grow flex-col gap-8 sm:max-w-7xl">
          {trips.length > 0 ? (
            <>
              <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
                <h1 className="grow font-display text-4xl font-semibold text-slate-900">
                  My Trips
                </h1>
                <ButtonLink href="/new" size="large">
                  <IconPlus />
                  New Trip
                </ButtonLink>
              </div>
              <TripOverviewSortSelect />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {trips.map((trip) => (
                  <TripCard trip={trip} key={trip.tripId} />
                ))}
              </div>
            </>
          ) : (
            <div className="relative flex flex-col items-center gap-8">
              <h1 className="text-center font-display text-4xl font-semibold text-slate-900">
                My Trips
              </h1>
              <p className="text-center text-slate-500">
                You don&apos;t have any trips yet.
                <br />
                Get started!
              </p>
              <ButtonLink href="/new" size="large">
                <IconPlus />
                New Trip
              </ButtonLink>
              <Arrow className="absolute left-1/2 top-[108px] translate-x-[52px] text-slate-700" />
            </div>
          )}
        </div>
      </main>
      <Footer />
      <TripDialogs />
    </div>
  );
}
