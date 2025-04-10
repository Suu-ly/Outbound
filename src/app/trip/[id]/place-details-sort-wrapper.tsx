import PlaceDetailsCompact, {
  PlaceDetailsCompactProps,
} from "@/app/trip/[id]/place-details-compact";
import { cn } from "@/lib/utils";
import { DraggableSyntheticListeners } from "@dnd-kit/core";
import { forwardRef, ReactNode } from "react";

type PlaceDetailsSortWrapperProps = {
  isDragOverlay?: boolean;
  isDragging?: boolean;
  fadeIn?: boolean;
  listeners?: DraggableSyntheticListeners;
  style?: React.CSSProperties;
  children?: ReactNode;
} & PlaceDetailsCompactProps;

const PlaceDetailsSortWrapper = forwardRef<
  HTMLDivElement,
  PlaceDetailsSortWrapperProps
>(
  (
    { isDragOverlay, isDragging, fadeIn, style, listeners, children, ...rest },
    ref,
  ) => {
    return (
      <div
        role="button"
        data-drag-node="true"
        aria-roledescription="draggable place"
        tabIndex={0}
        ref={ref}
        {...listeners}
        style={style}
        className={cn(
          "relative cursor-grab touch-manipulation rounded-xl ring-offset-gray-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 active:cursor-grabbing",
          isDragOverlay && "animate-pickup cursor-grabbing fill-mode-forwards",
          isDragging && "opacity-50",
          fadeIn && "duration-300 animate-in fade-in-0",
        )}
      >
        <PlaceDetailsCompact isDragging={isDragging} {...rest} />
        {children}
      </div>
    );
  },
);

PlaceDetailsSortWrapper.displayName = "PlaceDetailsSortWrapper";

export default PlaceDetailsSortWrapper;
