"use client";

import DateHydration from "@/components/date-hydration";
import ShareButton from "@/components/share-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import Link from "next/link";
import {
  changeTripNameDialogOpenAtom,
  deleteTripDialogOpenAtom,
  setToPublicDialogOpenAtom,
} from "./trip/atoms";

export default function TripCard({
  trip,
}: {
  trip: {
    tripId: string;
    name: string;
    coverImgSmall: string;
    startDate: Date;
    endDate: Date;
    private: boolean;
    places: number;
  };
}) {
  const setSetToPublicDialogOpen = useSetAtom(setToPublicDialogOpenAtom);
  const setChangeTripNameDialogOpen = useSetAtom(changeTripNameDialogOpenAtom);
  const setDeleteTripDialogOpen = useSetAtom(deleteTripDialogOpenAtom);

  return (
    <div className="group relative space-y-2 rounded-2xl border-2 border-slate-200 bg-white p-3 ring-0 ring-slate-200 transition hover:ring-2 has-[a:active]:ring-slate-400">
      <div className="relative aspect-[5/4] overflow-hidden rounded-lg">
        <img
          src={trip.coverImgSmall}
          alt={trip.name}
          className="absolute size-full object-cover transition-transform duration-500 group-hover:scale-[102%]"
        />
      </div>
      <div className="flex gap-1">
        <div className="flex grow flex-col">
          <Link href={`/trip/${trip.tripId}`}>
            <span className="absolute inset-0" role="presentation"></span>
            <h4 className="line-clamp-2 grow font-display text-2xl font-medium text-slate-900">
              {trip.name}
            </h4>
          </Link>
          <p className="mb-2 text-xs font-medium text-slate-500">
            <DateHydration date={trip.startDate} /> –{" "}
            <DateHydration date={trip.endDate} />
          </p>
          <p className="text-slate-700">{trip.places} Places</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="small"
              variant="ghost"
              iconOnly
              aria-label="More options"
            >
              <IconDotsVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ShareButton
              link={process.env.NEXT_PUBLIC_URL + `/trip/${trip.tripId}`}
              message="Trip link copied to clipboard!"
              isDropdown
              onAction={
                trip.private
                  ? () =>
                      setSetToPublicDialogOpen({
                        tripId: trip.tripId,
                      })
                  : undefined
              }
            ></ShareButton>
            <DropdownMenuItem
              onSelect={() =>
                setChangeTripNameDialogOpen({
                  tripId: trip.tripId,
                  currentName: trip.name,
                })
              }
            >
              <IconEdit /> Rename trip
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                setDeleteTripDialogOpen({
                  tripId: trip.tripId,
                  name: trip.name,
                })
              }
              className="text-rose-700 focus:text-rose-900 [&_svg]:text-rose-600 [&_svg]:focus:text-rose-700"
            >
              <IconTrash />
              Delete trip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
