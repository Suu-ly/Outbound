"use client";

import DateHydration from "@/components/date-hydration";
import AutoComplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import useDebouncedFunction from "@/lib/use-debounced-function";
import { useMediaQuery } from "@/lib/use-media-query";
import { addNewTrip } from "@/server/actions";
import { ApiResponse, AutocompleteReturn } from "@/server/types";
import { IconCalendarWeek, IconWorldSearch } from "@tabler/icons-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { v4 } from "uuid";

export default function NewTrip({ userId }: { userId: string }) {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const isLarge = useMediaQuery("(min-width: 768px)");

  const session = useRef(v4());
  const bufferedPress = useRef(false);

  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [selectedId, setSelectedId] = useState<AutocompleteReturn>();
  const [error, setError] = useState<{ search?: string; calendar?: string }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

  const debounce = useDebouncedFunction();

  const getAutocompleteData = async (query: string) => {
    const urlParams = new URLSearchParams([
      ["query", query],
      ["session", session.current],
    ]);
    const data = await fetch(`/api/places/autocomplete?${urlParams.toString()}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<AutocompleteReturn[]>);
    if (data.status === "error") {
      throw new Error(data.message);
    }
    return data.data;
  };

  const { data: autocomplete } = useQuery({
    queryKey: ["autocomplete", debouncedValue],
    queryFn: () => getAutocompleteData(debouncedValue),
    placeholderData: keepPreviousData,
    enabled: debouncedValue !== "",
    meta: {
      errorMessage: "Unable to autocomplete query",
    },
  });

  const getLocationData = async (
    selectedId: AutocompleteReturn | undefined,
  ) => {
    if (!selectedId) throw new Error("Selected place is not valid");
    const urlParams = new URLSearchParams([
      ["id", selectedId.id],
      ["name", selectedId.label],
      ["session", session.current],
    ]);
    if (selectedId.subtitle) urlParams.set("country", selectedId.subtitle);
    const data = await fetch(`/api/places/location?${urlParams.toString()}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<AutocompleteReturn>);
    if (data.status === "error") {
      throw new Error(data.message);
    }
    session.current = v4();
    return data.data;
  };

  const { isFetching, data: selected } = useQuery({
    queryKey: ["selected", selectedId?.id],
    queryFn: () => getLocationData(selectedId),
    enabled: !!selectedId,
    meta: {
      errorMessage: "Unable to fetch data for selected location",
    },
  });

  const validateTrip = async () => {
    if (!date)
      setError((prev) => ({
        ...prev,
        calendar: "Please select dates for your trip!",
      }));
    // No fetch in progress, so no location selected
    if (!selected && !isFetching)
      setError((prev) => ({ ...prev, search: "Please select a location!" }));

    // Fetch in progress and date selected, we optimisticly update UI
    if (isFetching && date) {
      bufferedPress.current = true;
      setIsLoading(true);
    }
    if (selected && date) {
      setIsLoading(true);
      const res = await addNewTrip(selected.id, selected.label, userId, date);
      if (res) {
        setIsLoading(false);
        toast.error(res.message);
      }
    }
  };

  useEffect(() => {
    // Once fetch is completed, if there is a buffered press, start new trip
    const newTrip = async (
      locationId: string,
      name: string,
      userId: string,
      date: DateRange,
    ) => {
      const res = await addNewTrip(locationId, name, userId, date);
      if (res) {
        setIsLoading(false);
        toast.error(res.message);
      }
    };

    if (bufferedPress.current && selected && date) {
      newTrip(selected.id, selected.label, userId, date);
    }
    bufferedPress.current = false;
  }, [date, selected, userId]);

  return (
    <>
      <div className="w-full space-y-2">
        <AutoComplete
          async={{
            listItems: autocomplete,
            listElement: (data) => (
              <div>
                {data.label}
                {data.subtitle && (
                  <div className="text-xs text-slate-500">{data.subtitle}</div>
                )}
              </div>
            ),
            listValueFunction: (data) => data.id,
            inputReplaceFunction: (data) => data.label,
            onSelectItem: (data) => {
              setSelectedId(data);
              setError((prev) => ({ calendar: prev.calendar }));
            },
          }}
          emptyMessage="No results found!"
          value={value}
          setValue={setValue}
          onUserInput={(string) => {
            debounce(() => setDebouncedValue(string));
          }}
          inputLarge={true}
          placeholder="Where to?"
          inputLeft={<IconWorldSearch />}
        />
        {!!error.search && (
          <p className="text-center text-sm font-medium text-red-500">
            {error.search}
          </p>
        )}
      </div>
      <Popover>
        <div className="w-full space-y-2">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="large"
              className={
                "w-full justify-between rounded-xl bg-white py-3 font-normal hover:bg-slate-50 [&_svg]:size-6"
              }
            >
              <IconCalendarWeek />
              <div className="w-full text-left text-slate-900">
                {date && date.from ? (
                  <DateHydration date={date.from} />
                ) : (
                  <span className="text-slate-400">Start</span>
                )}
              </div>
              <Separator orientation="vertical" className="mx-1" />
              <div className="w-full text-left text-slate-900">
                {date && date.to ? (
                  <DateHydration date={date.to} />
                ) : (
                  <span className="text-slate-400">End</span>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          {!date && !!error.calendar && (
            <p className="text-center text-sm font-medium text-red-500">
              {error.calendar}
            </p>
          )}
        </div>
        <PopoverContent className="w-auto p-0">
          <Calendar
            disabled={{ before: new Date() }}
            mode="range"
            required
            selected={date}
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
        </PopoverContent>
      </Popover>
      <Button size="large" onClick={validateTrip} loading={isLoading}>
        Get Started!
      </Button>
    </>
  );
}
