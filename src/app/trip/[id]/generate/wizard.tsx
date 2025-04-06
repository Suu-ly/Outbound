"use client";

import { Coordinates } from "@/server/types";

export default function Wizard({
  data,
}: {
  data: {
    days: {
      id: number;
      startTime: string;
    }[];
    places: {
      id: string;
      location: Coordinates;
      timeSpent: number;
    }[];
    trip: {
      id: string;
      startTime: string;
      endTime: string;
    } | null;
  };
}) {
  console.log(data);

  return (
    <main className="size-full space-y-6 p-4 sm:w-1/2 xl:w-1/3">
      Hello world
    </main>
  );
}
