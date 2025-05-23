"use client";

import { cn } from "@/lib/utils";
import { IconClock } from "@tabler/icons-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

type OpeningHoursProps = {
  highligtedDay: number;
  hours?: string[];
  collapsible?: boolean;
  contentClassName?: string;
  className?: string;
};

export default function OpeningHours({
  highligtedDay,
  hours,
  collapsible = true,
  contentClassName,
  className,
}: OpeningHoursProps) {
  const [value, setValue] = useState(collapsible ? "" : "hours");

  const dayIndex = (((highligtedDay - 1) % 7) + 7) % 7; //For negative numbers

  if (!hours)
    return (
      <div
        className={cn(
          "flex gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100",
          !collapsible && "pointer-events-none",
          className,
        )}
      >
        <IconClock size={20} className="shrink-0 text-slate-600" />
        No opening hours provided
      </div>
    );

  return (
    <Accordion
      type="single"
      collapsible={collapsible}
      className="w-full"
      value={value}
      onValueChange={setValue}
    >
      <AccordionItem value="hours" className="border-0">
        <AccordionTrigger
          collapsible={collapsible}
          disabled={!collapsible}
          className={cn(
            "gap-3 ring-offset-gray-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none",
            className,
          )}
        >
          <IconClock size={20} className="shrink-0 text-slate-600" />
          <span className="grow text-left font-normal text-slate-700">
            {value ? "Opening Hours" : hours[dayIndex].split(": ")[1]}
          </span>
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            "space-y-2 pb-2 pl-12 pr-4 pt-1 text-sm text-slate-700",
            contentClassName,
          )}
        >
          {hours.map((day, index) => {
            const splitDay = day.split(": ");
            return (
              <div
                key={index}
                className={cn(
                  "flex gap-4",
                  dayIndex === index && "font-medium text-slate-900",
                  dayIndex === index &&
                    splitDay[1] === "Closed" &&
                    "text-rose-600",
                )}
              >
                <span className="w-20 shrink-0">{splitDay[0]}</span>
                <span>{splitDay[1]}</span>
              </div>
            );
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
