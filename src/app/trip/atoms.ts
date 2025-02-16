import { data } from "@/resources/mock-data";
import { SelectPlace, SelectTripPlace } from "@/server/db/schema";
import { BoundingBox, TripPlaceDetails } from "@/server/types";
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
  bounds: BoundingBox;
  type: "skipped" | "saved" | "undecided";
}>();

export const tripLocationAtom = atom<{
  name: string;
  viewport: BoundingBox;
  windows: BoundingBox[];
  currentSearchIndex: number;
  nextPageToken: string[] | null;
}>({
  name: "",
  viewport: [
    [0, 0],
    [0, 0],
  ],
  windows: [],
  currentSearchIndex: 0,
  nextPageToken: null,
});

export const tripPlacesAtom = atom<
  Record<string, (SelectTripPlace & SelectPlace)[]>
>({});

export const discoverPlacesAtom = atom<TripPlaceDetails[]>(
  process.env.NEXT_PUBLIC_USE_REAL_DATA === "true" ? [] : [...data, ...data],
);

export const activePlaceIndexAtom = atom<number>(0);

export const scrolledToTopAtom = atom<boolean>(true);
export const drawerMinimisedAtom = atom<boolean>(false);
export const drawerDragProgressAtom = atom<MotionValue>();
