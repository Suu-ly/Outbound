import OpeningHours from "@/components/opening-hours";
import Rating from "@/components/ui/rating";
import { Separator } from "@/components/ui/separator";
import { TripPlaceDetails } from "@/server/types";
import {
  IconCheck,
  IconMapPin,
  IconPhone,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { forwardRef } from "react";
import { InfoWithCopy, Review } from "./place-details-client-components";

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
