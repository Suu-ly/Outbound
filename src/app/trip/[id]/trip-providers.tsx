"use client";

import { InitialQueryPrepared } from "@/server/types";
import { Session, User } from "better-auth";
import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { TZDate } from "react-day-picker";
import { MapProvider } from "react-map-gl";
import {
  dayPlacesAtom,
  discoverPlacesAtom,
  isTripAdminAtom,
  travelTimesAtom,
  tripDetailsAtom,
  tripPlacesAtom,
  tripWindowsAtom,
} from "../atoms";

export default function TripProviders({
  data,
  session,
  children,
}: Readonly<{
  data: InitialQueryPrepared;
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
  data: InitialQueryPrepared;
  session: { session: Session; user: User } | null;
}>) => {
  useHydrateAtoms([
    [
      tripDetailsAtom,
      {
        ...data.tripData,
        startDate: new TZDate(data.tripData.startDate, "UTC"),
        endDate: new TZDate(data.tripData.endDate, "UTC"),
      },
    ],
    [isTripAdminAtom, data.tripData.userId === session?.user.id],
    [tripWindowsAtom, data.windowData],
    [discoverPlacesAtom, data.discoverData],
    [tripPlacesAtom, data.placeData],
    [dayPlacesAtom, data.dayData],
    [travelTimesAtom, data.travelTimeData],
  ]);
  return null;
};
