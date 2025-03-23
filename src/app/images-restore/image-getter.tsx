"use client";

import { updatePlaceImage } from "@/server/actions";
import { ApiResponse, BingReturn } from "@/server/types";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ImageGetter({
  places,
  placesNoLocation,
  fetch,
}: {
  places: {
    location: string;
    name: string;
    id: string;
  }[];
  placesNoLocation: {
    name: string;
    id: string;
  }[];
  fetch: (place: {
    location?: string;
    name: string;
  }) => Promise<ApiResponse<BingReturn>>;
}) {
  const [currentSearch, setCurrentSearch] = useState<{
    location?: string;
    name: string;
  }>();
  const [result, setResult] = useState<string>();
  const [index, setIndex] = useState(0);
  const isRun = useRef(false);

  useEffect(() => {
    const getImages = async () => {
      if (isRun.current) return;
      isRun.current = true;
      for (let i = 0, length = places.length; i < length; i++) {
        setResult(undefined);
        setIndex(i);
        setCurrentSearch(places[i]);
        const res = await fetch(places[i]);
        if (res.status === "error") toast.error(res.message);
        else {
          setResult(res.data.thumbnail);
          const out = await updatePlaceImage(
            res.data.image,
            res.data.thumbnail,
            places[i].id,
          );
          if (out.status === "error") toast.error(out.message);
        }
        await new Promise((resolve) => {
          // Wait 1 second
          setTimeout(resolve, 340);
        });
      }
      for (let i = 0, length = placesNoLocation.length; i < length; i++) {
        setResult(undefined);
        setIndex(i + places.length);
        setCurrentSearch(placesNoLocation[i]);
        const res = await fetch(placesNoLocation[i]);
        if (res.status === "error") toast.error(res.message);
        else {
          setResult(res.data.thumbnail);
          const out = await updatePlaceImage(
            res.data.image,
            res.data.thumbnail,
            placesNoLocation[i].id,
          );
          if (out.status === "error") toast.error(out.message);
        }
        await new Promise((resolve) => {
          // Wait 1 second
          setTimeout(resolve, 340);
        });
      }
    };
    getImages();
  }, [fetch, places, placesNoLocation]);

  if (places.length + placesNoLocation.length === 0) {
    return (
      <main className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-slate-700">
        No places with no cover images!
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-sm text-slate-500">
        Progress: {index + 1} of {places.length + placesNoLocation.length}
      </h1>
      <div className="text-slate-700">
        Now getting:{" "}
        {currentSearch && (
          <span>
            {currentSearch.location
              ? `${currentSearch.name} in ${currentSearch.location}`
              : currentSearch.name}
          </span>
        )}
      </div>
      {result ? (
        <img
          alt={currentSearch?.name}
          src={result}
          className="h-32 w-48 rounded-md object-cover"
        />
      ) : (
        <div className="h-32 w-48 rounded-md bg-slate-200"></div>
      )}
    </main>
  );
}
