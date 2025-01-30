"use client";

import { useMediaQuery } from "@/lib/use-media-query";
import { updateTripWindows } from "@/server/actions";
import { ApiResponse, DiscoverReturn } from "@/server/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { redirect, useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  activePlaceIndexAtom,
  discoverPlacesAtom,
  isTripAdminAtom,
  mapActiveMarkerAtom,
  tripLocationAtom,
} from "../../atoms";

const NO_TOKEN_STRING = "none";

export function DiscoverManager() {
  const path = usePathname();
  const isAdmin = useAtomValue(isTripAdminAtom);
  if (!isAdmin) redirect(path.substring(0, 18));

  const [tripLocation, setTripLocation] = useAtom(tripLocationAtom);
  const [discoverLocations, setDiscoverLocations] = useAtom(discoverPlacesAtom);
  const activePlaceIndex = useAtomValue(activePlaceIndexAtom);
  const [queryString, setQueryString] = useState("");
  const id = useParams<{ id: string }>().id;

  const lonStep =
    (tripLocation.bounds[1][0] - tripLocation.bounds[0][0]) /
    tripLocation.windowXStep;
  const latStep =
    (tripLocation.bounds[1][1] - tripLocation.bounds[0][1]) /
    tripLocation.windowYStep;

  const getNextXWindow = useCallback((prev: typeof tripLocation) => {
    if (prev.currentXWindow < prev.windowXStep) {
      return prev.currentXWindow + 1;
    }
    // X is maximum
    // reset to X to 1 and Y + 1 or end
    if (prev.currentYWindow < prev.windowYStep) {
      return 1;
    }
    // Both X and Y is maximum
    if (prev.nextPageToken && prev.nextPageToken[0] !== NO_TOKEN_STRING)
      return 1;

    return prev.currentXWindow;
  }, []);

  const getNextYWindow = useCallback((prev: typeof tripLocation) => {
    if (prev.currentXWindow < prev.windowXStep) {
      return prev.currentYWindow;
    }
    // X is maximum
    // reset to X to 1 and Y + 1 or end
    if (prev.currentYWindow < prev.windowYStep) {
      return prev.currentYWindow + 1;
    }
    // Both X and Y is maximum
    if (prev.nextPageToken && prev.nextPageToken[0] !== NO_TOKEN_STRING)
      return 1;

    return prev.currentYWindow;
  }, []);

  const getNextPageTokenArray = useCallback(
    (
      array: string[] | null,
      dimension: number,
      current: number,
      token: string | null,
    ) => {
      if (array) {
        array[current - 1] = token ?? NO_TOKEN_STRING;
        return [...array];
      }
      const newArray: string[] = new Array(dimension).fill(NO_TOKEN_STRING);
      newArray[current - 1] = token ?? NO_TOKEN_STRING;
      return newArray;
    },
    [],
  );

  const getDiscoverPlaces = async (queryString: string) => {
    const data = await fetch(`/api/places/discover?${queryString}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<DiscoverReturn>);
    if (data.status === "error") {
      throw new Error(data.message);
    }
    if (data.status === "success") {
      setDiscoverLocations((prev) => prev.concat(data.data.places));
      const newWindows = {
        currentXWindow: getNextXWindow(tripLocation),
        currentYWindow: getNextYWindow(tripLocation),
        nextPageToken: getNextPageTokenArray(
          tripLocation.nextPageToken,
          tripLocation.windowXStep * tripLocation.windowYStep,
          tripLocation.currentXWindow * tripLocation.currentYWindow,
          data.data.nextPageToken,
        ),
      };
      console.log("nextX", getNextXWindow(tripLocation));
      console.log("nextY", getNextYWindow(tripLocation));
      setTripLocation((prev) => ({
        ...prev,
        ...newWindows,
      }));
      updateTripWindows(newWindows, id);
      return data.data;
    }
    return [];
  };
  const { isFetching } = useQuery({
    queryKey: ["discover", queryString],
    queryFn: () => getDiscoverPlaces(queryString),
    placeholderData: keepPreviousData,
    enabled: queryString !== "",
  });

  useEffect(() => {
    if (discoverLocations.length - activePlaceIndex < 10 && !isFetching) {
      const queryUrl = new URLSearchParams([
        ["location", tripLocation.name],
        ["id", id],
      ]);
      const tokenIndex =
        tripLocation.currentXWindow * tripLocation.currentYWindow - 1;
      if (
        tripLocation.nextPageToken &&
        tripLocation.nextPageToken[tokenIndex] !== NO_TOKEN_STRING
      ) {
        queryUrl.set("nextPageToken", tripLocation.nextPageToken[tokenIndex]);
      }
      const searchBounds = [
        [
          tripLocation.bounds[0][0] +
            (tripLocation.currentXWindow - 1) * lonStep,
          tripLocation.bounds[0][1] +
            (tripLocation.currentYWindow - 1) * latStep,
        ],
        [
          tripLocation.bounds[0][0] + tripLocation.currentXWindow * lonStep,
          tripLocation.bounds[0][1] + tripLocation.currentYWindow * latStep,
        ],
      ];
      for (let i = 0; i < searchBounds.length; i++) {
        for (let j = 0; j < searchBounds[i].length; j++) {
          queryUrl.append("bounds", searchBounds[i][j].toString());
        }
      }
      setQueryString(queryUrl.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaceIndex, discoverLocations.length, isFetching]);

  return null;
}

export function SwipeManager() {
  const isLarge = useMediaQuery("(min-width: 640px)");

  const setActiveLocation = useSetAtom(mapActiveMarkerAtom);
  const [discoverLocations, setDiscoverLocations] = useAtom(discoverPlacesAtom);

  return (
    <main className="max-h-full w-full overflow-auto sm:w-1/2 xl:w-1/3">
      {discoverLocations.map((location, index) => {
        return (
          <div key={index}>
            {Object.entries(location).map(([key, val], index) => (
              <div key={`${val}${index}`}>
                <span className="font-semibold">{key}: </span>
                {val?.toString()}
              </div>
            ))}
          </div>
        );
      })}
    </main>
  );
}
