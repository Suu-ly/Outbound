"use client";

import {
  dayPlacesAtom,
  isTripAdminAtom,
  tripStartDateAtom,
} from "@/app/trip/atoms";
import OpeningHours from "@/components/opening-hours";
import ShareButton from "@/components/share-button";
import TabDisable from "@/components/tab-disable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Textarea from "@/components/ui/textarea";
import { useMediaQuery } from "@/lib/use-media-query";
import { PlaceDataEntry } from "@/server/types";
import {
  IconCalendarRepeat,
  IconDotsVertical,
  IconExternalLink,
  IconHeartShare,
  IconHourglass,
  IconNote,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";
import { addDays } from "date-fns";
import { useAtomValue } from "jotai";
import { motion } from "motion/react";
import Link from "next/link";
import {
  ChangeEvent,
  CSSProperties,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type PlaceDetailsCompactProps = {
  data: PlaceDataEntry;
  isInDay?: number | string;
  skipped?: boolean;
  isDragging?: boolean;
  onRemove?: (isInDay: number | string, placeId: string) => void;
  handleMove?: (
    isInDay: number | string,
    data: PlaceDataEntry,
    newDay: number | string,
  ) => void;
  handleNoteChange?: (
    isInDay: number | string,
    placeId: string,
    note: string,
  ) => void;
};

// TODO it is broken when note is set then window is minimised

const PlaceDetailsCompact = memo(
  forwardRef<HTMLDivElement, PlaceDetailsCompactProps>(
    (
      {
        data,
        skipped,
        isInDay = "saved",
        isDragging,
        onRemove,
        handleMove,
        handleNoteChange,
      },
      ref,
    ) => {
      const [expanded, setExpanded] = useState<"min" | "mid" | "max">("min");
      const startDate = useAtomValue(tripStartDateAtom);
      const days = useAtomValue(dayPlacesAtom);
      const isAdmin = useAtomValue(isTripAdminAtom);
      const isLarge = useMediaQuery("(min-width: 1280px)");
      const [bottomHeight, setBottomHeight] = useState(324);
      const [note, setNote] = useState(
        data.userPlaceInfo.note ? data.userPlaceInfo.note : "",
      );

      const noteRef = useRef<HTMLTextAreaElement | null>(null);
      const bottomRef = useRef<HTMLDivElement | null>(null);

      const handleOnClick = useCallback(() => {
        setExpanded((prev) => {
          if (prev === "min" || prev === "mid") return "max";
          if (note) return "mid";
          return "min";
        });
      }, [note]);

      const onAddNote = useCallback(() => {
        if (expanded === "min") setExpanded("max");
        requestAnimationFrame(() => {
          noteRef.current?.focus();
        });
      }, [expanded]);

      const handleTextChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
          setNote(e.currentTarget.value);
        },
        [],
      );

      const handleOnBlur = useCallback(() => {
        if (!isAdmin) return;
        if (!note && expanded === "mid") setExpanded("min");
        if (handleNoteChange)
          handleNoteChange(isInDay, data.placeInfo.placeId, note);
      }, [
        data.placeInfo.placeId,
        expanded,
        handleNoteChange,
        isAdmin,
        isInDay,
        note,
      ]);

      useEffect(() => {
        const handleResize = () => {
          if (bottomRef.current) {
            setBottomHeight(bottomRef.current.scrollHeight);
          }
        };

        window.addEventListener("resize", handleResize);

        handleResize();

        return () => window.removeEventListener("resize", handleResize);
      }, []);

      const dayIndex = (((new Date().getDay() - 1) % 7) + 7) % 7;
      return (
        <div
          ref={ref}
          aria-expanded={expanded === "max" && !isDragging}
          className="overflow-hidden rounded-xl bg-white ring-offset-zinc-50 transition fill-mode-both has-[[data-trigger=true]:focus-visible]:outline-none has-[[data-trigger=true]:focus-visible]:ring-2 has-[[data-trigger=true]:focus-visible]:ring-slate-400 has-[[data-trigger=true]:focus-visible]:ring-offset-2"
        >
          <div className="flex items-start p-2">
            <div className="relative mr-2 max-h-full w-20 shrink-0 self-stretch overflow-hidden rounded-lg bg-slate-300 xl:mr-3 xl:w-36">
              {data.placeInfo.rating && (
                <div className="absolute bottom-1 left-1 z-10 flex items-center gap-1 rounded bg-slate-50 px-1">
                  <span className="text-sm font-medium text-slate-700">
                    {data.placeInfo.rating.toFixed(1)}
                  </span>
                  <IconStarFilled size={16} className="text-amber-400" />
                </div>
              )}
              <img
                alt={data.placeInfo.displayName}
                src={data.placeInfo.coverImgSmall}
                className="absolute size-full object-cover"
              />
            </div>
            <div className="w-full xl:min-h-24">
              <div className="flex">
                <button
                  data-trigger={true}
                  onClick={handleOnClick}
                  className="flex min-h-[60px] grow flex-col items-start text-left focus-visible:outline-none"
                >
                  <div className="mb-1">
                    <div
                      className="text-xs font-medium"
                      style={{ color: data.placeInfo.typeColor }}
                    >
                      {data.placeInfo.primaryTypeDisplayName}
                    </div>
                    <h3 className="font-medium text-slate-900">
                      {data.placeInfo.displayName}
                    </h3>
                  </div>
                  {data.placeInfo.openingHours && (
                    <div className="text-xs font-medium text-slate-700">
                      {
                        data.placeInfo.openingHours.text[dayIndex].split(
                          ": ",
                        )[1]
                      }
                    </div>
                  )}
                </button>
                {(!isAdmin || skipped) && (
                  <ShareButton
                    className={`shrink-0 ${skipped ? "hidden xl:inline-flex" : ""}`}
                    link={data.placeInfo.googleMapsLink}
                  />
                )}
                {isAdmin && !skipped && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="small"
                        variant="ghost"
                        iconOnly
                        aria-label="More"
                        className="shrink-0"
                      >
                        <IconDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <ShareButton
                        link={data.placeInfo.googleMapsLink}
                        isDropdown
                      />
                      <DropdownMenuItem
                        onClick={onAddNote}
                        className="xl:hidden"
                      >
                        <IconNote />
                        Add note
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <IconHourglass />
                        Change time spent
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <IconCalendarRepeat />
                          Change day
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {isInDay !== "saved" && (
                            <DropdownMenuItem
                              onSelect={() =>
                                handleMove && handleMove(isInDay, data, "saved")
                              }
                            >
                              Saved places
                            </DropdownMenuItem>
                          )}
                          {days.map((day, index) => {
                            if (day.dayId === isInDay) return;
                            return (
                              <DropdownMenuItem
                                key={day.dayId}
                                onSelect={() =>
                                  handleMove &&
                                  handleMove(isInDay, data, day.dayId)
                                }
                              >
                                {addDays(startDate, index).toLocaleDateString(
                                  undefined,
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "2-digit",
                                  },
                                )}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>

                      <DropdownMenuItem
                        onSelect={() =>
                          onRemove && onRemove(isInDay, data.placeInfo.placeId)
                        }
                        className="text-rose-700 focus:text-rose-900 [&_svg]:text-rose-600 [&_svg]:focus:text-rose-700"
                      >
                        <IconTrash />
                        Remove from saved places
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="hidden w-full xl:block">
                {!skipped && (isAdmin || !!note) && (
                  <Textarea
                    value={note}
                    ref={isLarge ? noteRef : undefined}
                    onChange={handleTextChange}
                    small
                    onBlur={handleOnBlur}
                    className={`mt-3 rounded-lg border-0 bg-slate-50 has-[textarea:focus-visible]:bg-slate-100 has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-slate-300 [&_textarea]:placeholder:text-slate-600 ${!isAdmin ? "pointer-events-none" : ""}`}
                    placeholder="Add note..."
                    left={<IconNote />}
                  />
                )}
                {skipped && (
                  <Button
                    className="mt-3 h-9 w-full justify-start gap-1.5 rounded-lg pr-2 text-sm ring-offset-white has-[>div>svg,>svg]:pl-1.5 [&_svg]:text-slate-600 hover:[&_svg]:text-slate-700"
                    size="small"
                    variant="ghost"
                  >
                    <IconHeartShare />
                    Moved to saved places
                  </Button>
                )}
              </div>
            </div>
          </div>
          {skipped && (
            <div className="flex items-center gap-1 p-2 xl:hidden">
              <Button
                className="h-9 grow justify-start gap-1.5 rounded-lg pr-2 text-sm ring-offset-white has-[>div>svg,>svg]:pl-1.5 [&_svg]:text-slate-600 hover:[&_svg]:text-slate-700"
                size="small"
                variant="ghost"
              >
                <IconHeartShare />
                Moved to saved places
              </Button>
              <ShareButton link={data.placeInfo.googleMapsLink} />
            </div>
          )}
          <motion.div
            initial={{ height: 0 }}
            animate={
              expanded === "min" || isDragging
                ? { height: 0 }
                : { height: "auto" }
            }
            transition={{
              duration: 0.3,
              ease: [0.8, 0, 0.2, 1],
            }}
          >
            {!skipped && (isAdmin || !!note) && (
              <TabDisable className="p-2 xl:hidden" active={expanded !== "min"}>
                <Textarea
                  ref={!isLarge ? noteRef : undefined}
                  value={note}
                  onChange={handleTextChange}
                  small
                  onBlur={handleOnBlur}
                  className={`rounded-lg border-0 bg-slate-50 has-[textarea:focus-visible]:bg-slate-100 has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-slate-300 [&_textarea]:placeholder:text-slate-600 ${!isAdmin ? "pointer-events-none" : ""}`}
                  placeholder="Add note..."
                  left={<IconNote />}
                />
              </TabDisable>
            )}

            <div
              ref={bottomRef}
              className="data-[expanded=false]:h-0 data-[expanded=false]:animate-minimise data-[expanded=true]:animate-expand"
              data-expanded={expanded === "max" || expanded === "min"}
              style={
                {
                  "--content-height": `${bottomHeight}px`,
                  "--content-closed": `0px`,
                } as CSSProperties
              }
            >
              <TabDisable
                className="flex flex-col p-2 pt-0"
                active={expanded === "max"}
              >
                {!skipped && (
                  <Button
                    className="h-9 justify-start gap-1.5 rounded-lg pr-2 text-sm ring-offset-white disabled:text-slate-700 disabled:opacity-100 has-[>div>svg,>svg]:pl-1.5 [&_svg]:text-slate-600 hover:[&_svg]:text-slate-700"
                    size="small"
                    variant="ghost"
                    disabled={!isAdmin}
                  >
                    <IconHourglass />
                    Allocated time: 2 Hrs
                  </Button>
                )}
                <OpeningHours
                  collapsible={false}
                  highligtedDay={new Date().getDay()}
                  hours={data.placeInfo.openingHours?.text}
                  className="gap-1.5 rounded-lg pl-1.5 pr-2"
                  contentClassName="pl-8"
                />
                <Link
                  href="#"
                  className="inline-flex gap-1.5 rounded-lg p-2 pl-1.5 text-sm font-medium text-slate-700 ring-offset-white transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:ring-2 active:ring-slate-200 active:ring-offset-0 [&_svg]:size-5 [&_svg]:text-slate-600 hover:[&_svg]:text-slate-700"
                >
                  <IconExternalLink /> View full information
                </Link>
              </TabDisable>
            </div>
          </motion.div>
        </div>
      );
    },
  ),
  (prev, next) => {
    if (
      prev.data.placeInfo.placeId !== next.data.placeInfo.placeId ||
      prev.onRemove !== next.onRemove ||
      prev.handleMove !== next.handleMove ||
      prev.handleNoteChange !== next.handleNoteChange ||
      prev.isDragging !== next.isDragging ||
      prev.isInDay !== next.isInDay ||
      prev.skipped !== next.skipped
    )
      return false;
    return true;
  },
);

PlaceDetailsCompact.displayName = "PlaceDetailsCompact";

export default PlaceDetailsCompact;
