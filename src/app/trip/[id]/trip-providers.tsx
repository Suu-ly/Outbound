"use client";

import { SelectTrip, SelectTripDay } from "@/server/db/schema";
import { Session, User } from "better-auth";
import { MapProvider } from "react-map-gl";

export default function TripProviders({
  data,
  session,
  children,
}: Readonly<{
  data: {
    trip: SelectTrip;
    trip_day: SelectTripDay | null;
  }[];
  session: { session: Session; user: User } | null;
  children: React.ReactNode;
}>) {
  return <MapProvider>{children}</MapProvider>;
}
