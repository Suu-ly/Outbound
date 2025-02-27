import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PlaceData, PlaceDataEntry } from "@/server/types";
import { IconChevronRight, IconGripVertical } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import {
  ComponentPropsWithoutRef,
  ComponentRef,
  Dispatch,
  forwardRef,
  memo,
  SetStateAction,
  useState,
} from "react";
import { isTripAdminAtom } from "../atoms";
import TripAutocomplete from "./trip-autocomplete";

type DayFolderProps = {
  handleMove?: (
    isInDay: number | string,
    data: PlaceDataEntry,
    newDay: number | string,
  ) => void;
  setLoadingState?: Dispatch<SetStateAction<Record<keyof PlaceData, string[]>>>;
  isOpen?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  date: Date;
  hover?: boolean;
  handleProps?: ComponentPropsWithoutRef<"button">;
  isDragOverlay?: boolean;
  isDragging?: boolean;
  dayId?: number | string;
};

const DayFolder = memo(
  forwardRef<
    ComponentRef<typeof Collapsible>,
    ComponentPropsWithoutRef<typeof Collapsible> & DayFolderProps
  >(
    (
      {
        isOpen,
        onOpenChange,
        dayId,
        handleMove,
        setLoadingState,
        className,
        date,
        children,
        handleProps,
        hover,
        isDragOverlay,
        isDragging,
        ...props
      },
      ref,
    ) => {
      const [open, setOpen] = useState(true);
      const isAdmin = useAtomValue(isTripAdminAtom);
      return (
        <Collapsible
          ref={ref}
          {...props}
          className={cn(
            "space-y-4 rounded-xl ring-brand-400 ring-offset-8 ring-offset-zinc-50 transition-[box-shadow,opacity]",
            hover && "ring-2",
            isDragging && "opacity-50",
            isDragOverlay && "shadow-lg",
          )}
          open={
            isOpen !== undefined
              ? isOpen
              : open && !isDragOverlay && !isDragging
          }
          onOpenChange={!!onOpenChange ? onOpenChange : setOpen}
        >
          <div
            className={cn(
              "flex items-center gap-1 rounded-lg bg-white p-2 pr-1",
              className,
            )}
          >
            <CollapsibleTrigger
              aria-label="Open or close this day"
              className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 data-[state=open]:rotate-90"
            >
              <IconChevronRight className="text-slate-700" />
            </CollapsibleTrigger>
            <div className="flex w-full gap-4 font-display text-lg font-medium text-slate-900">
              <span>
                {date.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                })}
              </span>
              <Separator orientation="vertical" className="h-auto" />
              <span>
                {date.toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </span>
            </div>
            <Button
              iconOnly
              variant="ghost"
              size="small"
              aria-label="Drag handle"
              className={`shrink-0 ${isDragOverlay ? "cursor-grabbing" : "cursor-grab"} touch-manipulation active:cursor-grabbing`}
              {...handleProps}
            >
              <IconGripVertical />
            </Button>
          </div>
          <CollapsibleContent>
            {children}
            {isAdmin &&
              dayId !== undefined &&
              handleMove &&
              setLoadingState && (
                <TripAutocomplete
                  isInDay={dayId}
                  handleMove={handleMove}
                  setLoadingState={setLoadingState}
                />
              )}
          </CollapsibleContent>
        </Collapsible>
      );
    },
  ),
);

DayFolder.displayName = "DayFolder";

export default DayFolder;
