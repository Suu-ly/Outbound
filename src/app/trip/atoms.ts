import { getInfoFromTravelTime, roundUpMinutes } from "@/lib/utils";
import { SelectTripPlace } from "@/server/db/schema";
import {
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
  type: SelectTripPlace["type"];
  position: [number, number];
  isInDay: number | null;
  placeId: string;
  name: string;
  shouldAnimate: boolean;
}>();
// We always want to display the undecided place marker
export const mapUndecidedActiveMarkerAtom = atom<{
  position: [number, number];
  isInDay: number | null;
  placeId: string;
  name: string;
}>();
export const showRouteLinesAtom = atom(true);

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
  const travelTimes = get(travelTimesAtom);
  const times: Record<keyof typeof places, (number | null)[]> = {};
  const keys = Object.keys(places);
  for (let i = 0, length = keys.length; i < length; i++) {
    let currentTimeSum = 0;
    const items = places[keys[i]];
    const currentTimes = new Array(items.length);
    currentTimes[0] = 0;
    let stopCalculation = false;
    for (let j = 0, placesLength = items.length - 1; j < placesLength; j++) {
      if (
        !stopCalculation &&
        travelTimes[items[j].placeInfo.placeId] &&
        travelTimes[items[j].placeInfo.placeId][items[j + 1].placeInfo.placeId]
      ) {
        currentTimeSum += items[j].userPlaceInfo.timeSpent;
        const routes =
          travelTimes[items[j].placeInfo.placeId][
            items[j + 1].placeInfo.placeId
          ];
        const [duration, distance] = getInfoFromTravelTime(routes.mode, routes);
        currentTimeSum += shouldRoundUp
          ? roundUpMinutes(duration, distance)
          : duration;
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

// Dialogs
export const setToPublicDialogOpenAtom = atom<{
  tripId: string;
}>();
export const changeTripNameDialogOpenAtom = atom<{
  tripId: string;
  currentName: string;
}>();
export const deleteTripDialogOpenAtom = atom<{
  tripId: string;
  name: string;
}>();
