import DiscoverManager from "./discover-manager";
import MissingImageManager from "./missing-image-manager";
import SwipeManager from "./swipe-manager";

export default async function TripSwipePage() {
  const realData = process.env.NEXT_PUBLIC_USE_REAL_DATA === "true";

  return (
    <>
      {realData && <DiscoverManager />}
      <MissingImageManager />
      <SwipeManager />
    </>
  );
}
