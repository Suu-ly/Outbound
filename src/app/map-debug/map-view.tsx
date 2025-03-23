"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectLocation } from "@/server/db/schema";
import { BoundingBox } from "@/server/types";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";
import { Layer, Map, NavigationControl, Source } from "react-map-gl";

export default function MapDisplay({
  locations,
}: {
  locations: SelectLocation[];
}) {
  const [selectedLoc, setSelectedLoc] = useState<string>();

  const windowsToGeojson = (windows: BoundingBox[] | undefined) => {
    if (!windows) return undefined;
    const features = [];
    const coords = [0, 1, 1, 0];
    for (let i = 0; i < windows.length; i++) {
      const box = new Array(5);
      const currentWindow = windows[i];
      for (let j = 0; j < 4; j++) {
        box[j] = [
          currentWindow[Math.floor(j / 2)][0],
          currentWindow[coords[j]][1],
        ];
      }
      box[4] = box[0];
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: box,
        },
      });
    }
    return {
      type: "FeatureCollection",
      features: features,
    };
  };

  const data = windowsToGeojson(
    locations.find((locations) => locations.name === selectedLoc)?.windows,
  );

  return (
    <div className="h-screen w-full bg-sky-300">
      <div className="absolute z-50 ml-4 mt-4">
        <Select value={selectedLoc} onValueChange={setSelectedLoc}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.name}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Map
        id="map"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        projection={{
          name: "globe",
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <NavigationControl
          position="top-right"
          style={{
            marginTop: "1rem",
            marginLeft: "1rem",
            border: "2px solid #e2e8f0",
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            borderRadius: "2rem",
            overflow: "hidden",
            // backgroundColor: "#fafafa",
          }}
        />
        {data && (
          <Source data={data} type="geojson">
            <Layer type="line" paint={{ "line-width": 2 }} />
          </Source>
        )}
      </Map>
    </div>
  );
}
