"use client";

import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import { useMediaQuery } from "@/lib/use-media-query";
import { updateTripWindows } from "@/server/actions";
import { ApiResponse, DiscoverReturn } from "@/server/types";
import { IconHeart, IconX } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  HTMLMotionProps,
  motion,
  MotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { redirect, useParams, usePathname } from "next/navigation";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  activePlaceIndexAtom,
  discoverPlacesAtom,
  drawerDragProgressAtom,
  isTripAdminAtom,
  mapActiveMarkerAtom,
  tripLocationAtom,
} from "../../atoms";
import BottomSheet from "./bottom-sheet";
import Card from "./swipe-card";

const NO_TOKEN_STRING = "none";
const NO_MORE_RESULT_TOKEN = "done";

type QueryValue = {
  query: string;
  currentSearchIndex: number;
  nextPageToken: string[] | null;
};

type MagnetProps = HTMLMotionProps<"div"> & {
  x: MotionValue;
  y: MotionValue;
};

const Magnet = forwardRef<HTMLDivElement, MagnetProps>(
  ({ x, y, children, ...rest }, ref) => {
    return (
      <motion.div {...rest} ref={ref} style={{ x, y }}>
        {children}
      </motion.div>
    );
  },
);

Magnet.displayName = "Magnet";

export function DiscoverManager() {
  const path = usePathname();
  const isAdmin = useAtomValue(isTripAdminAtom);
  if (!isAdmin) redirect(path.substring(0, 18));

  const [tripLocation, setTripLocation] = useAtom(tripLocationAtom);
  const [discoverLocations, setDiscoverLocations] = useAtom(discoverPlacesAtom);
  const activePlaceIndex = useAtomValue(activePlaceIndexAtom);

  const [queryValue, setQueryValue] = useState<QueryValue>({
    query: "",
    currentSearchIndex: tripLocation.currentSearchIndex,
    nextPageToken: tripLocation.nextPageToken,
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
      const newArray: string[] = new Array(tripLocation.windows.length).fill(
        NO_TOKEN_STRING,
      );
      newArray[index] = token ?? NO_MORE_RESULT_TOKEN;
      return newArray;
    },
    [tripLocation.windows.length],
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
          tripLocation.windows.length,
        ),
        nextPageToken: getNextPageTokenArray(
          queryValue.nextPageToken,
          queryValue.currentSearchIndex,
          data.data.nextPageToken,
        ),
      };
      const res = await updateTripWindows(newWindows, id);
      if (res.status === "success") {
        setTripLocation((prev) => ({
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
        ["location", tripLocation.name],
        ["id", id],
      ]);
      if (
        tripLocation.nextPageToken &&
        (tripLocation.nextPageToken[tripLocation.currentSearchIndex] !==
          NO_TOKEN_STRING ||
          tripLocation.nextPageToken[tripLocation.currentSearchIndex] !==
            NO_MORE_RESULT_TOKEN)
      ) {
        queryUrl.set(
          "nextPageToken",
          tripLocation.nextPageToken[tripLocation.currentSearchIndex],
        );
      }
      const searchBounds = [
        [
          tripLocation.windows[tripLocation.currentSearchIndex][0][0],
          tripLocation.windows[tripLocation.currentSearchIndex][0][1],
        ],
        [
          tripLocation.windows[tripLocation.currentSearchIndex][1][0],
          tripLocation.windows[tripLocation.currentSearchIndex][1][1],
        ],
      ];
      for (let i = 0; i < searchBounds.length; i++) {
        for (let j = 0; j < searchBounds[i].length; j++) {
          queryUrl.append("bounds", searchBounds[i][j].toString());
        }
      }
      setQueryValue({
        query: queryUrl.toString(),
        currentSearchIndex: tripLocation.currentSearchIndex,
        nextPageToken: tripLocation.nextPageToken,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaceIndex, discoverLocations.length, isFetching]);

  return null;
}

export function SwipeManager() {
  const path = usePathname();
  const isLarge = useMediaQuery("(min-width: 640px)");

  const cardRef = useRef<{
    triggerAccept: () => void;
    triggerReject: () => void;
  }>(null);

  const setActiveLocation = useSetAtom(mapActiveMarkerAtom);
  const [discoverLocations, setDiscoverLocations] = useAtom(discoverPlacesAtom);
  // const [discoverLocations, setDiscoverLocations] = useState([
  //   ...data,
  //   ...data,
  // ]);
  const drawerProgress = useAtomValue(drawerDragProgressAtom);
  const buttonsY = useTransform(() => 100 - drawerProgress?.get() * 100);

  const [activePlaceIndex, setActivePlaceIndex] = useAtom(activePlaceIndexAtom);

  const magnetX = useSpring(0, { damping: 20 });
  const magnetY = useSpring(0, { damping: 20 });

  const magnetFunctionX = useCallback(
    (x: number) => {
      magnetX.set(x);
    },
    [magnetX],
  );

  const magnetFunctionY = useCallback(
    (y: number) => {
      magnetY.set(y);
    },
    [magnetY],
  );

  const onDecision = useCallback(
    (id: string, accepted: boolean) => {
      setActivePlaceIndex((prev) => prev + 1);
    },
    [setActivePlaceIndex],
  );

  const onRemove = useCallback(
    (id: string) => {
      setDiscoverLocations((prevs) => prevs.filter((prev) => prev.id !== id));
      setActivePlaceIndex((prev) => prev - 1);
    },
    [setActivePlaceIndex, setDiscoverLocations],
  );

  const handleAcceptClick = () => {
    if (!cardRef.current) return;
    cardRef.current.triggerAccept();
  };

  const handleRejectClick = () => {
    if (!cardRef.current) return;
    cardRef.current.triggerReject();
  };

  // useEffect(() => {
  //   setActiveLocation()
  // }, [activePlaceIndex, discoverLocations]);

  console.log(discoverLocations);

  if (!isLarge)
    return (
      <>
        <BottomSheet>
          {discoverLocations.map((location, index) => {
            // Only render the currently active card and the 2 cards below it for better performance
            if (index > 2) return;
            return (
              <Card
                key={location.id}
                data={location}
                index={index}
                active={index === activePlaceIndex}
                ref={index === activePlaceIndex ? cardRef : undefined}
                magnetFunctionX={magnetFunctionX}
                magnetFunctionY={magnetFunctionY}
                onDecision={onDecision}
                onRemove={onRemove}
                mobile
              />
            );
          })}
        </BottomSheet>
        <motion.div
          className="pointer-events-none fixed bottom-16 left-0 z-50 flex w-full items-center justify-center gap-6 p-4 sm:w-1/2 xl:w-1/3"
          style={{ y: buttonsY }}
        >
          <Button
            className="pointer-events-auto border-red-400 bg-white text-rose-500 shadow-md active:ring-red-400"
            primaryBgColor="bg-rose-700"
            iconOnly
            onClick={handleRejectClick}
            size="large"
            aria-label="Not interested"
          >
            <IconX />
          </Button>
          <Button
            className="pointer-events-auto border-green-400 bg-white text-emerald-500 shadow-md active:ring-green-400"
            primaryBgColor="bg-emerald-700"
            iconOnly
            onClick={handleAcceptClick}
            size="large"
            aria-label="Interested"
          >
            <IconHeart />
          </Button>
        </motion.div>
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t-2 border-slate-200 bg-white px-4 py-2">
          <span className="w-28 text-sm text-slate-700">14 Places Saved</span>
          <Magnet x={magnetX} y={magnetY}>
            <ButtonLink size="large" href={path.substring(0, 18)}>
              Plan Trip
            </ButtonLink>
          </Magnet>
        </div>
      </>
    );

  return (
    <main className="max-h-full w-full sm:w-1/2 xl:w-1/3">
      {discoverLocations.map((location, index) => {
        // Only render the currently active card and the 2 cards below it for better performance
        if (index > 2) return;
        return (
          <Card
            key={location.id}
            data={location}
            index={index}
            active={index === activePlaceIndex}
            ref={index === activePlaceIndex ? cardRef : undefined}
            magnetFunctionX={magnetFunctionX}
            magnetFunctionY={magnetFunctionY}
            onDecision={onDecision}
            onRemove={onRemove}
          />
        );
      })}
      <div className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-center gap-6 p-4 sm:w-1/2 xl:w-1/3">
        <Button
          className="border-red-400 bg-white text-rose-500 shadow-md active:ring-red-400"
          primaryBgColor="bg-rose-700"
          iconOnly
          onClick={handleRejectClick}
          size="large"
          aria-label="Not interested"
        >
          <IconX />
        </Button>
        <Button
          className="border-green-400 bg-white text-emerald-500 shadow-md active:ring-green-400"
          primaryBgColor="bg-emerald-700"
          iconOnly
          onClick={handleAcceptClick}
          size="large"
          aria-label="Interested"
        >
          <IconHeart />
        </Button>
      </div>
      <Magnet x={magnetX} y={magnetY} className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-3 rounded-full border-2 border-slate-200 bg-white p-1 pl-4 shadow-md">
          <span className="w-28 text-sm text-slate-700">14 Places Saved</span>
          <ButtonLink href={path.substring(0, 18)}>Plan Trip</ButtonLink>
        </div>
      </Magnet>
    </main>
  );
}
