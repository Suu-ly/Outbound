import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlaceData, PlaceDataEntry } from "@/server/types";
import { UniqueIdentifier } from "@dnd-kit/core";
import { IconGripVertical } from "@tabler/icons-react";
import {
  ComponentPropsWithoutRef,
  Dispatch,
  forwardRef,
  memo,
  ReactNode,
  SetStateAction,
} from "react";
import DayFolder, { DayFolderProps } from "./day-folder";

export const SavedPlacesWrapper = memo(
  forwardRef<
    HTMLDivElement,
    { children: ReactNode; hover: boolean | undefined }
  >(({ children, hover }, ref) => {
    return (
      <div
        className={`flex min-h-32 flex-col gap-2 rounded-xl ring-brand-400 ring-offset-zinc-50 transition ${hover ? "ring-2 ring-offset-8" : ""}`}
        ref={ref}
      >
        {children}
      </div>
    );
  }),
);

SavedPlacesWrapper.displayName = "SavedPlacesWrapper";

type DayFolderSortWrapperProps = {
  startDate: Date;
  index: number;
  children?: ReactNode;
  dayId?: UniqueIdentifier;
  handleMove?: (
    isInDay: number | string,
    data: PlaceDataEntry,
    newDay: number | string,
  ) => void;
  setLoadingState?: Dispatch<SetStateAction<Record<keyof PlaceData, string[]>>>;
  handleProps?: ComponentPropsWithoutRef<"button">;
  style?: React.CSSProperties;
  hover?: boolean;
  isDragging?: boolean;
  isDragOverlay?: boolean;
} & DayFolderProps;

export const DayFolderSortWrapper = forwardRef<
  HTMLDivElement,
  DayFolderSortWrapperProps
>(
  (
    {
      startDate,
      index,
      children,
      dayId,
      handleMove,
      setLoadingState,
      handleProps,
      style,
      hover,
      isDragging,
      isDragOverlay,
      isOpen,
      onOpenChange,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-drag-node="true"
        className={cn(
          "relative rounded-xl ring-brand-400 ring-offset-zinc-50 transition",
          isDragOverlay && "animate-pickup cursor-grabbing fill-mode-forwards",
          hover && "ring-2 ring-offset-8",
          isDragging && "opacity-50",
        )}
        style={style}
      >
        <Button
          iconOnly
          variant="ghost"
          size="small"
          aria-label="Drag handle"
          className={cn(
            `absolute right-1 top-1.5 shrink-0 cursor-grab touch-manipulation active:cursor-grabbing`,
            isDragOverlay && "cursor-grabbing",
          )}
          {...handleProps}
        >
          <IconGripVertical />
        </Button>
        <DayFolder
          dayId={dayId}
          startDate={startDate}
          index={index}
          handleMove={handleMove}
          setLoadingState={setLoadingState}
          isOpen={Boolean(isOpen && !isDragging)}
          onOpenChange={onOpenChange}
        >
          {children}
        </DayFolder>
      </div>
    );
  },
);

DayFolderSortWrapper.displayName = "DayFolderSortWrapper";
