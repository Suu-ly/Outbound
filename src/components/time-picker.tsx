"use client";

import { useRef } from "react";
import { Carousel, CarouselTimeSlider } from "./ui/carousel";
import DrawerDialog, { DrawerDialogProps } from "./ui/drawer-dialog";

export default function TimePicker({
  children,
  startHours,
  startMinutes,
  onConfirm,
  hoursLength = 24,
  hoursLoop = true,
  minutesLoop = true,
  isDuration = false,
  ...rest
}: Omit<DrawerDialogProps, "onMainAction" | "content" | "mainActionLabel"> & {
  onConfirm: (close: () => void, hours: number, minutes: number) => void;
  startHours: number;
  startMinutes: number;
  hoursLength?: number;
  hoursLoop?: boolean;
  minutesLoop?: boolean;
  isDuration?: boolean;
}) {
  const hours = useRef(startHours);
  const minutes = useRef(startMinutes);
  return (
    <DrawerDialog
      {...rest}
      mainActionLabel="Confirm"
      onMainAction={(close) => {
        onConfirm(close, hours.current, minutes.current);
      }}
      content={
        <div className="relative flex items-center justify-center gap-4 before:pointer-events-none before:absolute before:top-1/2 before:z-10 before:h-px before:w-full before:-translate-y-5 before:bg-slate-200 after:pointer-events-none after:absolute after:top-1/2 after:z-10 after:h-px after:w-full after:translate-y-5 after:bg-slate-200">
          <Carousel
            className="rounded-lg"
            orientation="vertical"
            opts={{
              loop: hoursLoop,
              skipSnaps: true,
              align: "center",
              startIndex: startHours,
              containScroll: false,
            }}
          >
            <CarouselTimeSlider
              type="hours"
              length={hoursLength}
              onSelect={(num) => (hours.current = num)}
            />
          </Carousel>
          {isDuration && (
            <span className="-ml-3 pr-3 pt-1 text-sm font-medium text-slate-900">
              hours
            </span>
          )}
          {!isDuration && (
            <span className="w-6 text-center font-medium text-slate-900">
              :
            </span>
          )}
          <Carousel
            orientation="vertical"
            className="rounded-lg"
            opts={{
              loop: minutesLoop,
              skipSnaps: true,
              align: "center",
              startIndex: Math.floor(startMinutes / 5),
            }}
          >
            <CarouselTimeSlider
              type="minutes"
              onSelect={(num) => (minutes.current = num)}
            />
          </Carousel>
          {isDuration && (
            <span className="-ml-3 pr-3 pt-1 text-sm font-medium text-slate-900">
              min
            </span>
          )}
        </div>
      }
    >
      {children}
    </DrawerDialog>
  );
}
