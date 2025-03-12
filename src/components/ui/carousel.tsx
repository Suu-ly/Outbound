"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiResponse, PlacesPhoto } from "@/server/types";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { EmblaCarouselType, EmblaEventType } from "embla-carousel";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { motion, MotionValue, useSpring, useTransform } from "motion/react";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import Spinner from "./spinner";

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
  slidesInView: number[];
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
  React.HTMLAttributes<HTMLDivElement> & CarouselProps & { disabled?: boolean }
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
        watchDrag: disabled,
      },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const [carouselLength, setCarouselLength] = React.useState(0);
    const [slidesInView, setSlidesInView] = React.useState<number[]>([]);

    const updateSlidesInView = React.useCallback(
      (emblaApi: EmblaCarouselType) => {
        setSlidesInView((slidesInView) => {
          if (slidesInView.length === emblaApi.slideNodes().length) {
            // All slides viewed before, no longer need to keep track of slides in view
            emblaApi.off("slidesInView", updateSlidesInView);
          }
          const inView = emblaApi
            .slidesInView()
            .filter((index) => !slidesInView.includes(index));
          return slidesInView.concat(inView);
        });
      },
      [],
    );

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
        if (
          (orientation === "horizontal" && event.key === "ArrowLeft") ||
          (orientation === "vertical" && event.key === "ArrowUp")
        ) {
          event.preventDefault();
          scrollPrev();
        } else if (
          (orientation === "horizontal" && event.key === "ArrowRight") ||
          (orientation === "vertical" && event.key === "ArrowDown")
        ) {
          event.preventDefault();
          scrollNext();
        }
      },
      [orientation, scrollPrev, scrollNext],
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
      updateSlidesInView(api);
      api.on("reInit", onSelect);
      api.on("select", onSelect);
      api.on("slidesInView", updateSlidesInView);

      return () => {
        api?.off("select", onSelect);
      };
    }, [api, onSelect, updateSlidesInView]);

    React.useEffect(() => {
      if (!api) return;
      if (disabled) api.reInit({ watchDrag: false });
      else api.reInit({ watchDrag: true });
    }, [api, disabled]);

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
          slidesInView,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn(
            "relative ring-slate-400 ring-offset-white transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4",
            className,
          )}
          role="region"
          tabIndex={0}
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

const PLACEHOLDER_SRC =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D";

const CarouselGoogleImage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    photo: PlacesPhoto;
    index: number;
    alt: string;
  }
>(({ className, photo, index, alt, ...props }, ref) => {
  const { slidesInView } = useCarousel();
  const [loaded, setLoaded] = React.useState(false);
  const inView = slidesInView.includes(index);

  const getGoogleImage = async (name: string) => {
    if (process.env.NEXT_PUBLIC_USE_REAL_DATA === "false") return "";
    const urlParams = new URLSearchParams([["name", name]]);
    const data = await fetch(`/api/places/image?${urlParams.toString()}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<string>);
    if (data.status === "error") {
      throw new Error(data.message);
    }
    return data.data;
  };

  const { data } = useQuery({
    queryKey: ["google_image", photo.name],
    queryFn: () => getGoogleImage(photo.name),
    enabled: inView,
    meta: {
      errorMessage: "Unable to load image",
    },
  });

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "relative size-full min-w-0 shrink-0 grow-0 basis-full bg-white",
        className,
      )}
      {...props}
    >
      {!loaded && <Spinner className="absolute inset-0 m-auto size-8" />}
      <img
        className={`size-full object-cover ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
        onLoad={() => {
          if (data) setLoaded(true);
        }}
        src={data ? data : PLACEHOLDER_SRC}
        alt={alt}
        referrerPolicy="no-referrer"
      />
      <div className="absolute bottom-2 right-2 flex gap-3 rounded-lg bg-slate-950/70 p-1.5 backdrop-blur">
        {photo.authorAttributions.map((author) => (
          <div key={author.uri} className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarImage
                src={author.photoUri}
                alt={author.displayName}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <AvatarFallback>
                {author.displayName.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs text-slate-200">{author.displayName}</div>
          </div>
        ))}
      </div>
    </div>
  );
});
CarouselGoogleImage.displayName = "CarouselGoogleImage";

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
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
  React.ComponentProps<typeof Button> & { absolute?: boolean }
>(({ className, variant = "outline", absolute = false, ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  if (absolute)
    return (
      <button
        className={`transition-colors hover:underline focus-visible:bg-slate-900/5 focus-visible:outline-none ${
          orientation === "vertical"
            ? "absolute inset-x-0 top-0 h-1/2"
            : "absolute inset-y-0 left-0 w-1/2"
        }`}
        aria-label="Previous slide"
        onClick={() => {
          if (canScrollPrev) scrollPrev(true);
        }}
      >
        <span className="sr-only">Previous slide</span>
      </button>
    );

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
  React.ComponentProps<typeof Button> & { absolute?: boolean }
>(({ className, variant = "outline", absolute = false, ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  if (absolute)
    return (
      <button
        className={`transition-colors hover:underline focus-visible:bg-slate-900/5 focus-visible:outline-none ${
          orientation === "vertical"
            ? "absolute inset-x-0 bottom-0 h-1/2"
            : "absolute inset-y-0 right-0 w-1/2"
        }`}
        aria-label="Next slide"
        onClick={() => {
          if (canScrollNext) scrollNext(true);
        }}
      >
        <span className="sr-only">Next slide</span>
      </button>
    );
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
      tabIndex={-1}
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

  const trackLength = (carouselLength - 1) * 10 + 32; // 10 = dot size + gap

  const scrollProgress = useSpring(0, { stiffness: 700, damping: 50 });
  const translate = useTransform(
    scrollProgress,
    [0, 1],
    [
      Math.min(trackLength / 2 - 16, 20), // translate 20 to center first dot at max width of 84px, 84 - 4(border) - 8(padding) / 2 = 36 - 16 = 20
      -trackLength + Math.min(52, trackLength / 2 + 16), // translate 52 to center last dot at max width of 84px, 84 - 4(border) - 8(padding) / 2 = 36 + 16 = 52
    ],
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
          ? "left-2 top-1/2 max-h-[84px] -translate-y-1/2"
          : "bottom-2 left-1/2 max-w-[84px] -translate-x-1/2",
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

const TWEEN_FACTOR_BASE = 0.45;

const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max);

type TimeSliderProps =
  | { type: "minutes"; className?: string; onSelect: (time: number) => void }
  | {
      type: "hours";
      length: number;
      className?: string;
      onSelect: (time: number) => void;
    };

const CarouselTimeSlider = React.forwardRef<HTMLDivElement, TimeSliderProps>(
  ({ className, onSelect, ...props }, ref) => {
    const { api } = useCarousel();
    const tweenFactor = React.useRef(0);

    const setTweenFactor = React.useCallback((emblaApi: EmblaCarouselType) => {
      tweenFactor.current =
        TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length;
    }, []);

    const tweenOpacity = React.useCallback(
      (emblaApi: EmblaCarouselType, eventName?: EmblaEventType) => {
        const engine = emblaApi.internalEngine();
        const scrollProgress = emblaApi.scrollProgress();
        const slidesInView = emblaApi.slidesInView();
        const isScrollEvent = eventName === "scroll";

        emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
          let diffToTarget = scrollSnap - scrollProgress;
          const slidesInSnap = engine.slideRegistry[snapIndex];

          slidesInSnap.forEach((slideIndex) => {
            if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

            if (engine.options.loop) {
              engine.slideLooper.loopPoints.forEach((loopItem) => {
                const target = loopItem.target();

                if (slideIndex === loopItem.index && target !== 0) {
                  const sign = Math.sign(target);

                  if (sign === -1) {
                    diffToTarget = scrollSnap - (1 + scrollProgress);
                  }
                  if (sign === 1) {
                    diffToTarget = scrollSnap + (1 - scrollProgress);
                  }
                }
              });
            }
            const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current);
            const opacity = numberWithinRange(tweenValue, 0, 1).toString();
            emblaApi.slideNodes()[slideIndex].style.opacity = opacity;
          });
        });
      },
      [],
    );
    const selectEvent = React.useCallback(
      (e: EmblaCarouselType) => {
        const time =
          props.type === "minutes"
            ? e.selectedScrollSnap() * 5
            : e.selectedScrollSnap();
        onSelect(time);
      },
      [onSelect, props.type],
    );

    React.useEffect(() => {
      if (!api) return;

      setTweenFactor(api);
      tweenOpacity(api);
      api
        .on("reInit", setTweenFactor)
        .on("reInit", tweenOpacity)
        .on("scroll", tweenOpacity)
        .on("slideFocus", tweenOpacity)
        .on("select", selectEvent);

      return () => {
        api
          .off("reInit", setTweenFactor)
          .off("reInit", tweenOpacity)
          .off("scroll", tweenOpacity)
          .off("slideFocus", tweenOpacity)
          .off("select", selectEvent);
      };
    }, [api, onSelect, selectEvent, setTweenFactor, tweenOpacity]);

    return (
      <CarouselContent className="-mt-2 h-48" ref={ref}>
        {props.type === "minutes" &&
          Array.from({ length: 12 }).map((_, index) => (
            <CarouselItem
              key={index}
              className={cn(
                "w-8 basis-1/5 select-none pt-2 text-center text-2xl font-medium text-slate-900",
                className,
              )}
            >
              {index * 5}
            </CarouselItem>
          ))}
        {props.type === "hours" &&
          Array.from({ length: props.length }).map((_, index) => (
            <CarouselItem
              key={index}
              className={cn(
                "w-8 basis-1/5 select-none pt-2 text-center text-2xl font-medium text-slate-900",
                className,
              )}
            >
              {index}
            </CarouselItem>
          ))}
      </CarouselContent>
    );
  },
);

CarouselTimeSlider.displayName = "CarouselTimeSlider";

export {
  Carousel,
  CarouselContent,
  CarouselGoogleImage,
  CarouselIndicator,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselTimeSlider,
  type CarouselApi,
};
