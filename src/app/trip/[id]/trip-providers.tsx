"use client";

import { SelectLocation, SelectTrip, SelectTripDay } from "@/server/db/schema";
import { Session, User } from "better-auth";
import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { MapProvider } from "react-map-gl";
import { isTripAdminAtom, tripDetailsAtom, tripLocationAtom } from "../atoms";

export default function TripProviders({
  data,
  session,
  children,
}: Readonly<{
  data: {
    trip: SelectTrip;
    trip_day: SelectTripDay;
    location: SelectLocation;
  }[];
  session: { session: Session; user: User } | null;
  children: React.ReactNode;
}>) {
  return (
    <MapProvider>
      <Provider>
        <HydrateAtoms data={data} session={session} />
        {children}
      </Provider>
    </MapProvider>
  );
}

const HydrateAtoms = ({
  data,
  session,
}: Readonly<{
  data: {
    trip: SelectTrip;
    trip_day: SelectTripDay;
    location: SelectLocation;
  }[];
  session: { session: Session; user: User } | null;
}>) => {
  const firstRow = data[0];

  useHydrateAtoms([
    [
      tripDetailsAtom,
      {
        id: firstRow.trip.id,
        name: firstRow.trip.name,
        coverImg: firstRow.location.coverImg,
        startDate: firstRow.trip.startDate,
        endDate: firstRow.trip.endDate,
        startTime: firstRow.trip.startTime,
        endTime: firstRow.trip.endTime,
        private: firstRow.trip.private,
        roundUpTime: firstRow.trip.roundUpTime,
      },
    ],
    [isTripAdminAtom, firstRow.trip.userId === session?.user.id],
    [
      tripLocationAtom,
      {
        name: firstRow.location.name,
        bounds: firstRow.location.bounds.map((coords) =>
          coords.map((val) => parseFloat(val)),
        ) as [[number, number], [number, number]],
        windowXStep: firstRow.location.windowXStep,
        windowYStep: firstRow.location.windowYStep,
        currentXWindow: firstRow.trip.currentXWindow,
        currentYWindow: firstRow.trip.currentYWindow,
        nextPageToken: firstRow.trip.nextPageToken,
      },
    ],
  ]);
  return null;
};
