"use client";

import {
  dayPlacesAtom,
  isTripAdminAtom,
  mapActiveMarkerAtom,
  tripStartDateAtom,
} from "@/app/trip/atoms";
import OpeningHours from "@/components/opening-hours";
import ShareButton from "@/components/share-button";
import TabDisable from "@/components/tab-disable";
import TimePicker from "@/components/time-picker";
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
import { minsToString } from "@/lib/utils";
import { PlaceDataEntry } from "@/server/types";
import {
  IconCalendarRepeat,
  IconDotsVertical,
  IconExternalLink,
  IconHourglass,
  IconNote,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";
import { addDays } from "date-fns";
import { useAtomValue, useSetAtom } from "jotai";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChangeEvent,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type PlaceDetailsCompactProps = {
  data: PlaceDataEntry;
  isInDay?: number | "saved";
  dayIndex?: number;
  isDragging?: boolean;
  onRemove?: (isInDay: number | "saved", placeId: string) => void;
  handleMove?: (
    isInDay: number | "saved",
    data: PlaceDataEntry,
    newDay: number | "saved",
  ) => void;
  handleNoteChange?: (
    isInDay: number | "saved",
    placeId: string,
    note: string,
  ) => void;
  handleDurationChange?: (
    isInDay: number | "saved",
    placeId: string,
    timeSpent: number,
  ) => void;
};

const PlaceDetailsCompact = memo(
  forwardRef<HTMLDivElement, PlaceDetailsCompactProps>(
    (
      {
        data,
        isInDay = "saved",
        dayIndex,
        isDragging,
        onRemove,
        handleMove,
        handleNoteChange,
        handleDurationChange,
      },
      ref,
    ) => {
      const [expanded, setExpanded] = useState<"min" | "mid" | "max">(
        data.userPlaceInfo.note ? "mid" : "min",
      );
      const tripId = useParams<{ id: string }>().id;
      const startDate = useAtomValue(tripStartDateAtom);
      const days = useAtomValue(dayPlacesAtom);
      const isAdmin = useAtomValue(isTripAdminAtom);
      const setActiveMapMarker = useSetAtom(mapActiveMarkerAtom);
      const isLarge = useMediaQuery("(min-width: 1280px)");
      const [inputRows, setInputRows] = useState(1);
      const [note, setNote] = useState(
        data.userPlaceInfo.note ? data.userPlaceInfo.note : "",
      );
      const [timePickerOpen, setTimePickerOpen] = useState(false);

      const noteRef = useRef<HTMLTextAreaElement | null>(null);
      const inputIsFocused = useRef(false);

      const handleOnClick = useCallback(() => {
        if (expanded !== "max") {
          setActiveMapMarker({
            isInDay: isInDay === "saved" ? null : isInDay,
            placeId: data.placeInfo.placeId,
            position: [
              data.placeInfo.location.longitude,
              data.placeInfo.location.latitude,
            ],
            type: "saved",
            name: data.placeInfo.displayName,
            shouldAnimate: true,
          });
        }
        setExpanded((prev) => {
          if (prev === "min" || prev === "mid") return "max";
          if (note) return "mid";
          return "min";
        });
      }, [data, expanded, isInDay, note, setActiveMapMarker]);

      const onAddNote = useCallback(() => {
        if (expanded === "min") setExpanded("mid");
        setTimeout(() => {
          noteRef.current?.focus();
          inputIsFocused.current = true;
        }, 200); // If you bump the mouse while the dropdown menu is closing, the input will lose focus
      }, [expanded]);

      const handleTextChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
          setNote(e.currentTarget.value);
          if (!noteRef.current) return;

          noteRef.current.style.height = "0";
          setInputRows(Math.min(noteRef.current.scrollHeight / 24, 4)); // 24 for line height
          noteRef.current.style.removeProperty("height");
        },
        [],
      );

      const handleOnFocus = useCallback(() => {
        if (expanded === "min") setExpanded("mid");
        inputIsFocused.current = true;
      }, [expanded]);

      const handleOnBlur = useCallback(() => {
        if (!isAdmin) return;
        if (!note && expanded === "mid") setExpanded("min");
        if (note && expanded === "min") setExpanded("mid");
        if (handleNoteChange)
          handleNoteChange(isInDay, data.placeInfo.placeId, note);
        inputIsFocused.current = false;
      }, [
        data.placeInfo.placeId,
        expanded,
        handleNoteChange,
        isAdmin,
        isInDay,
        note,
      ]);

      useEffect(() => {
        if (inputIsFocused.current && noteRef.current) {
          requestAnimationFrame(() => {
            noteRef.current?.focus();
          });
        }
      }, [isLarge]);

      const hoursDayIndex =
        dayIndex !== undefined
          ? addDays(startDate, dayIndex).getDay()
          : new Date().getDay();

      const currentHours =
        data.placeInfo.openingHours?.text[
          (((hoursDayIndex - 1) % 7) + 7) % 7
        ].split(": ")[1];
      return (
        <div
          ref={ref}
          id={data.placeInfo.placeId}
          aria-expanded={expanded === "max" && !isDragging}
          className="overflow-clip rounded-xl bg-white p-2 ring-offset-zinc-50 transition has-[[data-trigger=true]:focus-visible]:outline-none has-[[data-trigger=true]:focus-visible]:ring-2 has-[[data-trigger=true]:focus-visible]:ring-slate-400 has-[[data-trigger=true]:focus-visible]:ring-offset-2"
        >
          <div className="flex items-start">
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
            <div className="min-w-0 grow xl:min-h-24">
              <div className="flex">
                <button
                  data-trigger={true}
                  onClick={handleOnClick}
                  className="flex min-h-[60px] min-w-0 grow flex-col items-start text-left focus-visible:outline-none"
                >
                  <div className="mb-1 w-full">
                    <div
                      className="text-xs font-medium"
                      style={{ color: data.placeInfo.typeColor }}
                    >
                      {data.placeInfo.primaryTypeDisplayName}
                    </div>
                    <h3 className="break-words font-medium text-slate-900">
                      {data.placeInfo.displayName}
                    </h3>
                  </div>
                  {data.placeInfo.openingHours && (
                    <div
                      className={`text-xs font-medium ${currentHours === "Closed" ? "text-rose-600" : "text-slate-700"}`}
                    >
                      {currentHours}
                    </div>
                  )}
                </button>
                {!isAdmin && (
                  <ShareButton
                    className={`shrink-0`}
                    link={data.placeInfo.googleMapsLink}
                    message="Google maps link copied to clipboard!"
                  />
                )}
                {isAdmin && (
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
                        message="Google maps link copied to clipboard!"
                        isDropdown
                      />
                      <DropdownMenuItem
                        onSelect={onAddNote}
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
              {(isAdmin || !!note) && (
                <Textarea
                  rows={inputRows}
                  value={note}
                  ref={isLarge ? noteRef : undefined}
                  onChange={handleTextChange}
                  small
                  onFocus={handleOnFocus}
                  onBlur={handleOnBlur}
                  className={`mt-3 hidden rounded-lg border-0 bg-slate-50 has-[textarea:focus-visible]:bg-slate-100 has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-slate-300 xl:flex [&_textarea]:placeholder:text-slate-600 ${!isAdmin ? "pointer-events-none" : ""}`}
                  placeholder="Add note..."
                  left={<IconNote />}
                />
              )}
            </div>
          </div>
          <motion.div
            initial={note ? { height: "auto" } : { height: 0 }}
            animate={expanded === "min" ? { height: 0 } : { height: "auto" }}
            transition={{
              duration: 0.3,
              ease: [0.8, 0, 0.2, 1],
            }}
          >
            {(isAdmin || !!note) && (
              <TabDisable
                className="pt-2 xl:hidden"
                active={expanded !== "min"}
              >
                <Textarea
                  rows={inputRows}
                  ref={!isLarge ? noteRef : undefined}
                  value={note}
                  onChange={handleTextChange}
                  small
                  onFocus={handleOnFocus}
                  onBlur={handleOnBlur}
                  className={`rounded-lg border-0 bg-slate-50 has-[textarea:focus-visible]:bg-slate-100 has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-slate-300 [&_textarea]:placeholder:text-slate-600 ${!isAdmin ? "pointer-events-none" : ""}`}
                  placeholder="Add note..."
                  left={<IconNote />}
                />
              </TabDisable>
            )}
            <motion.div
              initial={{ height: 0 }}
              animate={
                expanded === "min" || expanded === "mid" || isDragging
                  ? { height: 0 }
                  : { height: "auto" }
              }
              transition={{
                duration: 0.3,
                ease: [0.8, 0, 0.2, 1],
              }}
            >
              <TabDisable
                className="flex flex-col pt-2 xl:pt-2"
                active={expanded === "max"}
              >
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <Button
                    className="h-9 w-full justify-start gap-1.5 rounded-lg pr-2 text-sm ring-offset-white disabled:text-slate-700 disabled:opacity-100 has-[>div>svg,>svg]:pl-1.5 [&_svg]:text-slate-600"
                    size="small"
                    variant="ghost"
                    onClick={() => setTimePickerOpen(true)}
                    disabled={!isAdmin}
                  >
                    <IconHourglass />
                    Allocated time: {minsToString(data.userPlaceInfo.timeSpent)}
                  </Button>
                </div>
                <OpeningHours
                  collapsible={false}
                  highligtedDay={hoursDayIndex}
                  hours={data.placeInfo.openingHours?.text}
                  className="gap-1.5 rounded-lg pl-1.5 pr-2"
                  contentClassName="pl-8"
                />
                <Link
                  href={`/trip/${tripId}/${data.placeInfo.placeId}`}
                  className="inline-flex gap-1.5 rounded-lg p-2 pl-1.5 text-sm font-medium text-slate-700 ring-offset-white transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:ring-2 active:ring-slate-200 active:ring-offset-0 [&_svg]:size-5 [&_svg]:text-slate-600"
                >
                  <IconExternalLink /> View full information
                </Link>
              </TabDisable>
            </motion.div>
          </motion.div>
          <TimePicker
            onOpenChange={setTimePickerOpen}
            open={timePickerOpen}
            header="Select time spent"
            description={`Change the amount of time spent at ${data.placeInfo.displayName}.`}
            startHours={Math.floor(data.userPlaceInfo.timeSpent / 60)}
            hoursLength={12}
            hoursLoop={false}
            startMinutes={data.userPlaceInfo.timeSpent % 60}
            isDuration
            onConfirm={(close, hours, mins) => {
              if (
                handleDurationChange &&
                hours * 60 + mins !== data.userPlaceInfo.timeSpent
              )
                handleDurationChange(
                  isInDay,
                  data.placeInfo.placeId,
                  hours * 60 + mins,
                );
              close();
            }}
          />
        </div>
      );
    },
  ),
);

PlaceDetailsCompact.displayName = "PlaceDetailsCompact";

export default PlaceDetailsCompact;
