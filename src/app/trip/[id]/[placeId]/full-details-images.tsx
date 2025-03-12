"use client";

import {
  Carousel,
  CarouselContent,
  CarouselGoogleImage,
  CarouselIndicator,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Skeleton from "@/components/ui/skeleton";
import { ApiResponse, PlacesPhoto } from "@/server/types";
import { useQuery } from "@tanstack/react-query";

export default function FullPlaceDetailsImages({
  placeId,
  displayName,
}: {
  placeId: string;
  displayName: string;
}) {
  const getMissingImages = async (placeId: string) => {
    const query = new URLSearchParams([["placeId", placeId]]);
    const data = await fetch(`/api/places/image/refetch?${query.toString()}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<Record<string, PlacesPhoto[]>>);

    if (data.status === "error") {
      throw new Error(data.message);
    }

    return data.data[placeId];
  };

  const { data } = useQuery({
    queryKey: ["getImages", placeId],
    queryFn: () => getMissingImages(placeId),
    meta: {
      errorMessage: "Unable to get place images",
    },
  });

  if (!data)
    return (
      <Skeleton className="mx-4 h-[400px] rounded-xl bg-white sm:h-[520px]" />
    );

  return (
    <Carousel orientation="vertical" disabled={true} className="mx-4">
      <div className="relative overflow-hidden rounded-xl bg-white transition-transform active:scale-[0.985]">
        <CarouselContent className="mt-0 h-[400px] w-full sm:h-[520px]">
          {data.map((photo, index) => (
            <CarouselGoogleImage
              key={photo.name}
              alt={displayName}
              index={index}
              photo={photo}
            />
          ))}
        </CarouselContent>
        <CarouselPrevious absolute />
        <CarouselNext absolute />
      </div>
      <CarouselIndicator />
    </Carousel>
  );
}
