import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconGripVertical } from "@tabler/icons-react";
import { ComponentPropsWithoutRef, forwardRef, memo, ReactNode } from "react";
import DayFolder, { DayFolderProps } from "./day-folder";

export const SavedPlacesWrapper = memo(
  forwardRef<
    HTMLDivElement,
    { children: ReactNode; hover: boolean | undefined }
  >(({ children, hover }, ref) => {
    return (
      <div
        className={`flex min-h-32 flex-col gap-2 rounded-xl ring-brand-400 ring-offset-gray-50 transition ${hover ? "ring-2 ring-offset-8" : "ring-0 ring-offset-0"}`}
        ref={ref}
      >
        {children}
      </div>
    );
  }),
);

SavedPlacesWrapper.displayName = "SavedPlacesWrapper";

type DayFolderSortWrapperProps = {
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
      children,
      handleProps,
      style,
      hover,
      isDragging,
      isDragOverlay,
      isOpen,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-drag-node="true"
        style={style}
        className={
          isDragOverlay
            ? "animate-pickup cursor-grabbing rounded-xl fill-mode-forwards"
            : ""
        }
      >
        <div
          className={cn(
            "relative transition-opacity",
            hover && "[&>div]:bg-gray-200 [&>div]:ring-2",
            isDragging && "opacity-50",
          )}
        >
          <Button
            iconOnly
            variant="ghost"
            size="small"
            aria-label="Drag handle"
            className={cn(
              `absolute right-0.5 top-2.5 shrink-0 cursor-grab touch-manipulation ring-offset-gray-100 active:cursor-grabbing`,
              isDragOverlay && "cursor-grabbing",
            )}
            {...handleProps}
          >
            <IconGripVertical />
          </Button>
          <DayFolder isOpen={isOpen && !isDragging} {...rest}>
            {children}
          </DayFolder>
        </div>
      </div>
    );
  },
);

DayFolderSortWrapper.displayName = "DayFolderSortWrapper";
