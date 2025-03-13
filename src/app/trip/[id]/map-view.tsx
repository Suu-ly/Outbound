"use client";
import { markerColorLookup } from "@/lib/color-lookups";
import { BoundingBox } from "@/server/types";
import { useAtomValue, useSetAtom } from "jotai";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect } from "react";
import {
  Layer,
  Map,
  Marker,
  NavigationControl,
  Source,
  useMap,
} from "react-map-gl";
import {
  dayPlacesAtom,
  mapActiveMarkerAtom,
  travelTimesAtom,
  tripPlacesAtom,
} from "../atoms";

export default function MapView({
  initialBounds,
}: {
  initialBounds: BoundingBox;
}) {
  // const showMap = process.env.NEXT_PUBLIC_USE_REAL_DATA === "true";
  // if (!showMap)
  //   return <div className="size-full bg-sky-300 sm:w-1/2 xl:w-2/3"></div>;
  useMapViewManager();
  const setActiveMarker = useSetAtom(mapActiveMarkerAtom);

  const handleMapClick = useCallback(() => {
    setActiveMarker(undefined);
  }, [setActiveMarker]);

  return (
    <div className="size-full bg-sky-300 sm:w-1/2 xl:w-2/3">
      <Map
        id="map"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          bounds: initialBounds,
        }}
        onClick={handleMapClick}
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
        <TripMarkers />
      </Map>
    </div>
  );
}

const TripMarkers = () => {
  const places = useAtomValue(tripPlacesAtom);
  const activeMapMarker = useAtomValue(mapActiveMarkerAtom);
  const days = useAtomValue(dayPlacesAtom);

  return (
    <>
      {days.map((day, dayIndex) =>
        places[day.dayId].map((place, index) => (
          <Marker
            key={place.placeInfo.placeId + "marker"}
            longitude={place.placeInfo.location.longitude}
            latitude={place.placeInfo.location.latitude}
            anchor="bottom"
          >
            <div
              className={`flex size-6 items-center justify-center rounded-full border-2 border-slate-700 transition-transform ${markerColorLookup[dayIndex % markerColorLookup.length]} ${activeMapMarker?.placeId === place.placeInfo.placeId ? "scale-150" : ""}`}
            >
              {index + 1}
            </div>
          </Marker>
        )),
      )}
      {activeMapMarker && activeMapMarker.isInDay !== null && (
        <RouteLines activeDay={activeMapMarker.isInDay} />
      )}
    </>
  );
};

const useMapViewManager = () => {
  const activeMapMarker = useAtomValue(mapActiveMarkerAtom);
  const places = useAtomValue(tripPlacesAtom);
  const { map } = useMap();

  useEffect(() => {
    if (!map || !activeMapMarker) return;
    let bounds = activeMapMarker.bounds;
    if (activeMapMarker.isInDay !== null) {
      const dayPlaces = places[activeMapMarker.isInDay];
      let minLon = dayPlaces[0].placeInfo.location.longitude,
        minLat = dayPlaces[0].placeInfo.location.latitude,
        maxLon = dayPlaces[0].placeInfo.location.longitude,
        maxLat = dayPlaces[0].placeInfo.location.latitude;
      for (let i = 1, length = dayPlaces.length; i < length; i++) {
        if (minLon > dayPlaces[i].placeInfo.location.longitude)
          minLon = dayPlaces[i].placeInfo.location.longitude;
        if (maxLon < dayPlaces[i].placeInfo.location.longitude)
          maxLon = dayPlaces[i].placeInfo.location.longitude;
        if (minLat > dayPlaces[i].placeInfo.location.latitude)
          minLat = dayPlaces[i].placeInfo.location.latitude;
        if (maxLat < dayPlaces[i].placeInfo.location.latitude)
          maxLat = dayPlaces[i].placeInfo.location.latitude;
      }
      bounds = [
        [minLon, minLat],
        [maxLon, maxLat],
      ];
    }
    map.fitBounds(bounds, {
      maxZoom: 13,
      duration: 4000,
      curve: 1,
      padding: 32,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMapMarker, map]);
};

const RouteLines = ({ activeDay }: { activeDay: string | number }) => {
  const places = useAtomValue(tripPlacesAtom);
  const travelTimes = useAtomValue(travelTimesAtom);

  if (activeDay === "saved") return;

  const getRouteLinesFromGraph = () => {
    const features = [];
    const activePlaces = places[activeDay];
    for (let i = 0, length = activePlaces.length - 1; i < length; i++) {
      if (
        travelTimes[activePlaces[i].placeInfo.placeId] &&
        travelTimes[activePlaces[i].placeInfo.placeId][
          activePlaces[i + 1].placeInfo.placeId
        ]
      ) {
        const routes =
          travelTimes[activePlaces[i].placeInfo.placeId][
            activePlaces[i + 1].placeInfo.placeId
          ];
        if (routes.mode) {
          // Typescript foolery
          const routesModes = routes[routes.mode];
          if (routesModes.route)
            features.push({
              type: "Feature",
              geometry: routesModes.geometry,
            });
        }
      }
    }
    return {
      type: "FeatureCollection",
      features: features,
    };
  };
  const data = getRouteLinesFromGraph();
  return (
    <Source data={data} type="geojson">
      <Layer
        type="line"
        layout={{
          "line-cap": "round",

          "line-join": "round",
        }}
        paint={{
          "line-color": "#f43f5e",
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2, 15, 8],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 5, 1, 15, 0.6],
        }}
      />
    </Source>
  );
};
