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
  below?: boolean;
} & PlaceDetailsCompactProps;

const PlaceDetailsSortWrapper = forwardRef<
  HTMLDivElement,
  PlaceDetailsSortWrapperProps
>(
  (
    {
      isDragOverlay,
      isDragging,
      fadeIn,
      style,
      listeners,
      children,
      below,
      ...rest
    },
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
          "relative cursor-grab touch-manipulation rounded-xl ring-offset-zinc-50 transition after:absolute after:inset-x-3 after:h-0 after:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-4 active:cursor-grabbing",
          isDragOverlay && "animate-pickup cursor-grabbing fill-mode-forwards",
          isDragging && "opacity-50",
          fadeIn && "duration-300 animate-in fade-in-0",
          below &&
            "rounded-full after:-bottom-1 after:h-0.5 after:translate-y-1/2 after:bg-brand-400",
          below === false &&
            "rounded-full after:-top-1 after:h-0.5 after:-translate-y-1/2 after:bg-brand-400",
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
