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
import {
  AutocompleteReturn,
  BoundsReturn,
  getGoogleMapsLocationBounds,
  googleMapsAutocomplete,
} from "@/server/actions";
import { IconCalendarWeek, IconWorldSearch } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { v4 } from "uuid";

export default function NewTrip() {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const isLarge = useMediaQuery("(min-width: 768px)");

  const session = useRef(v4());

  const [value, setValue] = useState("");
  const [autocomplete, setAutocomplete] = useState<AutocompleteReturn>([]);
  const [selected, setSelected] = useState<BoundsReturn>();

  const debounce = useDebouncedFunction();

  const getAutocompleteData = async (query: string) => {
    if (query) {
      const data = await googleMapsAutocomplete(query, session.current);
      if (data.status === "success") {
        setAutocomplete(data.data);
      }
    }
  };

  const getLocationData = async (location: string) => {
    const data = await getGoogleMapsLocationBounds(location, session.current);
    session.current = v4();
    if (data.status === "success") {
      setSelected(data.data);
    }
  };

  return (
    <>
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
        inputReplaceFunction={(value) =>
          autocomplete.find((data) => data.id === value)!.label
        }
        emptyMessage="No results found!"
        value={value}
        setValue={setValue}
        onUserInput={(string) => {
          if (!string) setAutocomplete([]);
          setSelected(undefined);
          debounce(() => getAutocompleteData(string));
        }}
        onSelectItem={getLocationData}
        inputLarge={true}
        placeholder="Where to?"
        inputLeft={<IconWorldSearch />}
      />
      <Popover>
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
      <Button size="large" disabled={!selected || !date}>
        Get Started!
      </Button>
    </>
  );
}
