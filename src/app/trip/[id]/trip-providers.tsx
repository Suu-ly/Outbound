"use client";

import { InitialQueryPrepared } from "@/server/types";
import { Session, User } from "better-auth";
import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { MapProvider } from "react-map-gl";
import {
  dayPlacesAtom,
  discoverPlacesAtom,
  isTripAdminAtom,
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
    [tripDetailsAtom, data.tripData],
    [isTripAdminAtom, data.tripData.userId === session?.user.id],
    [tripWindowsAtom, data.windowData],
    [discoverPlacesAtom, data.discoverData],
    [tripPlacesAtom, data.placeData],
    [dayPlacesAtom, data.dayData],
  ]);
  return null;
};
