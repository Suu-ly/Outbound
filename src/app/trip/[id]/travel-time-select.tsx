"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiResponse, Coordinates, DistanceType } from "@/server/types";
import { IconBike, IconCar, IconWalk } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";

type TravelTimeSelectProps = {
  fromId: string;
  fromCoords: Coordinates;
  toId: string;
  toCoords: Coordinates;
  tripId: string;
  isDragging: boolean;
};

export default function TravelTimeSelect({
  fromId,
  fromCoords,
  toId,
  toCoords,
  tripId,
  isDragging,
}: TravelTimeSelectProps) {
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

    const travelTimes = await fetch(
      `/api/places/travel-time?${searchParams.toString()}`,
    )
      .then((response) => response.json())
      .then(
        (data) =>
          data as ApiResponse<{
            from: string;
            to: string;
            drive: DistanceType;
            cycle: DistanceType;
            walk: DistanceType;
          }>,
      );

    if (travelTimes.status === "error") throw new Error(travelTimes.message);

    return travelTimes.data;
  };

  const { data } = useQuery({
    queryKey: ["traveltime", fromId, toId],
    queryFn: () => getTravelTime(fromId, fromCoords, toId, toCoords, tripId),
    enabled: !isDragging,
    meta: {
      errorMessage: "Unable to fetch travel time information",
    },
  });
  return (
    <Select defaultValue="drive">
      <SelectTrigger variant="ghost" size="small" className="mt-2">
        <SelectValue placeholder="Transport mode" />
      </SelectTrigger>
      <SelectContent>
        {data && (
          <>
            <SelectItem value="drive" disabled={!data.drive.route}>
              <span className="flex items-center gap-2">
                <IconCar />
                {data.drive.route
                  ? data.drive.durationDisplay +
                    " · " +
                    data.drive.distanceDisplay
                  : "No route"}
              </span>
            </SelectItem>
            <SelectItem value="cycle" disabled={!data.cycle.route}>
              <span className="flex items-center gap-2">
                <IconBike />
                {data.cycle.route
                  ? data.cycle.durationDisplay +
                    " · " +
                    data.cycle.distanceDisplay
                  : "No route"}
              </span>
            </SelectItem>
            <SelectItem value="walk" disabled={!data.walk.route}>
              <span className="flex items-center gap-2">
                <IconWalk />
                {data.walk.route
                  ? data.walk.durationDisplay +
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
}
