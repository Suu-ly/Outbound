"use client";

import OpeningHours from "@/components/opening-hours";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselGoogleImage,
  CarouselIndicator,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Rating from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useCopyToClipboard from "@/lib/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { PlacesReview, TripPlaceDetails } from "@/server/types";
import { Slot } from "@radix-ui/react-slot";
import {
  IconCheck,
  IconCopy,
  IconMapPin,
  IconPhone,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
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
import Link from "next/link";
import {
  CSSProperties,
  forwardRef,
  PointerEvent,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  drawerDragProgressAtom,
  drawerMinimisedAtom,
  scrolledToTopAtom,
} from "../../atoms";

type CardProps = {
  data: TripPlaceDetails;
  index: number;
  active: boolean;
  magnetFunctionX: (x: number) => void;
  magnetFunctionY: (y: number) => void;
  onDecision: (id: string, accepted: boolean) => void;
  onRemove: (id: string) => void;
  draggable?: boolean;
  mobile?: boolean;
};

const DRAG_THRESHOLD = 200;
const VELOCITY_THRESHOLD = 600;
const TARGET_WINDOW = 96;

const InfoWithCopy = ({
  copy,
  tooltipLabel,
  successMessage,
  asChild = false,
  children,
}: {
  copy: string;
  tooltipLabel: string;
  successMessage?: string;
  asChild?: boolean;
  children: ReactNode;
}) => {
  const [copied, copyToClipboard] = useCopyToClipboard();

  const onCopy = useCallback(() => {
    copyToClipboard(copy);
    toast.success(successMessage ?? "Copied to clipboard!", {
      id: copy,
    });
  }, [copy, copyToClipboard, successMessage]);

  const Comp = asChild ? Slot : "div";

  return (
    <div className="group relative">
      <Comp className="inline-flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 [&_svg]:size-5 [&_svg]:text-slate-600">
        {children}
      </Comp>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            iconOnly
            onClick={onCopy}
            size="small"
            className="absolute right-4 top-0.5 hidden bg-slate-100 group-hover:inline-flex"
          >
            {copied ? <IconCheck /> : <IconCopy />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltipLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
};

const Review = ({ review }: { review: PlacesReview }) => {
  const [expanded, setExpanded] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(72);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textNode = useRef<HTMLDivElement>(null);

  const handleOnClick = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (textNode.current) {
        setScrollHeight(textNode.current.scrollHeight);
        setIsOverflowing(textNode.current.scrollHeight > 72);
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="rounded-xl bg-white p-4">
      <div className="mb-4 flex gap-1.5">
        <span className="text-xs font-medium text-slate-700">
          {review.rating.toFixed(1)}
        </span>
        <Rating rating={review.rating} size={16} className="text-amber-400" />
        <span className="text-xs text-slate-500">
          {review.relativePublishTimeDescription}
        </span>
      </div>
      <div className="mb-6" id={review.name}>
        <p
          className={cn(
            "mb-1 overflow-hidden whitespace-pre-line text-slate-700",
            isOverflowing && !expanded && "line-clamp-3",
            isOverflowing &&
              "data-[expanded=false]:animate-minimise data-[expanded=true]:animate-expand",
          )}
          style={
            {
              "--content-height": `${scrollHeight}px`,
              "--content-closed": "4.5rem",
            } as CSSProperties
          }
          data-expanded={expanded}
          ref={textNode}
        >
          {review.text
            ? review.text.text
            : review.originalText
              ? review.originalText.text
              : ""}
        </p>
        {isOverflowing && (
          <button
            className="-m-2 p-2 text-xs font-medium text-brand-600 hover:underline"
            aria-expanded={expanded}
            aria-controls={review.name}
            onClick={handleOnClick}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Avatar className="rounded-none">
          <AvatarImage
            src={review.authorAttribution.photoUri}
            alt={review.authorAttribution.displayName}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <AvatarFallback>
            {review.authorAttribution.displayName.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-slate-700">
          {review.authorAttribution.displayName}
        </span>
      </div>
    </div>
  );
};

const keyLookup = {
  wheelchairAccessibleParking: "Parking",
  wheelchairAccessibleEntrance: "Entrance",
  wheelchairAccessibleRestroom: "Restroom",
  wheelchairAccessibleSeating: "Seating",
  freeParkingLot: "Free parking",
  paidParkingLot: "Paid parking",
  freeStreetParking: "Free street parking",
  paidStreetParking: "Paid street parking",
  valetParking: "Valet parking",
  freeGarageParking: "Free garage parking",
  paidGarageParking: "Paid garage parking",
  acceptsCreditCards: "Credit card",
  acceptsDebitCards: "Debit card",
  acceptsCashOnly: "Cash only",
  acceptsNfc: "NFC payments",
  outdoorSeating: "Outdoor seating",
  liveMusic: "Live music",
  goodForChildren: "Good for children",
  allowsDogs: "Dogs allowed",
  restroom: "Public restrooms",
  goodForGroups: "Good for groups",
  goodForWatchingSports: "Good for watching sports",
};

const InfoGrid = ({
  info,
  header,
  check = true,
}: {
  info: TripPlaceDetails[
    | "accessibilityOptions"
    | "additionalInfo"
    | "paymentOptions"
    | "amenities"
    | "parkingOptions"];
  header: string;
  check?: boolean;
}) => {
  if (!info || Object.values(info).length === 0) return;
  return (
    <div className="space-y-3 px-4">
      <span className="text-sm font-medium text-slate-900">{header}</span>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(info).map(([key, value]) => {
          if (!check && !value) return;
          return (
            <div
              key={key}
              className="inline-flex items-center gap-2 text-sm text-slate-700"
            >
              {check &&
                (value ? (
                  <IconCheck size={20} className="text-slate-600" />
                ) : (
                  <IconX size={20} className="text-slate-600" />
                ))}
              {keyLookup[key as keyof typeof info]}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default forwardRef<Record<string, () => void>, CardProps>(function Card(
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
  const imageHeight = useTransform(() => drawerProgress?.get() * 400);
  const spacer = useTransform(() => drawerProgress?.get() * 12);

  const setScrolledToTop = useSetAtom(scrolledToTopAtom);

  const activeTime = useRef<number>(Infinity);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePanStart = useCallback(
    (event: globalThis.PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) > Math.abs(info.offset.y) && !minimised) {
        // If no scrollbars previously and window was resized
        // if (scrollContainerRef.current) {
        //   setScrollbarWidth(
        //     scrollContainerRef.current.offsetWidth -
        //       scrollContainerRef.current.clientWidth,
        //   );
        // }
        controls.start(event);
      }
    },
    [controls, minimised],
  );

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xVelocity = useVelocity(x);
  const xSmooth = useSpring(xVelocity, { damping: 15 });
  const rotate = useTransform(xSmooth, [-3000, 3000], [-2.5, 2.5], {
    clamp: true,
  });

  const acceptPlace = useCallback(
    (info?: PanInfo) => {
      setStatus("accept");
      onDecision(data.id, true);

      const containerDims = scrollContainerRef.current!.getBoundingClientRect();

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
      data.id,
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
      onDecision(data.id, false);

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
    [data.id, onDecision, onRemove, x, y],
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

  //Prevent layout shift due to hiding of scrollbar
  // useLayoutEffect(() => {
  //   if (scrollContainerRef && scrollContainerRef.current) {
  //     setScrollbarWidth(
  //       scrollContainerRef.current.offsetWidth -
  //         scrollContainerRef.current.clientWidth,
  //     );
  //     setReady(true);
  //   }
  // }, []);

  const hideScroll = isDragging || status !== "none" || !active || minimised;

  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute left-0 top-0 z-[--index] size-full touch-none select-none will-change-transform sm:w-1/2 xl:w-1/3",
        active && "animate-activate",
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
        // Set opacity here so it's not laggy on firefox opacity-[98.99%]
        className={cn(
          "relative size-full overflow-x-hidden overscroll-y-none transition-colors",
          status === "none"
            ? "bg-zinc-50"
            : status === "reject"
              ? "bg-red-600"
              : "bg-emerald-500",
          hideScroll ? "overflow-y-hidden" : "overflow-y-auto",
          isDragging || minimised ? "touch-none" : "touch-pan-y",
        )}
        // style={{
        //   paddingRight: hideScroll ? `${scrollbarWidth}px` : undefined,
        // }}
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
        <div className="pb-36 pt-2 sm:pb-20">
          <motion.div
            role="presentation"
            style={
              mobile
                ? { paddingTop: spacer, paddingBottom: spacer }
                : { paddingTop: 12, paddingBottom: 12 }
            }
          >
            {data.photos && (
              <Carousel
                orientation="vertical"
                className={cn("mx-4", isDragging && "pointer-events-none")}
                disabled={true}
              >
                <motion.div
                  style={mobile ? { height: imageHeight } : undefined}
                  className="relative overflow-hidden rounded-xl bg-white transition-transform active:scale-[0.985]"
                >
                  <CarouselContent className="mt-0 h-[400px] w-full">
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
                  <CarouselIndicator />
                </motion.div>
              </Carousel>
            )}
          </motion.div>
          <div className="flex flex-col gap-6 pt-2">
            <div className="space-x-1 px-4">
              <h1 className="font-display text-2xl font-medium text-slate-900">
                {data.displayName}
              </h1>
              <p
                className="text-sm font-medium"
                style={{ color: data.typeColor }}
              >
                {data.primaryTypeDisplayName}
              </p>
            </div>
            {data.description && (
              <div className="px-4 text-slate-700">{data.description}</div>
            )}
            {data.rating !== null && (
              <div className="space-y-3 px-4">
                <div className="flex flex-col gap-3 xl:flex-row">
                  <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl bg-amber-300 p-4 text-center">
                    <div>
                      <h3 className="font-display text-6xl font-medium text-slate-900">
                        {data.rating?.toFixed(1)}
                      </h3>
                      <Rating rating={data.rating} className="text-slate-900" />
                    </div>
                    <p className="text-lg text-amber-900">
                      based on {data.ratingCount} reviews
                    </p>
                  </div>
                  {data.reviewHighlight && (
                    <div className="w-full space-y-2 rounded-xl bg-violet-100 p-4">
                      <p className="font-medium text-indigo-700">
                        What people say
                      </p>
                      <h3 className="font-display text-2xl font-medium text-indigo-900">
                        {data.reviewHighlight}
                      </h3>
                    </div>
                  )}
                </div>
                {data.reviews?.map((review) => (
                  <Review review={review} key={review.name} />
                ))}
              </div>
            )}
            <div>
              <TooltipProvider delayDuration={300}>
                <InfoWithCopy
                  copy={data.address}
                  tooltipLabel="Copy address"
                  successMessage="Address copied to clipboard!"
                >
                  <IconMapPin className="shrink-0" />
                  {data.address}
                </InfoWithCopy>
                <OpeningHours
                  highligtedDay={new Date().getDay()}
                  hours={data.openingHours?.text}
                />
                {data.website && (
                  <InfoWithCopy
                    copy={data.website}
                    tooltipLabel="Copy website URL"
                    successMessage="Website URL copied to clipboard!"
                    asChild
                  >
                    <Link href={data.website} target="_blank">
                      <IconWorld className="shrink-0" />
                      {data.website}
                    </Link>
                  </InfoWithCopy>
                )}
                {data.phone && (
                  <InfoWithCopy
                    copy={data.phone}
                    tooltipLabel="Copy phone number"
                    successMessage="Phone number copied to clipboard!"
                  >
                    <IconPhone className="shrink-0" />
                    {data.phone}
                  </InfoWithCopy>
                )}
              </TooltipProvider>
            </div>
            {(data.accessibilityOptions ||
              data.parkingOptions ||
              data.paymentOptions ||
              data.amenities ||
              data.additionalInfo) && <Separator />}
            <InfoGrid
              info={data.accessibilityOptions}
              header="Wheelchair Accessibility"
            />
            <InfoGrid info={data.paymentOptions} header="Payment Options" />
            <InfoGrid info={data.parkingOptions} header="Parking Options" />
            <InfoGrid info={data.amenities} header="Amenities" check={false} />
            <InfoGrid
              info={data.additionalInfo}
              header="Additional Info"
              check={false}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
