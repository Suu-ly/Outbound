"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMediaQuery } from "@/lib/use-media-query";
import { insertAfter } from "@/lib/utils";
import { addTripDays, deleteTripDays, updateTripDates } from "@/server/actions";
import { InsertTripDay } from "@/server/db/schema";
import { PlaceDataEntry } from "@/server/types";
import { IconCalendarWeek } from "@tabler/icons-react";
import { differenceInCalendarDays } from "date-fns";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import {
  dayPlacesAtom,
  savedPlacesAmountAtom,
  tripDetailsAtom,
  tripPlacesAtom,
} from "../atoms";
import SortPlaces from "./sort-places";
import ViewMapToggle from "./view-map-toggle";

export default function TripPage({ tripId }: { tripId: string }) {
  const isLarge = useMediaQuery("(min-width: 768px)");
  const [tripData, setTripData] = useAtom(tripDetailsAtom);
  const [places, setPlaces] = useAtom(tripPlacesAtom);
  const [days, setDays] = useAtom(dayPlacesAtom);
  const [date, setDate] = useState<DateRange | undefined>({
    from: tripData.startDate,
    to: tripData.endDate,
  });
  const savedPlacesAmount = useAtomValue(savedPlacesAmountAtom);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);

  const handleDateSave = async () => {
    if (!date || !date.from || !date.to) return;
    setIsChangingDate(true);
    const startDate = date.from;
    const endDate = date.to;

    const numberOfDays = differenceInCalendarDays(date.to, date.from) + 1;

    const updateDates = updateTripDates(startDate, endDate, tripId);
    let updateDateSuccess;

    if (numberOfDays > days.length) {
      // Add new days
      let order = insertAfter(days[days.length - 1].dayOrder);
      const daysToInsert: InsertTripDay[] = [];
      for (let i = 0; i < numberOfDays - days.length; i++) {
        daysToInsert.push({
          tripId: tripId,
          order: order,
        });
        order = insertAfter(order);
      }
      const [newDays, datesResponse] = await Promise.all([
        addTripDays(daysToInsert),
        updateDates,
      ]);
      updateDateSuccess = datesResponse;
      if (newDays.status === "error") toast.error(newDays.message);
      else {
        const emptyPlaces: Record<string | number, PlaceDataEntry[]> = {};
        for (let i = 0; i < newDays.data.length; i++) {
          emptyPlaces[newDays.data[i].dayId] = [];
        }
        setDays((prev) => [...prev, ...newDays.data]);
        setPlaces((prev) => ({
          ...prev,
          ...emptyPlaces,
        }));
      }
    } else if (numberOfDays < days.length) {
      // Remove days from the end and transfer those places to saved places
      const removedDays: number[] = days
        .slice(numberOfDays)
        .map((day) => day.dayId);
      const [response, datesResponse] = await Promise.all([
        deleteTripDays(removedDays, tripId),
        updateDates,
      ]);
      updateDateSuccess = datesResponse;
      if (response.status === "error") toast.error(response.message);
      else {
        setDays((prev) => prev.slice(0, numberOfDays));
        setPlaces((prev) => {
          let savedPlaces = prev.saved;
          // Order of current last element in saved places
          let order =
            savedPlaces.length > 0
              ? savedPlaces[savedPlaces.length - 1].userPlaceInfo.tripOrder
              : undefined;
          const emptyPlaces: Record<string | number, PlaceDataEntry[]> = {};
          for (let i = 0; i < removedDays.length; i++) {
            emptyPlaces[removedDays[i]] = [];
            const placesToAdd: PlaceDataEntry[] = prev[removedDays[i]].map(
              (place) => {
                order = insertAfter(order);
                return {
                  placeInfo: place.placeInfo,
                  userPlaceInfo: {
                    ...place.userPlaceInfo,
                    tripOrder: order,
                  },
                };
              },
            );
            console.log(placesToAdd);
            savedPlaces = savedPlaces.concat(placesToAdd);
          }
          return {
            ...prev,
            ...emptyPlaces,
            saved: savedPlaces,
          };
        });
      }
    } else {
      // No change in number of days, just change dates
      updateDateSuccess = await updateDates;
    }
    if (updateDateSuccess.status === "error")
      toast.error(updateDateSuccess.message);
    else {
      setTripData((prev) => ({
        ...prev,
        startDate: startDate,
        endDate: endDate,
      }));
    }
    setCalendarOpen(false);
    setIsChangingDate(false);
  };

  const handleCancel = () => {
    if (isChangingDate) return;
    setDate({
      from: tripData.startDate,
      to: tripData.endDate,
    });
    setCalendarOpen(false);
  };

  console.log("Places", places);
  console.log("Days", days);

  return (
    <ViewMapToggle>
      <div className="relative aspect-square w-full">
        <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl border-2 border-slate-200 bg-white p-4 text-center shadow-md">
          <h1 className="mb-4 font-display text-2xl font-semibold text-slate-900 xl:text-3xl">
            {tripData.name}
          </h1>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal>
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
            <PopoverContent
              className="w-auto p-0"
              onInteractOutside={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              onEscapeKeyDown={(e) => {
                e.preventDefault();
                handleCancel();
              }}
            >
              <div>
                <Calendar
                  className="pb-2"
                  disabled={{ before: new Date() }}
                  mode="range"
                  selected={date}
                  required
                  onSelect={(range) => {
                    setDate((prev) => {
                      if (!range) return prev;
                      if (!prev || (prev && prev.from === prev.to))
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
                <div className="flex flex-row-reverse items-center gap-3 p-3 pt-0">
                  <Button onClick={handleDateSave} loading={isChangingDate}>
                    Save
                  </Button>
                  <Button
                    disabled={isChangingDate}
                    variant="ghost"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
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
      <div className="flex flex-col gap-4 p-4 pb-14 sm:pb-4">
        <SortPlaces tripId={tripId} />
      </div>
    </ViewMapToggle>
  );
}
