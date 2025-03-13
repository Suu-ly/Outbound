import {
  BoundingBox,
  DayData,
  PlaceData,
  TravelTimeGraphType,
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

export const tripStartDateAtom = atom((get) => {
  const trip = get(tripDetailsAtom);
  return trip.startDate;
});

// Checks if the user is the owner of the trip
export const isTripAdminAtom = atom<boolean>(false);

// For the display of the marker on the map
export const mapActiveMarkerAtom = atom<{
  position: [number, number];
  bounds: BoundingBox;
  isInDay: number | string | null;
  placeId: string;
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
export const travelTimesAtom = atom<TravelTimeGraphType>({});
export const computedTravelTimesAtom = atom((get) => {
  const places = get(tripPlacesAtom);
  const shouldRoundUp = get(tripDetailsAtom).roundUpTime;
  const times: Record<keyof typeof places, (number | null)[]> = {};
  const keys = Object.keys(places);
  for (let i = 0, length = keys.length; i < length; i++) {
    let currentTimeSum = 0;
    const items = places[keys[i]];
    const currentTimes = new Array(items.length);
    currentTimes[0] = 0;
    let stopCalculation = false;
    for (let j = 0, placesLength = items.length - 1; j < placesLength; j++) {
      if (items[j].userPlaceInfo.timeToNextPlace && !stopCalculation) {
        currentTimeSum += items[j].userPlaceInfo.timeSpent;
        if (shouldRoundUp)
          currentTimeSum +=
            Math.ceil(items[j].userPlaceInfo.timeToNextPlace! / 15) * 15;
        else currentTimeSum += items[j].userPlaceInfo.timeToNextPlace!;
        currentTimes[j + 1] = currentTimeSum;
      } else {
        currentTimes[j + 1] = null;
        stopCalculation = true;
      }
    }
    times[keys[i]] = currentTimes;
  }
  return times;
});

// For the discover page
export const discoverPlacesAtom = atom<TripPlaceDetails[]>([]);

export const activePlaceIndexAtom = atom<number>(0);

// Bottom sheet atoms
export const scrolledToTopAtom = atom<boolean>(true);
export const drawerMinimisedAtom = atom<boolean>(false);
export const drawerDragProgressAtom = atom<MotionValue>();
