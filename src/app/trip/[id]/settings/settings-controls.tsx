"use client";

import TimePicker from "@/components/time-picker";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn, digitStringToMins, minsTo24HourFormat } from "@/lib/utils";
import {
  updateTripEndTime,
  updateTripPrivacy,
  updateTripRoundUpTime,
  updateTripStartTime,
} from "@/server/actions";
import { useAtom } from "jotai";
import {
  ComponentPropsWithoutRef,
  forwardRef,
  ReactNode,
  useCallback,
  useTransition,
} from "react";
import { toast } from "sonner";
import { tripDetailsAtom } from "../../atoms";

const SettingsItem = forwardRef<
  HTMLDivElement,
  {
    title: string;
    description?: string;
    htmlFor?: string;
    children: ReactNode;
  } & ComponentPropsWithoutRef<"div">
>(({ title, description, children, className, htmlFor, ...rest }, ref) => {
  const Comp = htmlFor ? "label" : "div";
  return (
    <div
      ref={ref}
      {...rest}
      className={cn("group space-y-3 rounded-xl bg-white p-3", className)}
    >
      <Comp
        className="flex grow items-center justify-between gap-3"
        htmlFor={htmlFor}
      >
        <h4 className="text-slate-900">{title}</h4>
        {children}
      </Comp>
      <Separator className="-mx-3 w-[calc(100%+1.5rem)] bg-gray-100" />
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
});

SettingsItem.displayName = "SettingsItem";

const DayStartTime = () => {
  const [tripDetails, setTripDetails] = useAtom(tripDetailsAtom);
  const currentStartTime = digitStringToMins(tripDetails.startTime);
  const [isLoading, startLoading] = useTransition();
  const handleTimeChange = useCallback(
    (close: () => void, hours: number, minutes: number) => {
      const newTime = minsTo24HourFormat(hours * 60 + minutes).value;
      if (newTime === tripDetails.startTime) return;
      startLoading(async () => {
        const res = await updateTripStartTime(tripDetails.id, newTime);
        if (res.status === "error") toast.error(res.message);
        else {
          setTripDetails((prev) => ({ ...prev, startTime: newTime }));
          toast.success("Default start time updated successfully!");
          close();
        }
      });
    },
    [setTripDetails, tripDetails],
  );

  return (
    <TimePicker
      header="Select default day start time"
      description="Change the default time your day will start at. All days without a custom day start time will start at this time."
      startHours={Math.floor(currentStartTime / 60)}
      startMinutes={currentStartTime % 60}
      onConfirm={handleTimeChange}
      loading={isLoading}
    >
      <SettingsItem
        title="Default day start time"
        description="Days will start at this time by default."
        className="cursor-pointer ring-offset-gray-50 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.code === "Enter" || e.code === "Space") {
            e.currentTarget.click();
          }
        }}
      >
        <div className="flex h-8 w-14 items-center justify-center rounded-full bg-slate-100 font-medium text-slate-900 transition-colors group-hover:bg-slate-200">
          {tripDetails.startTime}
        </div>
      </SettingsItem>
    </TimePicker>
  );
};

const DayEndTime = () => {
  const [tripDetails, setTripDetails] = useAtom(tripDetailsAtom);
  const currentEndTime = digitStringToMins(tripDetails.endTime);
  const [isLoading, startLoading] = useTransition();
  const handleTimeChange = useCallback(
    (close: () => void, hours: number, minutes: number) => {
      const newTime = minsTo24HourFormat(hours * 60 + minutes).value;
      if (newTime === tripDetails.endTime) return;
      startLoading(async () => {
        const res = await updateTripEndTime(tripDetails.id, newTime);
        if (res.status === "error") toast.error(res.message);
        else {
          setTripDetails((prev) => ({ ...prev, endTime: newTime }));
          toast.success("Day end time updated successfully!");
          close();
        }
      });
    },
    [tripDetails, setTripDetails],
  );

  return (
    <TimePicker
      header="Select default day end time"
      description="Generated itineraries will attempt to end the day around this time."
      startHours={Math.floor(currentEndTime / 60)}
      startMinutes={currentEndTime % 60}
      onConfirm={handleTimeChange}
      loading={isLoading}
    >
      <SettingsItem
        title="Default day end time"
        description="Generated itineraries will end around this time."
        className="cursor-pointer ring-offset-gray-50 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.code === "Enter" || e.code === "Space") {
            e.currentTarget.click();
          }
        }}
      >
        <div className="flex h-8 w-14 items-center justify-center rounded-full bg-slate-100 font-medium text-slate-900 transition-colors group-hover:bg-slate-200">
          {tripDetails.endTime}
        </div>
      </SettingsItem>
    </TimePicker>
  );
};

const RoundUpTravelTime = () => {
  const [tripDetails, setTripDetails] = useAtom(tripDetailsAtom);
  const [isLoading, startLoading] = useTransition();
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      if (checked === tripDetails.roundUpTime) return;
      startLoading(async () => {
        const res = await updateTripRoundUpTime(tripDetails.id, checked);
        if (res.status === "error") toast.error(res.message);
        else {
          setTripDetails((prev) => ({ ...prev, roundUpTime: checked }));
          toast.success(
            "Trip travel time estimate preference updated successfully!",
          );
        }
      });
    },
    [tripDetails, setTripDetails],
  );

  return (
    <SettingsItem
      title="Round up travel time"
      description="Round up travel time estimates to the nearest 5, 10 or 15 minutes based on the distance travelled. Disable this to use exact travel time estimates."
      htmlFor="travel-time-switch"
    >
      <Switch
        id="travel-time-switch"
        disabled={isLoading}
        defaultChecked={tripDetails.roundUpTime}
        onCheckedChange={handleCheckedChange}
      />
    </SettingsItem>
  );
};

const PrivateTrip = () => {
  const [tripDetails, setTripDetails] = useAtom(tripDetailsAtom);
  const [isLoading, startLoading] = useTransition();
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      if (checked === tripDetails.private) return;
      startLoading(async () => {
        const res = await updateTripPrivacy(tripDetails.id, checked);
        if (res.status === "error") toast.error(res.message);
        else {
          setTripDetails((prev) => ({ ...prev, private: checked }));
          toast.success("Trip privacy setting updated successfully!");
        }
      });
    },
    [tripDetails, setTripDetails],
  );

  return (
    <SettingsItem
      title="Private trip"
      description="When set to public, others can view your trip details."
      htmlFor="privacy-switch"
    >
      <Switch
        id="privacy-switch"
        disabled={isLoading}
        checked={tripDetails.private}
        onCheckedChange={handleCheckedChange}
      />
    </SettingsItem>
  );
};

export { DayEndTime, DayStartTime, PrivateTrip, RoundUpTravelTime };
