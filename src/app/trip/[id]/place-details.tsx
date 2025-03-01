import OpeningHours from "@/components/opening-hours";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Rating from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import useCopyToClipboard from "@/lib/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { PlacesReview, TripPlaceDetails } from "@/server/types";
import { Slot } from "@radix-ui/react-slot";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import {
  IconCheck,
  IconCopy,
  IconMapPin,
  IconPhone,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import {
  CSSProperties,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

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
      <Comp className="inline-flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 [&_svg]:size-5 [&_svg]:text-slate-600">
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
            className="-m-2 rounded-full p-2 text-xs font-medium text-brand-600 ring-offset-zinc-50 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
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

type PlaceDetailsProps = {
  data: TripPlaceDetails;
};

export const PlaceDetails = forwardRef<HTMLDivElement, PlaceDetailsProps>(
  ({ data }, ref) => {
    return (
      <div className="flex flex-col gap-6" ref={ref}>
        <div className="space-y-1 px-4">
          <h1 className="font-display text-2xl font-medium text-slate-900">
            {data.displayName}
          </h1>
          <p className="text-sm font-medium" style={{ color: data.typeColor }}>
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
                  <p className="font-medium text-indigo-700">What people say</p>
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
              <Link
                href={data.website}
                target="_blank"
                className="ring-offset-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
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
    );
  },
);

PlaceDetails.displayName = "PlaceDetails";

export default PlaceDetails;
