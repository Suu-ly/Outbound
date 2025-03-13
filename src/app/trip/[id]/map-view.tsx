"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { markerColorLookup } from "@/lib/color-lookups";
import { SelectTripPlace } from "@/server/db/schema";
import { BoundingBox, LngLat } from "@/server/types";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
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
  mapUndecidedActiveMarkerAtom,
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
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            borderRadius: "2rem",
          }}
        />
        <TripMarkers />
      </Map>
    </div>
  );
}

const PlaceMarker = ({
  name,
  coordinates,
  placeId,
  activePlace,
  dayIndex,
  handleMarkerClick,
  type,
  dayId,
  children,
}: {
  name: string;
  coordinates: LngLat;
  placeId: string;
  activePlace: string | undefined;
  handleMarkerClick: (
    name: string,
    coordinates: LngLat,
    placeId: string,
    isInDay: number | null,
    type: SelectTripPlace["type"],
  ) => void;
  type: SelectTripPlace["type"];
  dayIndex: number | null;
  dayId: number | null;
  children: ReactNode;
}) => {
  const colours =
    dayIndex !== null
      ? `${markerColorLookup[dayIndex % markerColorLookup.length].border} ${markerColorLookup[dayIndex % markerColorLookup.length].bg} ${markerColorLookup[dayIndex % markerColorLookup.length].text}`
      : type === "saved"
        ? "border-amber-900 bg-amber-300 text-amber-900"
        : type === "undecided"
          ? "border-brand-400 bg-white text-slate-700"
          : "border-slate-400 bg-slate-200 text-slate-500";

  return (
    <Marker
      key={placeId + "marker"}
      longitude={coordinates[0]}
      latitude={coordinates[1]}
      onClick={(e) => {
        e.originalEvent.stopPropagation(); // Make sure the map doesn't receive event
        handleMarkerClick(name, coordinates, placeId, dayId, type);
      }}
      style={activePlace === placeId ? { zIndex: 1 } : { zIndex: 0 }}
      anchor="center"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`#${placeId}`}
            replace
            className={`flex size-6 items-center justify-center rounded-full border-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${colours} ${activePlace === placeId ? "scale-150 shadow-md" : ""}`}
          >
            {children}
          </Link>
        </TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </Marker>
  );
};

const TripMarkers = () => {
  const places = useAtomValue(tripPlacesAtom);
  const [activeMapMarker, setActiveMapMarker] = useAtom(mapActiveMarkerAtom);
  const undecidedActiveMarker = useAtomValue(mapUndecidedActiveMarkerAtom);
  const days = useAtomValue(dayPlacesAtom);
  const { map } = useMap();
  const lastTimeClicked = useRef(0);
  const doubleClickTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const path = usePathname();
  const isDiscover = /\/trip\/[a-z0-9]{12}\/discover/.test(path);

  const handleMarkerClick = (
    name: string,
    coordinates: LngLat,
    placeId: string,
    isInDay: number | null,
    type: SelectTripPlace["type"],
  ) => {
    if (map) map.getMap().doubleClickZoom.disable();
    if (doubleClickTimeout.current) clearTimeout(doubleClickTimeout.current);
    setTimeout(() => {
      if (map) map.getMap().doubleClickZoom.enable();
    }, 350);
    const now = Date.now();
    let animate = true;
    if (now - lastTimeClicked.current > 350) {
      animate = false;
    }
    setActiveMapMarker({
      isInDay: isInDay,
      placeId: placeId,
      position: coordinates,
      name: name,
      shouldAnimate: animate,
      type: type,
    });
    lastTimeClicked.current = now;
  };

  return (
    <>
      {places.saved.map((place, index) => (
        <PlaceMarker
          key={place.placeInfo.placeId + "marker"}
          activePlace={activeMapMarker?.placeId}
          dayIndex={null}
          dayId={null}
          handleMarkerClick={handleMarkerClick}
          type="saved"
          coordinates={[
            place.placeInfo.location.longitude,
            place.placeInfo.location.latitude,
          ]}
          name={place.placeInfo.displayName}
          placeId={place.placeInfo.placeId}
        >
          {index + 1}
        </PlaceMarker>
      ))}
      {days.map((day, dayIndex) =>
        places[day.dayId].map((place, index) => (
          <PlaceMarker
            key={place.placeInfo.placeId + "marker"}
            activePlace={activeMapMarker?.placeId}
            dayIndex={dayIndex}
            dayId={day.dayId}
            handleMarkerClick={handleMarkerClick}
            type="saved"
            coordinates={[
              place.placeInfo.location.longitude,
              place.placeInfo.location.latitude,
            ]}
            name={place.placeInfo.displayName}
            placeId={place.placeInfo.placeId}
          >
            {index + 1}
          </PlaceMarker>
        )),
      )}
      {activeMapMarker && activeMapMarker.type === "skipped" && (
        <PlaceMarker
          activePlace={activeMapMarker.placeId}
          dayIndex={null}
          dayId={null}
          handleMarkerClick={handleMarkerClick}
          type="skipped"
          name={activeMapMarker.name}
          placeId={activeMapMarker.placeId}
          coordinates={activeMapMarker.position}
        >
          <IconX className="size-4" />
        </PlaceMarker>
      )}
      {undecidedActiveMarker && isDiscover && (
        <PlaceMarker
          activePlace={undecidedActiveMarker.placeId}
          dayIndex={null}
          dayId={null}
          handleMarkerClick={handleMarkerClick}
          type="undecided"
          name={undecidedActiveMarker.name}
          placeId={undecidedActiveMarker.placeId}
          coordinates={undecidedActiveMarker.position}
        >
          <IconSearch className="size-3.5" />
        </PlaceMarker>
      )}
      {activeMapMarker && activeMapMarker.isInDay !== null && (
        <RouteLines activeDay={activeMapMarker.isInDay} />
      )}
    </>
  );
};

const useMapViewManager = () => {
  const activeMapMarker = useAtomValue(mapActiveMarkerAtom);
  const undecidedActiveMarker = useAtomValue(mapUndecidedActiveMarkerAtom);
  const places = useAtomValue(tripPlacesAtom);
  const { map } = useMap();
  const path = usePathname();
  const isDiscover = /\/trip\/[a-z0-9]{12}\/discover/.test(path);

  useEffect(() => {
    if (!map || !activeMapMarker || !activeMapMarker.shouldAnimate) return;

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
      const bounds: BoundingBox = [
        [minLon, minLat],
        [maxLon, maxLat],
      ];
      map.fitBounds(bounds, {
        maxZoom: 12,
        duration: 3000,
        curve: 1,
        padding: 32,
      });
    } else
      map.flyTo({
        center: activeMapMarker.position,
        curve: 1,
        duration: 2000,
        zoom: 12,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMapMarker, map]);

  useEffect(() => {
    if (!map || !undecidedActiveMarker || !isDiscover) return;

    map.fitBounds(
      [undecidedActiveMarker.position, undecidedActiveMarker.position],
      {
        curve: 1,
        duration: 2000,
        maxZoom: 12,
      },
    );
  }, [undecidedActiveMarker, map, isDiscover]);
};

const RouteLines = ({ activeDay }: { activeDay: string | number }) => {
  const places = useAtomValue(tripPlacesAtom);
  const days = useAtomValue(dayPlacesAtom);
  const travelTimes = useAtomValue(travelTimesAtom);
  const dayIndex = useMemo(
    () => days.findIndex((day) => day.dayId === activeDay),
    [activeDay, days],
  );

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
          "line-color":
            markerColorLookup[dayIndex % markerColorLookup.length].hex,
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2, 15, 8],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 1, 15, 0.6],
        }}
      />
    </Source>
  );
};
