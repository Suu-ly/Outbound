import DateHydration from "@/components/date-hydration";
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
import { isTripAdminAtom, tripStartDateAtom } from "../atoms";
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
        index,
        children,
      },
      ref,
    ) => {
      const [open, setOpen] = useState(true);
      const isAdmin = useAtomValue(isTripAdminAtom);
      const startDate = useAtomValue(tripStartDateAtom);
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
          className="-mx-2 rounded-2xl bg-gray-100 px-2 py-1 ring-brand-400 transition"
        >
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="flex items-center gap-1 rounded-lg p-2">
                <CollapsibleTrigger
                  aria-label="Show or hide places in this day"
                  className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 data-[state=open]:rotate-90"
                >
                  <IconChevronRight className="text-slate-700" />
                </CollapsibleTrigger>
                <div className="flex w-full gap-4 font-display text-lg font-medium text-slate-900">
                  <span>
                    <DateHydration date={date} />
                  </span>
                  <Separator
                    orientation="vertical"
                    className="h-auto bg-gray-300"
                  />
                  <span>
                    <DateHydration date={date} weekday />
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
              "-mx-1 overflow-hidden px-1 pb-1 data-[state=closed]:animate-minimise data-[state=open]:animate-expand" // Negative margins so textfield active ring is not clipped
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
      );
    },
  ),
);

DayFolder.displayName = "DayFolder";

export default DayFolder;
