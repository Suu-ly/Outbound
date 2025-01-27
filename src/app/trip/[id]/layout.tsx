import Header from "@/components/header";
import MapView from "./map-view";
import TripDataFetcher from "./trip-data-fetcher";
import TripHeaderItems from "./trip-header-items";

export default async function TripLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}>) {
  const id = (await params).id;

  return (
    <TripDataFetcher id={id}>
      <Header>
        <TripHeaderItems />
      </Header>
      <div className="flex h-[calc(100dvh-56px)]">
        {children}
        <MapView />
      </div>
    </TripDataFetcher>
  );
}
