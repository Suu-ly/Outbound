"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectLocation } from "@/server/db/schema";
import { BoundingBox, NominatimResponse } from "@/server/types";
import "mapbox-gl/dist/mapbox-gl.css";
import { useRef, useState } from "react";
import { Layer, Map, MapRef, NavigationControl, Source } from "react-map-gl";

const polygonIntersects = (
  box: BoundingBox,
  polygon: [number, number][],
  gradients: number[],
) => {
  // For loop counts down so it's easier to check the middle point first
  for (let corner = 4; corner >= 0; corner--) {
    let count = 0;
    let point;
    if (corner < 4)
      point = [box[Math.floor(corner / 2)][0], box[corner % 2][1]];
    // Check middle point
    else point = [(box[0][0] + box[1][0]) / 2, (box[0][1] + box[1][1]) / 2];
    for (let i = 0; i < polygon.length - 1; i++) {
      const y1 = polygon[i][1];
      const y2 = polygon[i + 1][1];
      const x1 = polygon[i][0];
      if (
        point[1] < y1 !== point[1] < y2 &&
        point[0] < x1 + (point[1] - y1) * gradients[i]
      )
        count += 1;
    }
    if (count % 2 === 1) return true;
  }
  return false;
};

const getNumWindows = (high: number, low: number) => {
  return Math.ceil(1.5 * Math.log2(high - low + 1) + 0.5);
};

const getSearchWindows = (
  geojson: NominatimResponse[number]["geojson"] | undefined,
): [BoundingBox[], BoundingBox[]] => {
  if (!geojson) return [[], []];
  if (geojson.type === "Point")
    return [
      [
        [
          [geojson.coordinates[0] - 0.1, geojson.coordinates[1] - 0.1],
          [geojson.coordinates[0] + 0.1, geojson.coordinates[1] + 0.1],
        ],
      ],
      [],
    ];
  const windows: BoundingBox[] = [];
  const rejectedWindows: BoundingBox[] = [];
  // Check all polygons
  let currentPolygon: [number, number][];
  for (let i = 0; i < geojson.coordinates.length; i++) {
    if (geojson.type === "Polygon") currentPolygon = geojson.coordinates[0];
    else currentPolygon = geojson.coordinates[i][0];
    let minLon = currentPolygon[0][0];
    let maxLon = currentPolygon[0][0];
    let minLat = currentPolygon[0][1];
    let maxLat = currentPolygon[0][1];
    const memoizeGradients: number[] = new Array(currentPolygon.length - 1);
    memoizeGradients[0] =
      (currentPolygon[1][0] - currentPolygon[0][0]) /
      (currentPolygon[1][1] - currentPolygon[0][1]);
    // Get bounding box of polygon and gradient reciprocal of edges
    for (let j = 1; j < currentPolygon.length - 1; j++) {
      const currentPoint = currentPolygon[j];
      if (minLon > currentPoint[0]) minLon = currentPoint[0];
      if (maxLon < currentPoint[0]) maxLon = currentPoint[0];
      if (minLat > currentPoint[1]) minLat = currentPoint[1];
      if (maxLat < currentPoint[1]) maxLat = currentPoint[1];

      if (currentPolygon[j + 1][1] - currentPoint[1] === 0)
        console.log(currentPolygon[j + 1][1] - currentPoint[1]);
      memoizeGradients[j] =
        (currentPolygon[j + 1][0] - currentPoint[0]) /
        (currentPolygon[j + 1][1] - currentPoint[1]);
    }
    const yWindow = getNumWindows(maxLat, minLat);
    const xWindow = getNumWindows(maxLon, minLon);
    const yStep = (maxLat - minLat) / yWindow;
    const xStep = (maxLon - minLon) / xWindow;
    // Only store search window if it intersects with polygon
    for (let i = 0; i < yWindow * xWindow; i++) {
      const xIndex = i % xWindow;
      const yIndex = Math.floor(i / xWindow);
      const box: BoundingBox = [
        [minLon + xIndex * xStep, minLat + yIndex * yStep],
        [minLon + (xIndex + 1) * xStep, minLat + (yIndex + 1) * yStep],
      ];
      if (
        xWindow * yWindow < 3 ||
        polygonIntersects(box, currentPolygon, memoizeGradients)
      ) {
        windows.push(box);
      } else {
        rejectedWindows.push(box);
      }
    }
  }
  return [windows, rejectedWindows];
};

export default function MapDisplay({
  locations,
}: {
  locations: SelectLocation[];
}) {
  const [selectedLoc, setSelectedLoc] = useState<string>();
  const map = useRef<MapRef | null>(null);

  const onValueChange = (value: string) => {
    setSelectedLoc(value);
    if (map.current)
      map.current.fitBounds(
        locations.find((locations) => locations.name === value)!.viewport,
        {
          maxZoom: 12,
          duration: 0,
          curve: 1,
          padding: 64,
        },
      );
  };

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

  const data = getSearchWindows(
    locations.find((locations) => locations.name === selectedLoc)?.geometry,
  );
  const accepted = windowsToGeojson(data[0]);
  const rejected = windowsToGeojson(data[1]);

  const bounding = locations.find(
    (locations) => locations.name === selectedLoc,
  )?.geometry;

  return (
    <div className="h-screen w-full bg-sky-300">
      <div className="absolute z-50 ml-4 mt-4">
        <Select value={selectedLoc} onValueChange={onValueChange}>
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
        ref={map}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        projection={{
          name: "mercator",
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
        {accepted && (
          <Source data={accepted} type="geojson">
            <Layer
              type="line"
              paint={{ "line-width": 2, "line-color": "#0369a1" }}
            />
          </Source>
        )}
        {rejected && (
          <Source data={rejected} type="geojson">
            <Layer
              type="line"
              paint={{ "line-width": 2, "line-color": "#e11d48" }}
            />
          </Source>
        )}
        {bounding && (
          <Source data={bounding} type="geojson">
            <Layer
              type="line"
              paint={{ "line-width": 2, "line-color": "#15803d" }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
