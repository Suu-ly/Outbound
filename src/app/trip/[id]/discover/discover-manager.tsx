"use client";

import { updateTripWindows } from "@/server/actions";
import { ApiResponse, DiscoverReturn } from "@/server/types";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { redirect, useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  activePlaceIndexAtom,
  discoverPlacesAtom,
  isTripAdminAtom,
  tripWindowsAtom,
} from "../../atoms";

const NO_TOKEN_STRING = "none";
const NO_MORE_RESULT_TOKEN = "done";

type QueryValue = {
  query: string;
  currentSearchIndex: number;
  nextPageToken: string[] | null;
};
export default function DiscoverManager() {
  const path = usePathname();
  const isAdmin = useAtomValue(isTripAdminAtom);
  if (!isAdmin) redirect(path.substring(0, 18));

  const [tripWindows, setTripWindows] = useAtom(tripWindowsAtom);
  const [discoverLocations, setDiscoverLocations] = useAtom(discoverPlacesAtom);
  const activePlaceIndex = useAtomValue(activePlaceIndexAtom);

  const [queryValue, setQueryValue] = useState<QueryValue>({
    query: "",
    currentSearchIndex: tripWindows.currentSearchIndex,
    nextPageToken: tripWindows.nextPageToken,
  });

  const id = useParams<{ id: string }>().id;

  const getNextIndex = useCallback(
    (prev: QueryValue, windowsLength: number) => {
      if (!prev.nextPageToken) {
        if (prev.currentSearchIndex < windowsLength - 1) {
          return prev.currentSearchIndex + 1;
        }
        return prev.currentSearchIndex;
      }

      const nextLargerToken = prev.nextPageToken.findIndex(
        (val, index) =>
          val !== NO_MORE_RESULT_TOKEN && index > prev.currentSearchIndex,
      );
      if (nextLargerToken !== -1) {
        return nextLargerToken;
      }

      const nextToken = prev.nextPageToken.findIndex(
        (val) => val !== NO_MORE_RESULT_TOKEN,
      );
      if (nextToken !== -1) {
        return nextToken;
      }
      return prev.currentSearchIndex;
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
    if (data.status === "success") {
      setDiscoverLocations((prev) => prev.concat(data.data.places));
      const newWindows = {
        currentSearchIndex: getNextIndex(
          queryValue,
          tripWindows.windows.length,
        ),
        nextPageToken: getNextPageTokenArray(
          queryValue.nextPageToken,
          queryValue.currentSearchIndex,
          data.data.nextPageToken,
        ),
      };
      const res = await updateTripWindows(newWindows, id);
      if (res.status === "success") {
        setTripWindows((prev) => ({
          ...prev,
          ...newWindows,
        }));
      } else {
        toast.error(res.message);
      }
      return data.data;
    }
    return [];
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
        ["id", id],
      ]);
      if (
        tripWindows.nextPageToken &&
        tripWindows.nextPageToken[tripWindows.currentSearchIndex] !==
          NO_TOKEN_STRING &&
        tripWindows.nextPageToken[tripWindows.currentSearchIndex] !==
          NO_MORE_RESULT_TOKEN
      ) {
        queryUrl.set(
          "nextPageToken",
          tripWindows.nextPageToken[tripWindows.currentSearchIndex],
        );
      }
      const searchBounds = [
        [
          tripWindows.windows[tripWindows.currentSearchIndex][0][0],
          tripWindows.windows[tripWindows.currentSearchIndex][0][1],
        ],
        [
          tripWindows.windows[tripWindows.currentSearchIndex][1][0],
          tripWindows.windows[tripWindows.currentSearchIndex][1][1],
        ],
      ];
      for (let i = 0; i < searchBounds.length; i++) {
        for (let j = 0; j < searchBounds[i].length; j++) {
          queryUrl.append("bounds", searchBounds[i][j].toString());
        }
      }
      setQueryValue({
        query: queryUrl.toString(),
        currentSearchIndex: tripWindows.currentSearchIndex,
        nextPageToken: tripWindows.nextPageToken,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaceIndex, discoverLocations.length, isFetching]);

  return null;
}
