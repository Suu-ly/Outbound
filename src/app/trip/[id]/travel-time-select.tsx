"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import { getTravelTimesFromObject } from "@/lib/utils";
import { updatePreferredTravelMode } from "@/server/actions";
import type { SelectTripTravelTime } from "@/server/db/schema";
import { ApiResponse, Coordinates, DistanceType } from "@/server/types";
import { IconBike, IconCar, IconWalk } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { memo, useState } from "react";
import { toast } from "sonner";
import { travelTimesAtom, tripDetailsAtom, tripPlacesAtom } from "../atoms";

type TravelTimeSelectProps = {
  isInDay: string | number;
  fromId: string;
  fromCoords: Coordinates;
  toId: string;
  toCoords: Coordinates;
  isDragging?: boolean;
  isAdmin?: boolean;
};

export const TravelTimeSelect = memo(
  ({
    isInDay,
    fromId,
    fromCoords,
    toId,
    toCoords,
    isDragging,
    isAdmin = true,
  }: TravelTimeSelectProps) => {
    const tripDetails = useAtomValue(tripDetailsAtom);
    const shouldRoundUp = tripDetails.roundUpTime;
    const tripId = tripDetails.id;
    const [travelTimes, setTravelTimes] = useAtom(travelTimesAtom);
    const setPlaces = useSetAtom(tripPlacesAtom);
    const data =
      travelTimes[fromId] && travelTimes[fromId][toId]
        ? travelTimes[fromId][toId]
        : undefined;
    const [value, setValue] = useState<SelectTripTravelTime["type"]>(
      data?.mode ?? "drive",
    );

    const handleValueChange = (newValue: "walk" | "drive" | "cycle") => {
      if (!data) return;
      setValue(newValue);
      const duration = getTravelTimesFromObject(newValue, data);
      setPlaces((prev) => ({
        ...prev,
        [isInDay]: prev[isInDay].map((place) => {
          if (place.placeInfo.placeId !== fromId) return place;
          return {
            ...place,
            userPlaceInfo: {
              ...place.userPlaceInfo,
              timeToNextPlace: duration,
            },
          };
        }),
      }));
      setTravelTimes((prev) => ({
        ...prev,
        [fromId]: {
          ...prev[fromId],
          [toId]: {
            ...prev[fromId][toId],
            mode: newValue,
          },
        },
      }));
      updatePreferredTravelMode(fromId, toId, tripId, newValue).then((data) => {
        if (data.status === "error") {
          toast.error(data.message);
        }
      });
    };

    const getTravelTime = async (
      fromId: string,
      fromCoords: Coordinates,
      toId: string,
      toCoords: Coordinates,
      tripId: string,
    ) => {
      const searchParams = new URLSearchParams([
        ["fromId", fromId],
        ["fromCoords", `${fromCoords.longitude},${fromCoords.latitude}`],
        ["toId", toId],
        ["toCoords", `${toCoords.longitude},${toCoords.latitude}`],
        ["tripId", tripId],
        ["mode", value],
      ]);

      const travelTimesNew = await fetch(
        `/api/places/travel-time?${searchParams.toString()}`,
      )
        .then((response) => response.json())
        .then(
          (data) =>
            data as ApiResponse<{
              drive: DistanceType;
              cycle: DistanceType;
              walk: DistanceType;
            }>,
        );

      if (travelTimesNew.status === "error")
        throw new Error(travelTimesNew.message);

      setTravelTimes((prev) => ({
        ...prev,
        [fromId]: {
          ...prev[fromId],
          [toId]: {
            drive: travelTimesNew.data.drive,
            cycle: travelTimesNew.data.cycle,
            walk: travelTimesNew.data.walk,
            mode: value,
          },
        },
      }));
      const duration = getTravelTimesFromObject(value, travelTimesNew.data);
      setPlaces((prev) => ({
        ...prev,
        [isInDay]: prev[isInDay].map((place) => {
          if (place.placeInfo.placeId !== fromId) return place;
          return {
            ...place,
            userPlaceInfo: {
              ...place.userPlaceInfo,
              timeToNextPlace: duration,
            },
          };
        }),
      }));
      return travelTimesNew.data;
    };

    const { isFetching } = useQuery({
      queryKey: ["traveltime", fromId, toId],
      queryFn: () => getTravelTime(fromId, fromCoords, toId, toCoords, tripId),
      enabled:
        !isDragging &&
        (!travelTimes[fromId] ||
          !travelTimes[fromId][toId] ||
          !travelTimes[fromId][toId].mode),
      meta: {
        errorMessage: "Unable to fetch travel time information",
      },
    });

    if (!isAdmin && (data || isFetching))
      return (
        <div className="mt-2 flex h-8 w-full items-center gap-1 rounded-lg px-2 text-left text-sm font-medium text-slate-700">
          {data ? (
            <>
              {value === "drive" && <IconCar />}
              {value === "cycle" && <IconBike />}
              {value === "walk" && <IconWalk />}
              {data[value].route
                ? (shouldRoundUp
                    ? data[value].durationDisplayRoundUp
                    : data[value].durationDisplay) +
                  " · " +
                  data[value].distanceDisplay
                : "No route"}
            </>
          ) : (
            <Spinner />
          )}
        </div>
      );
    if (!isAdmin && !data && !isFetching)
      return (
        <div className="mt-2 flex h-8 w-full items-center gap-1 rounded-lg px-2 text-left text-sm font-medium text-slate-500">
          No route data available.
        </div>
      );

    return (
      <Select defaultValue={value} onValueChange={handleValueChange}>
        <SelectTrigger variant="ghost" size="small" className="mt-2">
          {!data && isFetching && <Spinner />}
          {!data && !isFetching && (
            <span className="text-sm text-slate-700">
              Unable to fetch travel time data.
            </span>
          )}
          <SelectValue placeholder="Transport mode" />
        </SelectTrigger>
        <SelectContent>
          {!data && isFetching && (
            <span className="flex h-24 items-center justify-center">
              <Spinner />
            </span>
          )}
          {!data && !isFetching && (
            <span className="flex h-24 items-center justify-center text-sm text-slate-700">
              Unable to fetch travel time data. Please try again later.
            </span>
          )}
          {data && (
            <>
              <SelectItem value="drive" disabled={!data.drive.route}>
                <span className="flex items-center gap-2">
                  <IconCar />
                  {data.drive.route
                    ? (shouldRoundUp
                        ? data.drive.durationDisplayRoundUp
                        : data.drive.durationDisplay) +
                      " · " +
                      data.drive.distanceDisplay
                    : "No route"}
                </span>
              </SelectItem>
              <SelectItem value="cycle" disabled={!data.cycle.route}>
                <span className="flex items-center gap-2">
                  <IconBike />
                  {data.cycle.route
                    ? (shouldRoundUp
                        ? data.cycle.durationDisplayRoundUp
                        : data.cycle.durationDisplay) +
                      " · " +
                      data.cycle.distanceDisplay
                    : "No route"}
                </span>
              </SelectItem>
              <SelectItem value="walk" disabled={!data.walk.route}>
                <span className="flex items-center gap-2">
                  <IconWalk />
                  {data.walk.route
                    ? (shouldRoundUp
                        ? data.walk.durationDisplayRoundUp
                        : data.walk.durationDisplay) +
                      " · " +
                      data.walk.distanceDisplay
                    : "No route"}
                </span>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    );
  },
);
TravelTimeSelect.displayName = "TravelTimeSelect";

export default TravelTimeSelect;
