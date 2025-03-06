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
import { ApiResponse, Coordinates, DistanceType } from "@/server/types";
import { IconBike, IconCar, IconWalk } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { memo } from "react";
import { toast } from "sonner";
import { travelTimesAtom, tripDetailsAtom, tripPlacesAtom } from "../atoms";

type TravelTimeSelectProps = {
  isInDay: string | number;
  fromId: string;
  fromCoords: Coordinates;
  toId: string;
  toCoords: Coordinates;
  isDragging: boolean;
};

export const TravelTimeSelect = memo(
  ({
    isInDay,
    fromId,
    fromCoords,
    toId,
    toCoords,
    isDragging,
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

    const handleValueChange = (value: "walk" | "drive" | "cycle") => {
      if (!data) return;
      const duration = getTravelTimesFromObject(value, data);
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
      updatePreferredTravelMode(fromId, toId, tripId, value).then((data) => {
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
          [toId]: {
            drive: travelTimesNew.data.drive,
            cycle: travelTimesNew.data.cycle,
            walk: travelTimesNew.data.walk,
          },
        },
      }));
      return travelTimesNew.data;
    };

    useQuery({
      queryKey: ["traveltime", fromId, toId],
      queryFn: () => getTravelTime(fromId, fromCoords, toId, toCoords, tripId),
      enabled:
        !isDragging && (!travelTimes[fromId] || !travelTimes[fromId][toId]),
      meta: {
        errorMessage: "Unable to fetch travel time information",
      },
    });
    return (
      <Select
        defaultValue={data?.mode ?? "drive"}
        onValueChange={handleValueChange}
      >
        <SelectTrigger variant="ghost" size="small" className="mt-2">
          {!data && <Spinner />}
          <SelectValue placeholder="Transport mode" />
        </SelectTrigger>
        <SelectContent>
          {!data && (
            <span className="flex h-24 items-center justify-center">
              <Spinner />
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
