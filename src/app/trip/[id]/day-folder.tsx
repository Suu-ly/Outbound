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
  CSSProperties,
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
        <div
          data-drag-node="true"
          className={`${isDragOverlay ? "animate-pickup cursor-grabbing fill-mode-forwards" : ""}`}
        >
          <Collapsible
            ref={ref}
            {...props}
            className={cn(
              "rounded-xl ring-brand-400 ring-offset-8 ring-offset-zinc-50 transition",
              hover && "ring-2",
              isDragging && "opacity-50",
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
                aria-label="Show or hide places in this day"
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
            <CollapsibleContent
              className={
                "overflow-hidden data-[state=closed]:animate-minimise data-[state=open]:animate-expand"
              }
              style={
                {
                  "--content-height": `var(--radix-collapsible-content-height)`,
                  "--content-closed": "0px",
                } as CSSProperties
              }
            >
              <div className="mt-4">
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    },
  ),
);

DayFolder.displayName = "DayFolder";

export default DayFolder;
