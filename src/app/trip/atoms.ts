import { SelectPlace, SelectTripPlace } from "@/server/db/schema";
import { TripPlaceDetails } from "@/server/types";
import { atom } from "jotai";
import { MotionValue } from "motion/react";

// Trip settings atom
export const tripDetailsAtom = atom<{
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  private: boolean;
  roundUpTime: boolean;
  startTime: string;
  endTime: string;
  coverImg: string;
}>({
  id: "",
  name: "",
  startDate: new Date(),
  endDate: new Date(),
  private: true,
  roundUpTime: true,
  startTime: "0900",
  endTime: "2100",
  coverImg: "",
});

// Checks if the user is the owner of the trip
export const isTripAdminAtom = atom<boolean>(false);

//
export const mapActiveMarkerAtom = atom<{
  position: [number, number];
  bounds: [[number, number], [number, number]];
  type: "skipped" | "saved" | "undecided";
}>();

export const tripLocationAtom = atom<{
  name: string;
  bounds: [[number, number], [number, number]];
  windowXStep: number;
  windowYStep: number;
  currentXWindow: number;
  currentYWindow: number;
  nextPageToken: string[] | null;
}>({
  name: "",
  bounds: [
    [0, 0],
    [0, 0],
  ],
  windowXStep: 1,
  windowYStep: 1,
  currentXWindow: 1,
  currentYWindow: 1,
  nextPageToken: null,
});

export const tripPlacesAtom = atom<
  Record<string, (SelectTripPlace & SelectPlace)[]>
>({});

export const discoverPlacesAtom = atom<TripPlaceDetails[]>([]);

export const activePlaceIndexAtom = atom<number>(0);

export const scrolledToTopAtom = atom<boolean>(true);
export const drawerMinimisedAtom = atom<boolean>(false);
export const drawerDragProgressAtom = atom<MotionValue>();
