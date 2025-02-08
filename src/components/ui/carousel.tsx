"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { motion, MotionValue, useSpring, useTransform } from "motion/react";
import * as React from "react";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: (jump?: boolean) => void;
  scrollNext: (jump?: boolean) => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  carouselLength: number;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const [carouselLength, setCarouselLength] = React.useState(0);

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return;
      }

      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
      setCarouselLength(api.scrollSnapList().length);
    }, []);

    const scrollPrev = React.useCallback(
      (jump?: boolean) => {
        api?.scrollPrev(jump);
      },
      [api],
    );

    const scrollNext = React.useCallback(
      (jump?: boolean) => {
        api?.scrollNext(jump);
      },
      [api],
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          scrollNext();
        }
      },
      [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
      if (!api || !setApi) {
        return;
      }

      setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
      if (!api) {
        return;
      }

      onSelect(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);

      return () => {
        api?.off("select", onSelect);
      };
    }, [api, onSelect]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
          carouselLength,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation, scrollPrev, scrollNext, canScrollNext, canScrollPrev } =
    useCarousel();

  const handleSlideClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    const target = e.currentTarget.getBoundingClientRect();
    const hit = e.clientY - target.top;
    if (target.height / 2 >= hit && canScrollPrev) {
      scrollPrev(true);
    }
    if (hit > target.height / 2 && canScrollNext) {
      scrollNext(true);
    }
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      onClick={handleSlideClick}
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={() => scrollPrev()}
      {...props}
    >
      <IconArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={() => scrollNext()}
      {...props}
    >
      <IconArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

const CarouselIndicatorButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof motion.button> & {
    index: number;
    scrollProgress: MotionValue;
  }
>(({ className, index, scrollProgress, ...props }, ref) => {
  const { orientation, carouselLength } = useCarousel();

  const backgroundColor = useTransform(() => {
    if (
      Math.abs(scrollProgress.get() - index / (carouselLength - 1)) <
      0.5 / (carouselLength - 1)
    )
      return "#334155";
    return "#E2E8F0";
  });
  const size = useTransform(
    scrollProgress,
    [
      (index - 1) / (carouselLength - 1),
      index / (carouselLength - 1),
      (index + 1) / (carouselLength - 1),
    ],
    [6, 32, 6],
    { clamp: true },
  );

  return (
    <motion.button
      ref={ref}
      className={cn(
        "size-1.5 rounded-full bg-slate-900 ring-offset-zinc-50 transition duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400",
        className,
      )}
      aria-label={`Image ${index + 1}`}
      style={
        orientation === "horizontal"
          ? { width: size, backgroundColor }
          : { height: size, backgroundColor }
      }
      {...props}
    ></motion.button>
  );
});

CarouselIndicatorButton.displayName = "CarouselIndicatorButton";

const CarouselIndicator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => {
  const { orientation, carouselLength, api } = useCarousel();

  const scrollProgress = useSpring(0, { stiffness: 700, damping: 50 });
  const translate = useTransform(
    scrollProgress,
    [0, 1],
    [carouselLength * 10 - 32, -(carouselLength * 10 - 32)], // 10 = dot size + gap
  );

  const onScroll = React.useCallback(
    (emblaApi: EmblaCarouselType) => {
      const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
      scrollProgress.set(progress);
    },
    [scrollProgress],
  );

  const onDotButtonClick = React.useCallback(
    (index: number) => {
      if (!api) return;
      api.scrollTo(index);
    },
    [api],
  );

  React.useEffect(() => {
    if (!api) return;
    onScroll(api);
    api.on("scroll", onScroll);
  }, [api, onScroll]);
  return (
    <div
      ref={ref}
      className={cn(
        "absolute overflow-hidden rounded-full border-2 border-slate-200 bg-white p-1 shadow-md",
        orientation === "vertical"
          ? "left-2 top-1/2 max-h-20 -translate-y-1/2"
          : "bottom-2 left-1/2 max-w-20 -translate-x-1/2",
        className,
      )}
      {...props}
    >
      <motion.div
        className={cn("flex gap-1", orientation === "vertical" && "flex-col")}
        style={
          orientation === "horizontal" ? { x: translate } : { y: translate }
        }
      >
        {Array.from({ length: carouselLength }).map((_, index) => (
          <CarouselIndicatorButton
            index={index}
            key={index}
            scrollProgress={scrollProgress}
            onClick={() => onDotButtonClick(index)}
          />
        ))}
      </motion.div>
    </div>
  );
});

CarouselIndicator.displayName = "CarouselIndicator";

export {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
};
