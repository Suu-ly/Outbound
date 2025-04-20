"use client";

import { updateTripWindows } from "@/server/actions";
import { ApiResponse, DiscoverReturn } from "@/server/types";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import {
  activePlaceIndexAtom,
  discoverPlacesAtom,
  tripWindowsAtom,
} from "../../atoms";

const NO_TOKEN_STRING = "none";
const NO_MORE_RESULT_TOKEN = "done";

type QueryValue = {
  query: string;
  currentSearchIndex: number;
  nextPageToken: string[] | null;
};
export default function useDiscoverManager(tripId: string): [boolean, boolean] {
  const [tripWindows, setTripWindows] = useAtom(tripWindowsAtom);
  const [discoverLocations, setDiscoverLocations] = useAtom(discoverPlacesAtom);
  const activePlaceIndex = useAtomValue(activePlaceIndexAtom);
  const [exhausted, setExhausted] = useState(false);

  const [queryValue, setQueryValue] = useState<QueryValue>({
    query: "",
    currentSearchIndex:
      tripWindows.currentSearchIndex ??
      Math.floor(Math.random() * tripWindows.windows.length),
    nextPageToken: tripWindows.nextPageToken,
  });

  const getNextIndex = useCallback(
    (prev: QueryValue, windowsLength: number) => {
      // No other index to return
      if (windowsLength === 1) return prev.currentSearchIndex;

      if (!prev.nextPageToken) {
        // Return random next index that is not the same as current index
        const next = Math.floor(Math.random() * (windowsLength - 1));
        if (next >= prev.currentSearchIndex) return next + 1;
        return next;
      }
      // Find random next index, but bias never searched windows
      const possibleIndexes: number[] = [];
      const possibleNewIndexes: number[] = [];
      for (let i = 0, length = prev.nextPageToken.length; i < length; i++) {
        if (prev.nextPageToken[i] === NO_TOKEN_STRING) {
          possibleNewIndexes.push(i);
        } else if (prev.nextPageToken[i] !== NO_MORE_RESULT_TOKEN) {
          possibleIndexes.push(i);
        }
      }
      return (
        possibleNewIndexes[
          Math.floor(Math.random() * possibleNewIndexes.length)
        ] ??
        possibleIndexes[Math.floor(Math.random() * possibleIndexes.length)] ??
        prev.currentSearchIndex
      );
    },
    [],
  );

  const getNextPageTokenArray = useCallback(
    (array: string[] | null, index: number, token: string | null) => {
      if (array) {
        array[index] = token ?? NO_MORE_RESULT_TOKEN;
        return [...array];
      }
      const newArray: string[] = new Array(tripWindows.windows.length).fill(
        NO_TOKEN_STRING,
      );
      newArray[index] = token ?? NO_MORE_RESULT_TOKEN;
      return newArray;
    },
    [tripWindows.windows.length],
  );

  const getDiscoverPlaces = async (queryValue: QueryValue) => {
    const data = await fetch(`/api/places/discover?${queryValue.query}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<DiscoverReturn>);
    if (data.status === "error") {
      throw new Error(data.message);
    }
    const newWindows = {
      currentSearchIndex: getNextIndex(queryValue, tripWindows.windows.length),
      nextPageToken: getNextPageTokenArray(
        queryValue.nextPageToken,
        queryValue.currentSearchIndex,
        data.data.nextPageToken,
      ),
    };
    const res = await updateTripWindows(newWindows, tripId);
    if (res.status === "success") {
      setDiscoverLocations((prev) => prev.concat(data.data.places));
      setTripWindows((prev) => ({
        ...prev,
        ...newWindows,
      }));
    } else {
      throw new Error(res.message);
    }
    return data.data;
  };
  const { isFetching } = useQuery({
    queryKey: ["discover", queryValue.query],
    queryFn: () => getDiscoverPlaces(queryValue),
    enabled: queryValue.query !== "",
    meta: {
      errorMessage: "Unable to find places",
    },
  });

  useEffect(() => {
    if (discoverLocations.length - activePlaceIndex < 10 && !isFetching) {
      const queryUrl = new URLSearchParams([
        ["location", tripWindows.name],
        ["id", tripId],
      ]);
      const searchIndex =
        tripWindows.currentSearchIndex ??
        Math.floor(Math.random() * tripWindows.windows.length);

      // If the current search index is has no more results, means no more viable search windows
      if (
        tripWindows.nextPageToken &&
        tripWindows.nextPageToken[searchIndex] === NO_MORE_RESULT_TOKEN
      ) {
        setExhausted(true);
        return;
      }

      if (
        tripWindows.nextPageToken &&
        tripWindows.nextPageToken[searchIndex] !== NO_TOKEN_STRING
      ) {
        queryUrl.set("nextPageToken", tripWindows.nextPageToken[searchIndex]);
      }
      const searchBounds = [
        [
          tripWindows.windows[searchIndex][0][0],
          tripWindows.windows[searchIndex][0][1],
        ],
        [
          tripWindows.windows[searchIndex][1][0],
          tripWindows.windows[searchIndex][1][1],
        ],
      ];
      for (let i = 0; i < searchBounds.length; i++) {
        for (let j = 0; j < searchBounds[i].length; j++) {
          queryUrl.append("bounds", searchBounds[i][j].toString());
        }
      }
      setQueryValue({
        query: queryUrl.toString(),
        currentSearchIndex: searchIndex,
        nextPageToken: tripWindows.nextPageToken,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaceIndex, discoverLocations.length, isFetching]);
  return [isFetching, exhausted];
}
