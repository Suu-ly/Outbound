import PlaceDetailsCompact, {
  PlaceDetailsCompactProps,
} from "@/app/trip/[id]/place-details-compact";
import { cn } from "@/lib/utils";
import { DraggableSyntheticListeners } from "@dnd-kit/core";
import { forwardRef } from "react";

type PlaceDetailsSortWrapperProps = {
  isDragOverlay?: boolean;
  isDragging?: boolean;
  fadeIn?: boolean;
  listeners?: DraggableSyntheticListeners;
  style?: React.CSSProperties;
} & PlaceDetailsCompactProps;

const PlaceDetailsSortWrapper = forwardRef<
  HTMLDivElement,
  PlaceDetailsSortWrapperProps
>(({ isDragOverlay, isDragging, fadeIn, style, listeners, ...rest }, ref) => {
  return (
    <div
      role="button"
      aria-roledescription="draggable place"
      tabIndex={0}
      ref={ref}
      {...listeners}
      style={style}
      className={cn(
        "cursor-grab touch-manipulation rounded-xl ring-offset-zinc-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-4 active:cursor-grabbing",
        isDragOverlay && "shadow-lg",
        isDragging && "opacity-50",
        fadeIn && "duration-300 animate-in fade-in-0",
      )}
    >
      <div
        onKeyDown={(e) => {
          // Prevent the keyboard sensor from picking up space or enter
          if (e.code === "Space" || e.code === "Enter") e.stopPropagation();
        }}
      >
        <PlaceDetailsCompact isDragging={isDragging} {...rest} />
      </div>
    </div>
  );
});

PlaceDetailsSortWrapper.displayName = "PlaceDetailsSortWrapper";

export default PlaceDetailsSortWrapper;
