"use client";
import { BoundingBox } from "@/server/types";
import "mapbox-gl/dist/mapbox-gl.css";
// import { Map, NavigationControl } from "react-map-gl";

export default function MapView({
  initialBounds,
}: {
  initialBounds: BoundingBox;
}) {
  return (
    <div className="size-full bg-sky-300 sm:w-1/2 xl:w-2/3">
      {/* <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          bounds: initialBounds.map((lowHigh) =>
            lowHigh.map((coord) => parseFloat(coord)),
          ) as BoundingBox,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        reuseMaps
      >
        <NavigationControl
          position="top-left"
          style={{
            marginTop: "1rem",
            marginLeft: "1rem",
            border: "2px solid #e2e8f0",
            boxShadow:
              "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            borderRadius: "2rem",
          }}
        />
      </Map> */}
    </div>
  );
}
