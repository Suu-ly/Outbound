"use client";

import DateHydration from "@/components/date-hydration";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markerColorLookup } from "@/lib/color-lookups";
import { useMediaQuery } from "@/lib/use-media-query";
import { getElementId, insertAfter } from "@/lib/utils";
import { addTripDays, deleteTripDays, updateTripDates } from "@/server/actions";
import { InsertTripDay } from "@/server/db/schema";
import { PlaceDataEntry } from "@/server/types";
import { IconCalendarWeek } from "@tabler/icons-react";
import { differenceInCalendarDays } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import {
  changeTripNameDialogOpenAtom,
  dayPlacesAtom,
  isTripAdminAtom,
  savedPlacesAmountAtom,
  tripDetailsAtom,
  tripPlacesAtom,
} from "../atoms";
import DayFolder from "./day-folder";
import PlaceDetailsCompact from "./place-details-compact";
import SortPlaces from "./sort-places";
import TravelTimeIndicator from "./travel-time-indicator";
import TravelTimeSelect from "./travel-time-select";
import ViewMapToggle from "./view-map-toggle";

const TripCalendar = ({ tripId }: { tripId: string }) => {
  const isLarge = useMediaQuery("(min-width: 768px)");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isChangingDate, setIsChangingDate] = useState(false);

  const [tripData, setTripData] = useAtom(tripDetailsAtom);
  const setPlaces = useSetAtom(tripPlacesAtom);
  const [days, setDays] = useAtom(dayPlacesAtom);
  const [date, setDate] = useState<DateRange | undefined>({
    from: tripData.startDate,
    to: tripData.endDate,
  });

  const handleDateSave = async () => {
    if (
      !date ||
      !date.from ||
      !date.to ||
      (date.from.getTime() === tripData.startDate.getTime() &&
        date.to.getTime() === tripData.endDate.getTime())
    ) {
      setCalendarOpen(false);
      return;
    }

    setIsChangingDate(true);
    const startDate = date.from;
    const endDate = date.to;

    const numberOfDays = differenceInCalendarDays(date.to, date.from) + 1;

    const updateDates = updateTripDates(
      new Date(startDate.getTime()),
      new Date(endDate.getTime()),
      tripId,
    );
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

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="mb-1 rounded-lg py-2 pr-3 ring-offset-white has-[svg]:pl-2 [&_svg]:size-6"
        >
          <IconCalendarWeek />
          <div className="text-slate-700">
            {date && date.from ? (
              <DateHydration date={date.from} />
            ) : (
              <span className="text-slate-400">Start</span>
            )}
          </div>
          -
          <div className="text-slate-700">
            {date && date.to ? (
              <DateHydration date={date.to} />
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
            timeZone="UTC"
            className="pb-2"
            disabled={{ before: new Date() }}
            mode="range"
            selected={date}
            required
            onSelect={(range) => {
              setDate((prev) => {
                if (!range) return prev;
                if (!prev || (prev && prev.from === prev.to)) return range;
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
  );
};

const NonAdminView = () => {
  const places = useAtomValue(tripPlacesAtom);
  const days = useAtomValue(dayPlacesAtom);
  return (
    <>
      <h3 className="font-display text-2xl font-medium">Saved Places</h3>
      {places.saved.map((place, index) => (
        <div
          key={place.placeInfo.placeId}
          className={"relative ml-5 border-l-2 border-gray-100 pl-6"}
        >
          <div
            className={`absolute -left-px top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-gray-100 bg-amber-300 text-sm font-medium text-amber-900`}
            aria-label={`Saved place ${index + 1}`}
          >
            {index + 1}
          </div>
          <PlaceDetailsCompact
            data={place}
            elementId={getElementId("saved", index)}
          />
        </div>
      ))}
      <h3 className="mt-4 font-display text-2xl font-medium">Itinerary</h3>
      <div className="flex flex-col gap-6">
        {days.map((day, dayIndex) => (
          <DayFolder key={day.dayId} index={dayIndex}>
            {places[day.dayId].map((place, index) => {
              return (
                <div
                  key={place.placeInfo.placeId}
                  className="relative ml-5 border-l-2 border-slate-700 pb-2 pl-6 last:border-transparent last:pb-0"
                >
                  <div
                    className={`absolute -left-px top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-gray-100 text-sm font-medium ${markerColorLookup[dayIndex % markerColorLookup.length].bg} ${markerColorLookup[dayIndex % markerColorLookup.length].text}`}
                    aria-label={`Saved place on day ${dayIndex + 1} ${index + 1}`}
                  >
                    {index + 1}
                  </div>
                  <TravelTimeIndicator
                    isInDay={day.dayId}
                    index={index}
                    startTime={day.dayStartTime}
                  />
                  <PlaceDetailsCompact
                    data={place}
                    isInDay={day.dayId}
                    elementId={getElementId("day", index, dayIndex)}
                    dayIndex={dayIndex}
                  />
                  {index < places[day.dayId].length - 1 && ( // Not the last item
                    <TravelTimeSelect
                      fromId={place.placeInfo.placeId}
                      fromCoords={place.placeInfo.location}
                      toId={places[day.dayId][index + 1].placeInfo.placeId}
                      toCoords={places[day.dayId][index + 1].placeInfo.location}
                      isAdmin={false}
                    />
                  )}
                </div>
              );
            })}
            {places[day.dayId].length === 0 && (
              <span className="inline-block w-full text-center leading-8 text-slate-500">
                No places planned for this day.
              </span>
            )}
          </DayFolder>
        ))}
      </div>
    </>
  );
};

export default function TripPage({ tripId }: { tripId: string }) {
  const tripData = useAtomValue(tripDetailsAtom);
  const savedPlacesAmount = useAtomValue(savedPlacesAmountAtom);
  const setChangeTripNameDialogOpen = useSetAtom(changeTripNameDialogOpenAtom);
  const isAdmin = useAtomValue(isTripAdminAtom);

  return (
    <ViewMapToggle>
      <div className="relative aspect-square w-full">
        <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl bg-white p-4 text-center shadow-md">
          {isAdmin && (
            <Button
              variant="ghost"
              className={
                "mx-auto mb-4 flex rounded-lg px-3 py-2 ring-offset-white"
              }
              onClick={() =>
                setChangeTripNameDialogOpen({
                  currentName: tripData.name,
                  tripId: tripData.id,
                })
              }
            >
              <h1 className="font-display text-2xl font-semibold text-slate-900 xl:text-3xl">
                {tripData.name}
              </h1>
            </Button>
          )}
          {!isAdmin && (
            <h1 className="mb-4 px-3 py-2 font-display text-2xl font-semibold text-slate-900 xl:text-3xl">
              {tripData.name}
            </h1>
          )}
          {isAdmin && <TripCalendar tripId={tripId} />}
          {!isAdmin && (
            <div className="mb-1 inline-flex gap-2 font-medium text-slate-700">
              <IconCalendarWeek />
              <span>
                <DateHydration date={tripData.startDate} />
              </span>
              -
              <span>
                <DateHydration date={tripData.endDate} />
              </span>
            </div>
          )}
          <p>{savedPlacesAmount} Places</p>
        </div>
        <img
          src={tripData.coverImg}
          alt={tripData.name}
          className="absolute size-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 p-4">
        {isAdmin && <SortPlaces tripId={tripId} />}
        {!isAdmin && <NonAdminView />}
      </div>
    </ViewMapToggle>
  );
}
