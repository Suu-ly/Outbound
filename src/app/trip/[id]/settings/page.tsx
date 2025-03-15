import BackButton from "@/components/back-button";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import {
  DayEndTime,
  DayStartTime,
  PrivateTrip,
  RoundUpTravelTime,
} from "./settings-controls";

export const metadata: Metadata = {
  title: "Trip Settings",
};

export default async function TripSwipePage() {
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
