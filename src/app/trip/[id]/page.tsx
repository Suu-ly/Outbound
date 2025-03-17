import TripPage from "./trip-page";

export default async function MainTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tripId = (await params).id;

  return <TripPage tripId={tripId} />;
}
