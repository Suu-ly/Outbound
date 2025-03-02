import DiscoverManager from "./discover-manager";
import MissingImageManager from "./missing-image-manager";
import SwipeManager from "./swipe-manager";

export default async function TripSwipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const realData = process.env.NEXT_PUBLIC_USE_REAL_DATA === "true";
  const tripId = (await params).id;
  return (
    <>
      {realData && <DiscoverManager tripId={tripId} />}
      <MissingImageManager />
      <SwipeManager tripId={tripId} />
    </>
  );
}
