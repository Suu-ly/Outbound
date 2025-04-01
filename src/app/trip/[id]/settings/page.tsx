import BackButton from "@/components/back-button";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { trip } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  DayEndTime,
  DayStartTime,
  PrivateTrip,
  RoundUpTravelTime,
} from "./settings-controls";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function TripSwipePage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const id = (await params).id;
  const header = await headers();
  const [user, [tripUserId]] = await Promise.all([
    auth.api.getSession({
      headers: header,
      query: {
        // @ts-expect-error there's some kinda bug with better-auth
        disableRefresh: true,
      },
    }),
    db
      .select({ userId: trip.userId })
      .from(trip)
      .where(eq(trip.id, id))
      .limit(1),
  ]);

  if (!user || user.user.id !== tripUserId.userId) redirect(`/trip/${id}`);

  return (
    <main className="size-full space-y-6 p-4 sm:w-1/2 xl:w-1/3">
      <BackButton className="-ml-2" />
      <h1 className="font-display text-2xl font-medium text-slate-900">
        Trip Settings
      </h1>
      <div className="flex max-w-3xl flex-col gap-3 xl:flex-row">
        <h3 className="w-24 shrink-0 text-sm font-medium text-slate-900">
          Itinerary
        </h3>
        <div className="grow space-y-2">
          <DayStartTime />
          <DayEndTime />
          <RoundUpTravelTime />
        </div>
      </div>
      <Separator />
      <div className="flex max-w-3xl flex-col gap-3 xl:flex-row">
        <h3 className="w-24 shrink-0 text-sm font-medium text-slate-900">
          Trip Privacy
        </h3>
        <div className="grow space-y-2">
          <PrivateTrip />
        </div>
      </div>
    </main>
  );
}
