"use client";

import { SelectTrip, SelectTripDay } from "@/server/db/schema";
import { MapProvider } from "react-map-gl";

export default function TripProviders({
  data,
  children,
}: Readonly<{
  data: {
    trip: SelectTrip;
    trip_day: SelectTripDay | null;
  }[];
  children: React.ReactNode;
}>) {
  console.log(data);
  return <MapProvider>{children}</MapProvider>;
}
