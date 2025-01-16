"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { IconChevronLeft } from "@tabler/icons-react";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 sm:p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4 relative",
        month: "space-y-4",
        month_caption: "flex justify-center mt-1 items-center",
        caption_label: "text-sm font-medium text-slate-700",
        nav: "flex items-center absolute top-0 inset-x-0 justify-between",
        button_previous:
          "inline-flex items-center justify-center whitespace-nowrap rounded-full ring-offset-white text-slate-700 active:ring-slate-200 hover:bg-slate-100 hover:text-slate-900 transition active:ring-2 active:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:pointer-events-none disabled:opacity-70 size-8 [&_svg]:size-5",
        button_next:
          "inline-flex items-center justify-center whitespace-nowrap rotate-180 rounded-full ring-offset-white text-slate-700 active:ring-slate-200 hover:bg-slate-100 hover:text-slate-900 transition active:ring-2 active:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:pointer-events-none disabled:opacity-70 size-8 [&_svg]:size-5",
        month_grid: "w-full border-separate border-spacing-y-1",
        weekday: "text-slate-500 rounded-full w-9 sm:w-10 font-normal text-sm",
        day: "group text-center text-sm p-1 relative aria-selected:bg-slate-100 first:[aria-selected]:rounded-l-full last:aria-selected:rounded-r-full focus-within:relative focus-within:z-20",
        day_button:
          "inline-flex items-center justify-center text-slate-700 hover:text-slate-900 whitespace-nowrap rounded-full hover:bg-slate-100 transition size-8 sm:size-9 group-[.highlight]:!bg-brand-600 group-[.highlight]:hover:!bg-brand-600/90 group-[.highlight]:!text-zinc-50 group-[.highlight]:hover:!text-zinc-50 group-[.middle]:hover:bg-slate-200 group-[.today]:bg-brand-100 group-[.today]:hover:bg-brand-200 group-[.today]:text-brand-700 group-[.today]:hover:text-brand-900 ring-offset-white active:ring-slate-200 active:ring-2 active:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:pointer-events-none disabled:opacity-70",
        range_end: "highlight rounded-r-full",
        range_start: "highlight rounded-l-full",
        range_middle: "middle aria-selected:text-slate-900",
        today: "today",
        outside:
          "day-outside opacity-70 aria-selected:opacity-80 aria-selected:bg-slate-100/50",
        disabled: "text-slate-500 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, ...props }) => (
          <IconChevronLeft className={cn("size-5", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
