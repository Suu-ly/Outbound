"use client";

import { Input } from "@/components/ui/input";
import { defaultTripPlaceUserInfo, insertAfter } from "@/lib/utils";
import { setPlaceAsInterested } from "@/server/actions";
import { PlaceDataPlaceInfo } from "@/server/types";
import { IconSearch } from "@tabler/icons-react";
import { defaultFilter } from "cmdk";
import { useSetAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { tripPlacesAtom } from "../../atoms";
import PlaceDetailsSkipped from "./place-details-skipped";

export default function SkipPlaceSearch({
  skippedPlacesInitial,
  tripId,
}: {
  skippedPlacesInitial: PlaceDataPlaceInfo[];
  tripId: string;
}) {
  const [skippedPlaces, setSkippedPlaces] = useState(skippedPlacesInitial);
  const [value, setValue] = useState("");
  const setPlaces = useSetAtom(tripPlacesAtom);

  const scoredItems = useMemo(
    () =>
      defaultFilter
        ? skippedPlaces
            .map((item) => {
              const score = value ? defaultFilter!(item.displayName, value) : 1;
              if (score === 0) return;
              return [item, score] as const;
            })
            .filter((val) => !!val)
            .sort((a, b) => b[1] - a[1])
        : undefined,
    [skippedPlaces, value],
  );

  const onMoveToInterested = useCallback(
    async (data: PlaceDataPlaceInfo) => {
      const response = await setPlaceAsInterested(data.placeId, tripId);
      if (response.status === "error") toast.error(response.message);
      else {
        setPlaces((prev) => ({
          ...prev,
          saved: [
            ...prev.saved,
            {
              placeInfo: data,
              userPlaceInfo: {
                ...defaultTripPlaceUserInfo,
                tripOrder: insertAfter(
                  prev.saved[prev.saved.length - 1]?.userPlaceInfo.tripOrder,
                ),
              },
            },
          ],
        }));
        setSkippedPlaces((prev) =>
          prev.filter((place) => place.placeId !== data.placeId),
        );
      }
    },
    [setPlaces, tripId],
  );

  return (
    <>
      <Input
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        left={<IconSearch />}
        placeholder="Search for a skipped place..."
      />
      <div className="space-y-2">
        {scoredItems &&
          scoredItems.map(([place]) => (
            <PlaceDetailsSkipped
              key={place.placeId}
              data={place}
              onMoveToInterested={onMoveToInterested}
            />
          ))}
        {skippedPlaces.length === 0 && (
          <span className="block w-full text-center leading-8 text-slate-500">
            No skipped places.
          </span>
        )}
      </div>
    </>
  );
}
