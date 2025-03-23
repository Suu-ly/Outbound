import { db } from "@/server/db";
import { location } from "@/server/db/schema";
import MapDisplay from "./map-view";

export default async function MapDebug() {
  const locations = await db.select().from(location);

  return <MapDisplay locations={locations} />;
}
