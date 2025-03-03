import { digitStringToHours, hoursTo24HourFormat } from "@/lib/utils";
import { PlaceDataEntry } from "@/server/types";
import { useAtomValue } from "jotai";
import { memo } from "react";
import { tripDetailsAtom } from "../atoms";

type TravelTimeIndicatorProps = {
  places: PlaceDataEntry[];
  index: number;
  startTime: string;
  shouldHide: boolean;
  bottom?: boolean;
};

const TravelTimeIndicator = memo(
  ({
    places,
    index,
    startTime,
    shouldHide,
    bottom,
  }: TravelTimeIndicatorProps) => {
    const tripDetails = useAtomValue(tripDetailsAtom);

    if (shouldHide) return null; // Avoid doing any calculation while dragging

    const defaultStartTime = tripDetails.startTime;
    const shouldRoundUp = tripDetails.roundUpTime;

    // This should not have to be calculated again and again, move to derived atom when possible
    const getTime = () => {
      let hourOfDay =
        startTime === "auto"
          ? digitStringToHours(defaultStartTime)
          : digitStringToHours(startTime);
      for (let i = 0; i < index; i++) {
        hourOfDay += shouldRoundUp
          ? Math.ceil(places[i].userPlaceInfo.timeSpent / 0.25) * 0.25
          : places[i].userPlaceInfo.timeSpent;
      }
      return hoursTo24HourFormat(hourOfDay);
    };

    const time = getTime();

    const Comp = index === 0 ? "button" : "div";

    return (
      <Comp
        aria-label={`Arrive at ${time.value}`}
        className={`absolute left-0 ${bottom ? "bottom-3" : "top-10"} flex w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 border-zinc-50 bg-white text-sm font-medium ${time.overflow ? "text-rose-600" : "text-slate-700"} ${index === 0 ? "ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2" : ""}`}
      >
        {time.value}
      </Comp>
    );
  },
);

TravelTimeIndicator.displayName = "TravelTimeIndicator";

export default TravelTimeIndicator;
