import {
  BoundingBox,
  DayData,
  PlaceData,
  TripData,
  TripPlaceDetails,
  WindowData,
} from "@/server/types";
import { atom } from "jotai";
import { MotionValue } from "motion/react";

// Trip settings atom
export const tripDetailsAtom = atom<TripData>({
  id: "",
  name: "",
  userId: "",
  startDate: new Date(),
  endDate: new Date(),
  private: true,
  roundUpTime: true,
  startTime: "0900",
  endTime: "2100",
  coverImg: "",
  viewport: [
    [0, 0],
    [0, 0],
  ],
});

// Checks if the user is the owner of the trip
export const isTripAdminAtom = atom<boolean>(false);

// For the display of the marker on the map
export const mapActiveMarkerAtom = atom<{
  position: [number, number];
  bounds: BoundingBox;
  type: "skipped" | "saved" | "undecided";
}>();

// For the discover manager
export const tripWindowsAtom = atom<WindowData>({
  name: "",
  windows: [],
  currentSearchIndex: 0,
  nextPageToken: null,
});

// For the planning page
export const tripPlacesAtom = atom<PlaceData>({ saved: [] });
export const savedPlacesAmountAtom = atom((get) => {
  const savedPlaces = get(tripPlacesAtom);
  return Object.values(savedPlaces).reduce(
    (accumulator, currentValue) => accumulator + currentValue.length,
    0,
  );
});
export const dayPlacesAtom = atom<DayData[]>([]);

// For the discover page
export const discoverPlacesAtom = atom<TripPlaceDetails[]>([]);

export const activePlaceIndexAtom = atom<number>(0);

// Bottom sheet atoms
export const scrolledToTopAtom = atom<boolean>(true);
export const drawerMinimisedAtom = atom<boolean>(false);
export const drawerDragProgressAtom = atom<MotionValue>();
