"use client";

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
import { useState } from "react";
import { type DateRange } from "react-day-picker";
import ViewMapToggle from "./view-map-toggle";

export default function TripPage() {
  // const session = authClient.useSession();

  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const isLarge = useMediaQuery("(min-width: 768px)");

  const data = {
    location: {
      id: "ChIJdZOLiiMR2jERxPWrUs9peIg",
      name: "Singapore",
      coverImg:
        "https://www.stokedtotravel.com/wp-content/uploads/2020/11/Singapore-1.jpg",
      coverImgSmall:
        "https://tse2.mm.bing.net/th?id=OIP.8Tuqfv4sTaSGvOvdCGYJFwHaFQ&pid=Api",
      bounds: [Array],
      windowXStep: 2,
      windowYStep: 2,
    },
    trip: {
      id: "kkt9dn35q27f",
      userId: "c2TPmdFM0wIj7TWB3rvjpZxSUaMB1ibo",
      locationId: "ChIJdZOLiiMR2jERxPWrUs9peIg",
      name: "Trip to Singapore",
      private: true,
      roundUpTime: true,
      currentXWindow: 1,
      currentYWindow: 1,
      nextPageToken: null,
      startTime: "0900",
      endTime: "2100",
    },
  };

  return (
    <ViewMapToggle>
      <div className="relative aspect-square w-full">
        <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl border-2 border-slate-200 bg-white p-4 text-center shadow-md">
          <h1 className="mb-4 font-display text-2xl font-semibold text-slate-900 xl:text-3xl">
            {data.trip.name}
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
          <p>5 Places</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.location.coverImg}
          alt={data.location.name}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div className="mb-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-display text-2xl font-medium">Saved Places</h3>
            <Button size="small" variant="secondary" iconOnly>
              <IconMapPinSearch />
            </Button>
          </div>
        </div>
        <div className="pb-14">
          <div className="flex justify-between gap-3">
            <h3 className="font-display text-2xl font-medium">Itinerary</h3>
            <Button size="small" variant="secondary" iconOnly>
              <IconWand />
            </Button>
          </div>
        </div>
      </div>
    </ViewMapToggle>
  );
}
