"use client";

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
import { ApiResponse, AutocompleteReturn } from "@/server/types";
import { IconCalendarWeek, IconWorldSearch } from "@tabler/icons-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { v4 } from "uuid";

export default function NewTrip() {
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
    if (data.status === "success") {
      return data.data;
    }
    return [];
  };

  const { data: autocomplete } = useQuery({
    queryKey: ["autocomplete", debouncedValue],
    queryFn: () => getAutocompleteData(debouncedValue),
    placeholderData: keepPreviousData,
    enabled: debouncedValue !== "",
  });

  const getLocationData = async (
    selectedId: AutocompleteReturn | undefined,
  ) => {
    if (!selectedId) return undefined;
    const urlParams = new URLSearchParams([
      ["id", selectedId.id],
      ["name", selectedId.label],
      ["session", session.current],
    ]);
    if (selectedId.subtitle) urlParams.set("country", selectedId.subtitle);
    const data = await fetch(`/api/places/location?${urlParams.toString()}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<string>);
    if (data.status === "error") {
      throw new Error(data.message);
    }
    session.current = v4();
    if (data.status === "success") {
      return data.data;
    }
    return undefined;
  };

  const { isFetching, data: selected } = useQuery({
    queryKey: ["selected", selectedId?.id],
    queryFn: () => getLocationData(selectedId),
    enabled: !!selectedId,
  });

  const validateTrip = () => {
    if (!date)
      setError((prev) => ({
        ...prev,
        calendar: "Please select dates for your trip!",
      }));
    // No fetch in progress, so location selected
    if (!selected && !isFetching)
      setError((prev) => ({ ...prev, search: "Please select a location!" }));

    // Fetch in progress and date selected, we optimisticly update UI
    if (isFetching && date) {
      bufferedPress.current = true;
      setIsLoading(true);
    }
    if (selected && date) {
      setIsLoading(true);
      // TODO start new trip
    }
  };

  useEffect(() => {
    // Once fetch is completed, if there is a buffered press, start new trip
    if (bufferedPress.current) {
      console.log("Buffered");
      // TODO start new trip
    }
    bufferedPress.current = false;
  }, [selected]);

  return (
    <>
      <div className="w-full space-y-2">
        <AutoComplete
          listItems={autocomplete}
          listElement={(data) => (
            <div>
              {data.label}
              {data.subtitle && (
                <div className="text-xs text-slate-500">{data.subtitle}</div>
              )}
            </div>
          )}
          listValueFunction={(data) => data.id}
          inputReplaceFunction={(data) => data.label}
          emptyMessage="No results found!"
          value={value}
          setValue={setValue}
          onUserInput={(string) => {
            debounce(() => setDebouncedValue(string));
          }}
          onSelectItem={(data) => {
            setSelectedId(data);
            setError((prev) => ({ calendar: prev.calendar }));
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
                  date.from.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })
                ) : (
                  <span className="text-slate-400">Start</span>
                )}
              </div>
              <Separator orientation="vertical" className="mx-1" />
              <div className="w-full text-left text-slate-900">
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
      <Button size="large" onClick={validateTrip} loading={isLoading}>
        Get Started!
      </Button>
    </>
  );
}
