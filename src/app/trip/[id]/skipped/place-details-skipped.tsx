"use client";

import OpeningHours from "@/components/opening-hours";
import ShareButton from "@/components/share-button";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PlaceDataPlaceInfo } from "@/server/types";
import {
  IconExternalLink,
  IconHeartShare,
  IconStarFilled,
} from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CSSProperties,
  forwardRef,
  memo,
  useCallback,
  useState,
  useTransition,
} from "react";
import { mapActiveMarkerAtom } from "../../atoms";

export type PlaceDetailsSkippedProps = {
  data: PlaceDataPlaceInfo;
  onMoveToInterested: (data: PlaceDataPlaceInfo) => Promise<void>;
};

const PlaceDetailsSkipped = memo(
  forwardRef<HTMLDivElement, PlaceDetailsSkippedProps>(
    ({ data, onMoveToInterested }, ref) => {
      const [expanded, setExpanded] = useState(false);
      const tripId = useParams<{ id: string }>().id;
      const [isMovingToInterested, startMovingToInterested] = useTransition();
      const setActiveMapMarker = useSetAtom(mapActiveMarkerAtom);

      const handleOnClick = useCallback(() => {
        if (!expanded) {
          setActiveMapMarker({
            isInDay: null,
            placeId: data.placeId,
            position: [data.location.longitude, data.location.latitude],
            type: "skipped",
            name: data.displayName,
            shouldAnimate: true,
          });
        }
        setExpanded((prev) => !prev);
      }, [data, expanded, setActiveMapMarker]);

      const handleMoveToInterested = async () => {
        startMovingToInterested(async () => {
          await onMoveToInterested(data);
        });
      };

      const dayIndex = (((new Date().getDay() - 1) % 7) + 7) % 7;

      return (
        <Collapsible
          ref={ref}
          className="overflow-clip rounded-xl bg-white p-2 ring-offset-gray-50 transition has-[[data-trigger=true]:focus-visible]:outline-none has-[[data-trigger=true]:focus-visible]:ring-2 has-[[data-trigger=true]:focus-visible]:ring-slate-400 has-[[data-trigger=true]:focus-visible]:ring-offset-2"
        >
          <div className="flex items-start">
            <div className="relative mr-2 max-h-full w-20 shrink-0 self-stretch overflow-hidden rounded-lg bg-slate-300 xl:mr-3 xl:w-36">
              {data.rating && (
                <div className="absolute bottom-1 left-1 z-10 flex items-center gap-1 rounded bg-slate-50 px-1">
                  <span className="text-sm font-medium text-slate-700">
                    {data.rating.toFixed(1)}
                  </span>
                  <IconStarFilled size={16} className="text-amber-400" />
                </div>
              )}
              <img
                alt={data.displayName}
                src={data.coverImgSmall}
                className="absolute size-full object-cover"
              />
            </div>
            <div className="min-w-0 grow xl:min-h-24">
              <div className="flex">
                <CollapsibleTrigger
                  data-trigger={true}
                  onClick={handleOnClick}
                  className="flex min-h-[60px] min-w-0 grow flex-col items-start text-left focus-visible:outline-none"
                >
                  <div className="mb-1 w-full">
                    <div
                      className="text-xs font-medium"
                      style={{ color: data.typeColor }}
                    >
                      {data.primaryTypeDisplayName}
                    </div>
                    <h3 className="break-words font-medium text-slate-900">
                      {data.displayName}
                    </h3>
                  </div>
                  {data.openingHours && (
                    <div className="text-xs font-medium text-slate-700">
                      {data.openingHours.text[dayIndex].split(": ")[1]}
                    </div>
                  )}
                </CollapsibleTrigger>
                <ShareButton
                  className="hidden shrink-0 ring-offset-white xl:inline-flex"
                  link={data.googleMapsLink}
                  message="Google maps link copied to clipboard!"
                />
              </div>

              <Button
                className="mt-3 hidden h-9 w-full justify-start gap-1.5 rounded-lg pr-2 text-sm ring-offset-white has-[>div>svg,>svg]:pl-1.5 xl:inline-flex [&_svg]:text-slate-600 [&_svg]:transition-colors [&_svg]:hover:text-rose-500"
                size="small"
                variant="ghost"
                loading={isMovingToInterested}
                onClick={handleMoveToInterested}
              >
                <IconHeartShare />
                Moved to saved places
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 xl:hidden">
            <Button
              className="h-9 grow justify-start gap-1.5 rounded-lg pr-2 text-sm ring-offset-white has-[>div>svg,>svg]:pl-1.5 [&_svg]:text-slate-600 [&_svg]:transition-colors [&_svg]:hover:text-rose-500"
              size="small"
              variant="ghost"
              loading={isMovingToInterested}
              onClick={handleMoveToInterested}
            >
              <IconHeartShare />
              Moved to saved places
            </Button>
            <ShareButton
              link={data.googleMapsLink}
              message="Google maps link copied to clipboard!"
            />
          </div>
          <CollapsibleContent
            className="data-[state=closed]:animate-minimise data-[state=open]:animate-expand"
            style={
              {
                "--content-height": `var(--radix-collapsible-content-height)`,
                "--content-closed": "0px",
              } as CSSProperties
            }
          >
            <OpeningHours
              collapsible={false}
              highligtedDay={new Date().getDay()}
              hours={data.openingHours?.text}
              className="gap-1.5 rounded-lg pl-1.5 pr-2"
              contentClassName="pl-8"
            />
            <Link
              href={`/trip/${tripId}/${data.placeId}`}
              className="inline-flex gap-1.5 rounded-lg p-2 pl-1.5 text-sm font-medium text-slate-700 ring-offset-white transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:ring-2 active:ring-slate-200 active:ring-offset-0 [&_svg]:size-5 [&_svg]:text-slate-600"
            >
              <IconExternalLink /> View full information
            </Link>
          </CollapsibleContent>
        </Collapsible>
      );
    },
  ),
);

PlaceDetailsSkipped.displayName = "PlaceDetailsSkipped";

export default PlaceDetailsSkipped;
