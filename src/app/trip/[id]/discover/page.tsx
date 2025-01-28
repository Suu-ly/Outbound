"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { redirect, usePathname } from "next/navigation";
import {
  isTripAdminAtom,
  mapActiveMarkerAtom,
  tripLocationAtom,
} from "../../atoms";

export default function TripSwipePage() {
  const path = usePathname();
  const setActiveLocation = useSetAtom(mapActiveMarkerAtom);

  const isAdmin = useAtomValue(isTripAdminAtom);
  if (!isAdmin) redirect(path.substring(0, 18));

  const [tripLocation, setTripLocation] = useAtom(tripLocationAtom);

  return <main className="size-full sm:w-1/2 xl:w-1/3"></main>;
}
