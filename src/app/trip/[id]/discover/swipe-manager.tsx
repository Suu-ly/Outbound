"use client";

import TabDisable from "@/components/tab-disable";
import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  defaultTripPlaceUserInfo,
  getStartingIndex,
  insertAfter,
} from "@/lib/utils";
import { setPlaceAsInterested, setPlaceAsUninterested } from "@/server/actions";
import { TripPlaceDetails } from "@/server/types";
import { IconHeart, IconX } from "@tabler/icons-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  HTMLMotionProps,
  motion,
  MotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { usePathname } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import {
  activePlaceIndexAtom,
  discoverPlacesAtom,
  drawerDragProgressAtom,
  mapUndecidedActiveMarkerAtom,
  savedPlacesAmountAtom,
  tripPlacesAtom,
} from "../../atoms";
import BottomSheet from "./bottom-sheet";
import Card from "./swipe-card";

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

const emptySubscribe = () => () => {};

export default function SwipeManager({ tripId }: { tripId: string }) {
  const path = usePathname();
  const isLarge = useMediaQuery("(min-width: 640px)");

  const cardRef = useRef<{
    triggerAccept: () => void;
    triggerReject: () => void;
  }>(null);

  const [discoverLocations, setDiscoverLocations] = useAtom(discoverPlacesAtom);
  const setTripPlaces = useSetAtom(tripPlacesAtom);
  const savedPlacesAmount = useAtomValue(savedPlacesAmountAtom);

  const drawerProgress = useAtomValue(drawerDragProgressAtom);
  const buttonsY = useTransform(() => 100 - drawerProgress?.get() * 100);

  const [activePlaceIndex, setActivePlaceIndex] = useAtom(activePlaceIndexAtom);
  const setUndecidedActiveMapMarker = useSetAtom(mapUndecidedActiveMarkerAtom);

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
    async (data: TripPlaceDetails, accepted: boolean) => {
      if (accepted) {
        setTripPlaces((prev) => ({
          ...prev,
          saved: [
            ...prev.saved,
            {
              userPlaceInfo: {
                ...defaultTripPlaceUserInfo,
                tripOrder:
                  prev.saved.length > 0
                    ? insertAfter(
                        prev.saved[prev.saved.length - 1].userPlaceInfo
                          .tripOrder,
                      )
                    : getStartingIndex(),
              },
              placeInfo: {
                placeId: data.id,
                displayName: data.displayName,
                primaryTypeDisplayName: data.primaryTypeDisplayName,
                typeColor: data.typeColor,
                location: data.location,
                viewport: data.viewport,
                coverImgSmall: data.coverImgSmall,
                rating: data.rating,
                googleMapsLink: data.googleMapsLink,
                openingHours: data.openingHours,
              },
            },
          ],
        }));
      }
      setActivePlaceIndex((prev) => prev + 1);
      const res = accepted
        ? await setPlaceAsInterested(data.id, tripId)
        : await setPlaceAsUninterested(data.id, tripId);
      if (res.status === "error") toast.error(res.message);
    },
    [setActivePlaceIndex, tripId, setTripPlaces],
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

  const isServer = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true,
  );

  useEffect(() => {
    if (discoverLocations[activePlaceIndex]) {
      const nextPlace = discoverLocations[activePlaceIndex];
      setUndecidedActiveMapMarker((prev) => {
        if (prev?.placeId === nextPlace.id) return prev; // Avoid jerky flight
        return {
          isInDay: null,
          name: nextPlace.displayName,
          placeId: nextPlace.id,
          position: [nextPlace.location.longitude, nextPlace.location.latitude],
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlaceIndex, discoverLocations]);

  console.log(discoverLocations);

  if (isServer) return <main className="sm:w-1/2 xl:w-1/3"></main>;

  if (isLarge)
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
            <span className="w-28 text-sm text-slate-700">
              {savedPlacesAmount} Places Saved
            </span>
            <ButtonLink href={path.substring(0, 18)}>Plan Trip</ButtonLink>
          </div>
        </Magnet>
      </main>
    );

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
      <TabDisable>
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
      </TabDisable>
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t-2 border-slate-200 bg-white px-4 py-2">
        <span className="w-28 text-sm text-slate-700">
          {savedPlacesAmount} Places Saved
        </span>
        <Magnet x={magnetX} y={magnetY}>
          <ButtonLink size="large" href={path.substring(0, 18)}>
            Plan Trip
          </ButtonLink>
        </Magnet>
      </div>
    </>
  );
}
