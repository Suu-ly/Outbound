"use client";

import { SelectTripPlace } from "@/server/db/schema";
import { TripPlaceDetails } from "@/server/types";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { mapActiveMarkerAtom } from "../../atoms";

export default function DetailsMarkerManager({
  data,
  trip,
}: {
  data: TripPlaceDetails;
  trip: { dayId: number | null; type: SelectTripPlace["type"] };
}) {
  const setActiveMapMarker = useSetAtom(mapActiveMarkerAtom);
  useEffect(() => {
    setActiveMapMarker({
      isInDay: trip.dayId,
      name: data.displayName,
      placeId: data.id,
      position: [data.location.longitude, data.location.latitude],
      shouldAnimate: true,
      type: trip.type,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
