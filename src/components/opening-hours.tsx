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
};

export default function OpeningHours({
  highligtedDay,
  hours,
}: OpeningHoursProps) {
  const [value, setValue] = useState("");

  if (!hours)
    return (
      <div className="space-x-3 px-4 py-2 hover:bg-slate-100">
        <IconClock size={20} className="shrink-0 text-slate-600" />
        No opening hours provided
      </div>
    );

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      value={value}
      onValueChange={setValue}
    >
      <AccordionItem value="hours" className="border-0">
        <AccordionTrigger className="gap-3 font-normal">
          <div className="flex gap-3">
            <IconClock size={20} className="shrink-0 text-slate-600" />
            {value ? "Opening Hours" : hours[highligtedDay].split(": ")[1]}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-2 pl-12 pr-4 pt-1 text-sm text-slate-700">
          <div className="space-y-2">
            {hours.map((day, index) => {
              const splitDay = day.split(": ");
              return (
                <div
                  key={index}
                  className={cn(
                    "flex gap-4",
                    highligtedDay === index && "font-medium text-slate-900",
                  )}
                >
                  <div className="w-20">{splitDay[0]}</div>
                  <div>{splitDay[1]}</div>
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
