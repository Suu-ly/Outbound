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
import { useMediaQuery } from "@/lib/use-media-query";
import { IconCalendarWeek, IconWorldSearch } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { v4 } from "uuid";

export default function NewTrip() {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const isLarge = useMediaQuery("(min-width: 768px)");

  const session = useRef(v4());

  const [value, setValue] = useState("");

  useEffect(() => {}, []);

  const FRAMEWORKS = [
    {
      value: "next.js",
      label: "Next.js",
    },
    {
      value: "sveltekit",
      label: "SvelteKit",
    },
    {
      value: "nuxt.js",
      label: "Nuxt.js",
    },
    {
      value: "remix",
      label: "Remix",
    },
    {
      value: "astro",
      label: "Astro",
    },
    {
      value: "wordpress",
      label: "WordPress",
    },
    {
      value: "express.js",
      label: "Express.js",
    },
    {
      value: "nest.js",
      label: "Nest.js",
    },
  ];

  return (
    <>
      <AutoComplete
        listItems={FRAMEWORKS}
        listElement={(data) => (
          <div>
            {data.label}{" "}
            <span className="text-xs text-slate-500">{data.value}</span>
          </div>
        )}
        listValueFunction={(data) => data.value}
        emptyMessage="No results found"
        value={value}
        setValue={setValue}
        onValueChange={(string) => {
          toast(string);
        }}
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
      <Button size="large">Get Started!</Button>
    </>
  );
}
