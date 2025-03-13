import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Separator } from "@/components/ui/separator";
import { PlaceData, PlaceDataEntry } from "@/server/types";
import {
  IconCalendarTime,
  IconChevronRight,
  IconSelector,
} from "@tabler/icons-react";
import { addDays } from "date-fns";
import { useAtomValue } from "jotai";
import {
  ComponentRef,
  CSSProperties,
  Dispatch,
  forwardRef,
  memo,
  ReactNode,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { isTripAdminAtom } from "../atoms";
import TripAutocomplete from "./trip-autocomplete";

export type DayFolderProps = {
  handleMove?: (
    isInDay: number | "saved",
    data: PlaceDataEntry,
    newDay: number | "saved",
  ) => void;
  setLoadingState?: Dispatch<SetStateAction<Record<keyof PlaceData, string[]>>>;
  isOpen?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  startDate: Date;
  index: number;
  dayId?: number;
  children?: ReactNode;
  startTimeChange?: (dayId: number) => void;
};

const DayFolder = memo(
  forwardRef<ComponentRef<typeof Collapsible>, DayFolderProps>(
    (
      {
        isOpen,
        onOpenChange,
        dayId,
        handleMove,
        setLoadingState,
        startTimeChange,
        startDate,
        index,
        children,
      },
      ref,
    ) => {
      const [open, setOpen] = useState(true);
      const isAdmin = useAtomValue(isTripAdminAtom);
      const date = useMemo(() => addDays(startDate, index), [startDate, index]);
      const toggleExpand = useCallback(() => {
        if (onOpenChange) onOpenChange((prev) => !prev);
        else setOpen((prev) => !prev);
      }, [onOpenChange]);
      return (
        <Collapsible
          ref={ref}
          open={isOpen !== undefined ? isOpen : open}
          onOpenChange={!!onOpenChange ? onOpenChange : setOpen}
          className="-mx-4"
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="mx-4 flex items-center gap-1 rounded-lg bg-white p-2 pr-1">
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
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              {isAdmin && startTimeChange && dayId && (
                <ContextMenuItem onSelect={() => startTimeChange(dayId)}>
                  <IconCalendarTime /> Change day start time
                </ContextMenuItem>
              )}
              <ContextMenuItem onSelect={toggleExpand}>
                <IconSelector />
                {isOpen !== undefined
                  ? isOpen
                    ? "Collapse day"
                    : "Expand day"
                  : open
                    ? "Collapse day"
                    : "Expand day"}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
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
            <div className="mt-4 px-4">
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
      );
    },
  ),
);

DayFolder.displayName = "DayFolder";

export default DayFolder;
