"use client";

import { ApiResponse, PlacesPhoto } from "@/server/types";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { discoverPlacesAtom } from "../../atoms";

export default function MissingImageManager() {
  const [discoverLocations, setDiscoverLocations] = useAtom(discoverPlacesAtom);

  const [imagesToGet, setImagesToGet] = useState<string[]>([]);

  const getMissingImages = async (missingImages: string[]) => {
    const query = new URLSearchParams();
    for (let i = 0, length = missingImages.length; i < length; i++) {
      query.append("placeId", missingImages[i]);
    }
    const data = await fetch(`/api/places/image/refetch?${query.toString()}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<Record<string, PlacesPhoto[]>>);

    if (data.status === "error") {
      throw new Error(data.message);
    }
    setDiscoverLocations((prev) => {
      return prev.map((place) => {
        if (place.id in data.data)
          return {
            ...place,
            photos: data.data[place.id],
          };
        return { ...place, photos: null };
      });
    });
    return data.data;
  };

  useQuery({
    queryKey: ["getImages", imagesToGet],
    queryFn: () => getMissingImages(imagesToGet),
    enabled: imagesToGet.length > 0,
    meta: {
      errorMessage: "Unable to get place images",
    },
  });

  useEffect(() => {
    if (discoverLocations.length > 0) {
      const toGet = [];
      for (let i = 0, length = discoverLocations.length; i < length; i++) {
        const location = discoverLocations[i];
        if (location.photos === undefined) {
          toGet.push(location.id);
        }
      }
      setImagesToGet(toGet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
