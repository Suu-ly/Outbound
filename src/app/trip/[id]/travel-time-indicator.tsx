import { digitStringToMins, minsTo24HourFormat } from "@/lib/utils";
import { useAtomValue } from "jotai";
import { memo } from "react";
import { computedTravelTimesAtom, tripDetailsAtom } from "../atoms";

type TravelTimeIndicatorProps = {
  isInDay: number;
  index: number;
  startTime: string;
  shouldHide: boolean;
  bottom?: boolean;
  startTimeClick?: (isInDay: number) => void;
};

const TravelTimeIndicator = memo(
  ({
    isInDay,
    index,
    startTime,
    shouldHide,
    bottom,
    startTimeClick,
  }: TravelTimeIndicatorProps) => {
    const defaultStartTime = useAtomValue(tripDetailsAtom).startTime;
    const computedTimes = useAtomValue(computedTravelTimesAtom);

    if (shouldHide) return null; // Avoid doing any calculation while dragging

    const baseMins =
      startTime === "auto"
        ? digitStringToMins(defaultStartTime)
        : digitStringToMins(startTime);

    const getTime = () => {
      return computedTimes[isInDay][index] !== null
        ? minsTo24HourFormat(baseMins + computedTimes[isInDay][index])
        : null;
    };

    const time = getTime();

    if (time === null) return null;

    const Comp = index === 0 ? "button" : "div";

    return (
      <Comp
        aria-label={`Arrive at ${time.value}`}
        onClick={
          index === 0 && startTimeClick
            ? () => startTimeClick(isInDay)
            : undefined
        }
        className={`absolute -left-px ${bottom ? "bottom-3" : "top-10"} flex w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 border-zinc-50 bg-white text-sm font-medium ${time.overflow ? "text-rose-600" : "text-slate-700"} ${index === 0 ? "ring-offset-zinc-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2" : ""}`}
      >
        {time.value}
      </Comp>
    );
  },
);

TravelTimeIndicator.displayName = "TravelTimeIndicator";

export default TravelTimeIndicator;
