"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { TripPlaceDetails } from "@/server/types";
import { Slot } from "@radix-ui/react-slot";
import {
  IconCheck,
  IconCopy,
  IconMapPin,
  IconPhone,
  IconWorld,
} from "@tabler/icons-react";
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
} from "framer-motion";
import Link from "next/link";
import { PointerEvent, ReactNode, useCallback, useRef, useState } from "react";
import { toast } from "sonner";

type CardProps = {
  data: TripPlaceDetails;
  index: number;
  active: boolean;
  magnetFunctionX: (x: number) => void;
  magnetFunctionY: (y: number) => void;
  onDecision: (id: string, accepted: boolean) => void;
  onRemove: (id: string) => void;
  minimised?: boolean;
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
  const [, copyToClipboard] = useCopyToClipboard();

  const onCopy = useCallback(() => {
    copyToClipboard(copy);
    toast.success(successMessage ?? "Copied to clipboard!", {
      id: copy,
    });
  }, [copy, copyToClipboard, successMessage]);

  const Comp = asChild ? Slot : "div";

  return (
    <div className="group relative">
      <Comp className="inline-flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 [&_svg]:size-5 [&_svg]:text-slate-600">
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
            <IconCopy />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltipLabel}</TooltipContent>
      </Tooltip>
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
          if (!value) return;
          return (
            <div
              key={key}
              className="inline-flex items-center gap-2 text-sm text-slate-700"
            >
              {check && <IconCheck size={20} className="text-slate-600" />}
              {keyLookup[key as keyof typeof info]}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Card({
  data,
  index,
  active,
  magnetFunctionX,
  magnetFunctionY,
  onDecision,
  onRemove,
  minimised,
}: CardProps) {
  const [status, setStatus] = useState<"none" | "reject" | "accept">("none");
  const [isDragging, setIsDragging] = useState(false);
  const controls = useDragControls();

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
      onDecision(data.id, false);
      setStatus("reject");
      animate(y, window.innerHeight, {
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1],
        velocity: info.velocity.y,
      }).then(() => onRemove(data.id));
    } else if (
      (info.offset.x >= DRAG_THRESHOLD && info.velocity.x >= 0) ||
      (info.velocity.x > VELOCITY_THRESHOLD && info.offset.x > 0)
    ) {
      onDecision(data.id, true);
      setStatus("accept");
      // const targetX = window.innerWidth - 16 - 32 - 128;
      // const targetY = window.innerHeight - 64 - 32;

      const containerDims = scrollContainerRef.current!.getBoundingClientRect();
      const targetX =
        window.innerWidth - containerDims.width / 2 - 4 - 16 - 128;
      const targetY = window.innerHeight - containerDims.height / 2 - 16 - 64;
      animate(x, targetX, {
        type: "spring",
        damping: 16,
        velocity: info.velocity.x,
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
        velocity: info.velocity.y,
        onUpdate(latest) {
          if (
            latest > targetY - TARGET_WINDOW &&
            latest < targetY + TARGET_WINDOW
          ) {
            magnetFunctionY(-(latest - targetY) * 0.2);
          }
        },
      }).then(() => onRemove(data.id));
    } else {
      animate(x, 0);
      animate(y, 0);
    }
  };

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
        "pointer-events-none absolute left-0 top-14 z-[--index] h-[calc(100dvh-56px)] w-full touch-none select-none overflow-hidden transition-colors will-change-transform sm:w-1/2 xl:w-1/3",
        status === "none"
          ? "bg-zinc-50"
          : status === "reject"
            ? "bg-red-600"
            : "bg-emerald-500",
        active && "animate-activate",
      )}
      drag
      dragListener={false}
      whileDrag={{
        cursor: "grabbing",
        clipPath: "inset(0% 0% 0% 0% round 2rem)",
        scale: 0.97,
        boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      }}
      animate={
        status === "accept" && {
          clipPath:
            "inset(calc(50% - 32px) calc(50% - 32px) calc(50% - 32px) calc(50% - 32px) round 24rem)",
          transition: {
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          },
        }
      }
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotateZ: rotate, "--index": 3 - index } as MotionStyle}
      onPanStart={handlePanStart}
      dragControls={controls}
    >
      <div
        ref={scrollContainerRef}
        // Set opacity here so it's not laggy on firefox opacity-[98.99%]
        className={`relative size-full overscroll-y-none ${isDragging || minimised ? "touch-none" : "touch-pan-y"} overflow-x-hidden ${hideScroll ? "overflow-y-hidden" : "overflow-y-auto"}`}
        // style={{
        //   paddingRight: hideScroll ? `${scrollbarWidth}px` : undefined,
        // }}
      >
        <div
          aria-hidden={true}
          className={cn(
            "pointer-events-none fixed inset-0 z-10 bg-black transition-opacity duration-500",
            !active && status === "none" ? "opacity-50" : "opacity-0",
          )}
        ></div>
        <div className="flex flex-col gap-6 pb-20">
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
          <div className="px-4 text-slate-700">{data.description}</div>
          {data.rating !== null && (
            <div className="space-y-3 px-4">
              <div className="flex flex-col gap-3 xl:flex-row">
                <div className="flex w-full flex-col items-center justify-center gap-3 rounded-xl bg-amber-300 py-4 text-center">
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
                <div className="rounded-xl bg-white p-4" key={review.name}>
                  <div className="mb-4 flex gap-1.5">
                    <span className="text-xs font-medium text-slate-700">
                      {review.rating.toFixed(1)}
                    </span>
                    <Rating
                      rating={review.rating}
                      size={16}
                      className="text-amber-400"
                    />
                    <span className="text-xs text-slate-500">
                      {review.relativePublishTimeDescription}
                    </span>
                  </div>
                  <div className="mb-6">
                    <div className="mb-2 line-clamp-3 text-slate-700">
                      {review.originalText.text}
                    </div>
                    <button className="text-xs font-medium text-slate-900 hover:underline">
                      Read more
                    </button>
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
                <IconMapPin />
                {data.address}
              </InfoWithCopy>
              {data.website && (
                <InfoWithCopy
                  copy={data.website}
                  tooltipLabel="Copy website URL"
                  successMessage="Website URL copied to clipboard!"
                  asChild
                >
                  <Link href={data.website} target="_blank">
                    <IconWorld />
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
                  <IconPhone />
                  {data.phone}
                </InfoWithCopy>
              )}
            </TooltipProvider>
          </div>
          <Separator />
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
  );
}
