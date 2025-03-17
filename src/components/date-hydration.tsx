"use client";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export default function DateHydration({
  date,
  weekday = false,
}: {
  date: Date;
  weekday?: boolean;
}) {
  const safeDate = useSyncExternalStore(
    emptySubscribe,
    () =>
      date.toLocaleDateString(
        undefined,
        weekday
          ? { weekday: "short" }
          : { day: "numeric", month: "short", year: "2-digit" },
      ),
    () =>
      date.toLocaleDateString(
        "en-GB",
        weekday
          ? { weekday: "short" }
          : { day: "numeric", month: "short", year: "2-digit" },
      ),
  );
  return safeDate;
}
