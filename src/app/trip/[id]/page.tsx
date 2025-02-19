"use client";

import DayFolder from "@/components/day-folder";
import PlaceDetailsCompact from "@/components/place-details-compact";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  IconCalendarWeek,
  IconMapPinSearch,
  IconWand,
} from "@tabler/icons-react";
import { addDays } from "date-fns";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import { type DateRange } from "react-day-picker";
import {
  dayPlacesAtom,
  isTripAdminAtom,
  savedPlacesAmountAtom,
  tripDetailsAtom,
  tripPlacesAtom,
} from "../atoms";
import ViewMapToggle from "./view-map-toggle";

export default function TripPage() {
  const isLarge = useMediaQuery("(min-width: 768px)");

  const [tripData, setTripData] = useAtom(tripDetailsAtom);
  const [places, setPlaces] = useAtom(tripPlacesAtom);
  const [days, setDays] = useAtom(dayPlacesAtom);
  const [date, setDate] = useState<DateRange | undefined>({
    from: tripData.startDate,
    to: tripData.endDate,
  });
  const savedPlacesAmount = useAtomValue(savedPlacesAmountAtom);
  const isAdmin = useAtomValue(isTripAdminAtom);

  console.log(places);
  console.log(days);

  return (
    <ViewMapToggle>
      <div className="relative aspect-square w-full">
        <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl border-2 border-slate-200 bg-white p-4 text-center shadow-md">
          <h1 className="mb-4 font-display text-2xl font-semibold text-slate-900 xl:text-3xl">
            {tripData.name}
          </h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={
                  "mb-1 rounded-lg bg-white py-2 pr-3 has-[svg]:pl-2 [&_svg]:size-6"
                }
              >
                <IconCalendarWeek />
                <div className="text-slate-700">
                  {date && date.from ? (
                    date.from.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })
                  ) : (
                    <span className="text-slate-400">Start</span>
                  )}
                </div>
                -
                <div className="text-slate-700">
                  {date && date.to ? (
                    date.to.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })
                  ) : (
                    <span className="text-slate-400">End</span>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                disabled={{ before: new Date() }}
                mode="range"
                selected={date}
                onSelect={(range) => {
                  setDate((prev) => {
                    if (!prev || !range || (prev && prev.from === prev.to))
                      return range;
                    // Only to changes, set to as start date
                    if (range.from === prev.from)
                      return { from: range.to, to: range.to };
                    // Otherwise
                    return { from: range.from, to: range.from };
                  });
                }}
                autoFocus
                defaultMonth={date?.from}
                numberOfMonths={isLarge ? 2 : 1}
              />
            </PopoverContent>
          </Popover>
          <p>{savedPlacesAmount} Places</p>
        </div>
        <img
          src={tripData.coverImg}
          alt={tripData.name}
          className="absolute size-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="mb-4 space-y-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-display text-2xl font-medium">Saved Places</h3>
            <Button size="small" variant="secondary" iconOnly>
              <IconMapPinSearch />
            </Button>
          </div>
          {places.saved.map((place) => (
            <PlaceDetailsCompact
              key={place.userPlaceInfo.placeId}
              data={place}
              days={days}
              startDate={tripData.startDate}
              isAdmin={isAdmin}
            />
          ))}
        </div>
        <div className="flex flex-col gap-4 pb-14 sm:pb-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-display text-2xl font-medium">Itinerary</h3>
            <Button size="small" variant="secondary" iconOnly>
              <IconWand />
            </Button>
          </div>
          {days.map((day, index) => (
            <DayFolder
              key={day.dayId}
              date={addDays(tripData.startDate, index)}
            >
              {places[day.dayId] &&
                places[day.dayId].map((place) => (
                  <div
                    key={place.userPlaceInfo.placeId}
                    className="rounded-lg bg-white p-4"
                  >
                    {place.placeInfo.displayName}
                  </div>
                ))}
            </DayFolder>
          ))}
        </div>
      </div>
    </ViewMapToggle>
  );
}
