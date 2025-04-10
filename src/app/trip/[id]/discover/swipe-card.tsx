"use client";

import TabDisable from "@/components/tab-disable";
import {
  Carousel,
  CarouselContent,
  CarouselGoogleImage,
  CarouselIndicator,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Skeleton from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TripPlaceDetails } from "@/server/types";
import { useAtomValue, useSetAtom } from "jotai";
import {
  animate,
  motion,
  MotionStyle,
  PanInfo,
  useDragControls,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import {
  forwardRef,
  memo,
  PointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  drawerDragProgressAtom,
  drawerMinimisedAtom,
  scrolledToTopAtom,
} from "../../atoms";
import PlaceDetails from "../place-details";

type CardProps = {
  data: TripPlaceDetails;
  index: number;
  active: boolean;
  magnetFunctionX: (x: number) => void;
  magnetFunctionY: (y: number) => void;
  onDecision: (data: TripPlaceDetails, accepted: boolean) => void;
  onRemove: (id: string) => void;
  draggable?: boolean;
  mobile?: boolean;
};

const DRAG_THRESHOLD = 200;
const VELOCITY_THRESHOLD = 600;
const TARGET_WINDOW = 96;

export default memo(
  forwardRef<Record<string, () => void>, CardProps>(function Card(
    {
      data,
      index,
      active,
      magnetFunctionX,
      magnetFunctionY,
      onDecision,
      onRemove,
      draggable = true,
      mobile,
    },
    ref,
  ) {
    const [status, setStatus] = useState<"none" | "reject" | "accept">("none");
    const [isDragging, setIsDragging] = useState(false);
    const controls = useDragControls();

    const rawMinimised = useAtomValue(drawerMinimisedAtom);
    const minimised = rawMinimised && mobile;

    const drawerProgress = useAtomValue(drawerDragProgressAtom);
    const imageHeight = useTransform(
      () => drawerProgress?.get() * (mobile ? 400 : 520),
    );
    const spacer = useTransform(() => drawerProgress?.get() * 12);

    const setScrolledToTop = useSetAtom(scrolledToTopAtom);

    const activeTime = useRef<number>(Infinity);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [ready, setReady] = useState(false);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);

    const handlePanStart = useCallback(
      (event: globalThis.PointerEvent, info: PanInfo) => {
        if (Math.abs(info.offset.x) > Math.abs(info.offset.y) && !minimised) {
          // If no scrollbars previously and window was resized
          if (scrollContainerRef.current) {
            setScrollbarWidth(
              scrollContainerRef.current.offsetWidth -
                scrollContainerRef.current.clientWidth,
            );
          }
          controls.start(event);
        }
      },
      [controls, minimised],
    );

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const xVelocity = useVelocity(x);
    const xSmooth = useSpring(xVelocity, { damping: 15, mass: 2.5 });
    const rotate = useTransform(
      xSmooth,
      [-4000, -3000, 3000, 4000],
      [-3, -2.5, 2.5, 3],
      {
        clamp: false,
      },
    );

    const acceptPlace = useCallback(
      (info?: PanInfo) => {
        setStatus("accept");
        onDecision(data, true);

        const containerDims =
          scrollContainerRef.current!.getBoundingClientRect();

        const width = isDragging
          ? containerDims.width / 2 / 0.97
          : containerDims.width / 2;
        const height = isDragging
          ? containerDims.height / 2 / 0.97
          : containerDims.height / 2;

        const targetX = mobile
          ? window.innerWidth - width - 8 - 58
          : window.innerWidth - width - 8 - 128;
        const targetY = mobile
          ? window.innerHeight - 56 - height - 4 - 24
          : window.innerHeight - 56 - height - 16 - 26;
        animate(x, targetX, {
          type: "spring",
          damping: 16,
          velocity: info ? info.velocity.x : 0,
          onUpdate(latest) {
            if (
              latest > targetX - TARGET_WINDOW &&
              latest < targetX + TARGET_WINDOW
            )
              magnetFunctionX(-(latest - targetX) * 0.2);
          },
        });
        animate(y, targetY, {
          type: "spring",
          damping: 16,
          velocity: info ? info.velocity.y : 0,
          onUpdate(latest) {
            if (
              latest > targetY - TARGET_WINDOW &&
              latest < targetY + TARGET_WINDOW
            ) {
              magnetFunctionY(-(latest - targetY) * 0.2);
            }
          },
        }).then(() => onRemove(data.id));
      },
      [
        data,
        isDragging,
        magnetFunctionX,
        magnetFunctionY,
        mobile,
        onDecision,
        onRemove,
        x,
        y,
      ],
    );

    const rejectPlace = useCallback(
      (info?: PanInfo) => {
        setStatus("reject");
        onDecision(data, false);

        if (!info) {
          animate(x, -480, {
            duration: 0.6,
            ease: [0.11, 0, 0.5, 0],
          });
          animate(y, window.innerHeight - 56, {
            duration: 0.6,
            ease: [0.4, 0.02, 0.66, -0.36],
          }).then(() => onRemove(data.id));
        } else {
          animate(y, window.innerHeight - 56, {
            duration: 0.6,
            ease: [0.4, 0.0, 0.2, 1],
            velocity: info ? info.velocity.y : 0,
          }).then(() => onRemove(data.id));
        }
      },
      [data, onDecision, onRemove, x, y],
    );

    useImperativeHandle(ref, () => {
      return {
        triggerAccept() {
          if (Date.now() - activeTime.current < 500) return;
          acceptPlace();
        },
        triggerReject() {
          if (Date.now() - activeTime.current < 500) return;
          rejectPlace();
        },
      };
    }, [acceptPlace, rejectPlace]);

    const handleDragStart = useCallback(() => {
      setIsDragging(true);
    }, []);

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
    ) => {
      setIsDragging(false);
      if (
        (info.offset.x <= -DRAG_THRESHOLD && info.velocity.x <= 0) ||
        (info.velocity.x < -VELOCITY_THRESHOLD && info.offset.x < 0)
      ) {
        rejectPlace(info);
      } else if (
        (info.offset.x >= DRAG_THRESHOLD && info.velocity.x >= 0) ||
        (info.velocity.x > VELOCITY_THRESHOLD && info.offset.x > 0)
      ) {
        acceptPlace(info);
      } else {
        animate(x, 0);
        animate(y, 0);
      }
    };

    useEffect(() => {
      let timeout: NodeJS.Timeout;
      const scrollContainer = scrollContainerRef.current;
      const handleTopScroll = (e: Event) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollTop === 0) {
          clearTimeout(timeout);
          timeout = setTimeout(() => setScrolledToTop(true), 300);
        } else {
          clearTimeout(timeout);
          setScrolledToTop(false);
        }
      };

      if (active) {
        setScrolledToTop(true);
        activeTime.current = Date.now();
        if (scrollContainer) {
          scrollContainer.addEventListener("scroll", handleTopScroll);
        }
      }
      return () =>
        scrollContainer?.removeEventListener("scroll", handleTopScroll);
    }, [active, setScrolledToTop]);

    // Prevent layout shift due to hiding of scrollbar
    useLayoutEffect(() => {
      if (scrollContainerRef && scrollContainerRef.current) {
        setScrollbarWidth(
          scrollContainerRef.current.offsetWidth -
            scrollContainerRef.current.clientWidth,
        );
        setReady(true);
      }
    }, []);

    const hideScroll =
      (isDragging || status !== "none" || !active || minimised) && ready;

    return (
      <motion.div
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-[--index] size-full touch-none select-none sm:w-1/2 xl:w-1/3",
          active && "animate-activate",
          active || (status !== "none" && "will-change-transform"),
        )}
        drag={draggable}
        dragListener={false}
        whileDrag={{
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          cursor: "grabbing",
          scale: 0.97,
          borderRadius: "2rem",
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={
          {
            x,
            y,
            rotateZ: rotate,
            "--index": 3 - index,
          } as MotionStyle
        }
        onPanStart={handlePanStart}
        dragControls={controls}
      >
        <motion.div
          ref={scrollContainerRef}
          className={cn(
            "relative size-full overflow-x-hidden overscroll-y-none transition-colors",
            status === "none"
              ? "bg-gray-50"
              : status === "reject"
                ? "bg-rose-500"
                : "bg-emerald-500",
            hideScroll ? "overflow-y-hidden" : "overflow-y-auto",
            isDragging || minimised ? "touch-none" : "touch-pan-y",
          )}
          style={{
            paddingRight: hideScroll ? `${scrollbarWidth}px` : undefined,
          }}
          animate={
            status === "accept"
              ? {
                  clipPath:
                    "inset(calc(50% - 16px) calc(50% - 16px) calc(50% - 16px) calc(50% - 16px) round 16rem)",
                  transition: {
                    duration: 0.5,
                    ease: [0.4, 0, 0.2, 1],
                  },
                }
              : isDragging || status === "reject"
                ? {
                    clipPath: "inset(0% 0% 0% 0% round 2rem)",
                  }
                : { clipPath: "inset(0%)" }
          }
        >
          <div
            aria-hidden={true}
            className={cn(
              "pointer-events-none fixed inset-0 z-10 bg-black transition-opacity duration-500",
              !active && status === "none" ? "opacity-50" : "opacity-0",
            )}
          ></div>
          <div className="pb-20 pt-2 sm:pb-20">
            <TabDisable active={active && !minimised}>
              <motion.div
                style={
                  mobile
                    ? { paddingTop: spacer, paddingBottom: spacer }
                    : { paddingTop: 12, paddingBottom: 12 }
                }
              >
                {data.photos === undefined && (
                  <Skeleton className="mx-4 h-[400px] rounded-xl bg-white sm:h-[520px]" />
                )}
                {data.photos && (
                  <motion.div
                    style={mobile ? { height: imageHeight } : undefined}
                    className="mx-4 overflow-hidden rounded-xl"
                  >
                    <Carousel
                      orientation="vertical"
                      className={cn(isDragging && "pointer-events-none")}
                      disabled={true}
                    >
                      <div className="relative overflow-hidden rounded-xl bg-white transition-transform active:scale-[0.985]">
                        <CarouselContent className="mt-0 h-[400px] w-full sm:h-[520px]">
                          {data.photos.map((photo, index) => (
                            <CarouselGoogleImage
                              key={photo.name}
                              alt={data.displayName}
                              index={index}
                              photo={photo}
                            />
                          ))}
                        </CarouselContent>
                        <CarouselPrevious absolute />
                        <CarouselNext absolute />
                      </div>
                      <CarouselIndicator />
                    </Carousel>
                  </motion.div>
                )}
              </motion.div>
              <div className="pt-2">
                <PlaceDetails data={data} />
              </div>
            </TabDisable>
          </div>
        </motion.div>
      </motion.div>
    );
  }),
);
