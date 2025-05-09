"use client";
import DateHydration from "@/components/date-hydration";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { markerColorLookup } from "@/lib/color-lookups";
import { getElementId } from "@/lib/utils";
import { SelectTripPlace } from "@/server/db/schema";
import { BoundingBox, LngLat } from "@/server/types";
import { IconRoute, IconSearch, IconX } from "@tabler/icons-react";
import { addDays } from "date-fns";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GeolocateControl,
  Layer,
  Map,
  Marker,
  NavigationControl,
  Source,
  useMap,
} from "react-map-gl";
import { toast } from "sonner";
import {
  dayPlacesAtom,
  mapActiveMarkerAtom,
  mapUndecidedActiveMarkerAtom,
  showRouteLinesAtom,
  travelTimesAtom,
  tripPlacesAtom,
  tripStartDateAtom,
} from "../atoms";

export default function MapView({
  initialBounds,
}: {
  initialBounds: BoundingBox;
}) {
  useMapViewManager();
  const setActiveMarker = useSetAtom(mapActiveMarkerAtom);

  const handleMapClick = useCallback(() => {
    setActiveMarker(undefined);
  }, [setActiveMarker]);

  return (
    <div className="h-full grow bg-sky-300">
      <Map
        id="map"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        projection={{
          name: "mercator",
        }}
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
            overflow: "hidden",
            // backgroundColor: "#fafafa",
          }}
        />
        <GeolocateControl
          position="top-left"
          style={{
            marginTop: "0.5rem",
            marginLeft: "1rem",
            border: "2px solid #e2e8f0",
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            borderRadius: "2rem",
            overflow: "hidden",
            // backgroundColor: "#fafafa",
          }}
          onError={(e) => {
            toast.error(e.message);
          }}
          fitBoundsOptions={{
            maxZoom: 14,
            duration: 3000,
            curve: 1,
            padding: 64,
          }}
        />
        <div className="hidden sm:block">
          <MapLegendPanel />
        </div>
        <TripMarkers />
      </Map>
    </div>
  );
}

const PlaceMarker = ({
  name,
  coordinates,
  placeId,
  elementId,
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
  elementId?: string;
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

  const Comp = elementId ? Link : "div";
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
          <Comp
            href={elementId ? `#${elementId}` : undefined!}
            aria-label={name + " map marker"}
            replace={elementId ? true : undefined}
            tabIndex={-1}
            className={`flex size-6 items-center justify-center rounded-full border-2 text-sm font-semibold transition duration-300 ease-out animate-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 motion-safe:zoom-in-50 motion-reduce:transition-none motion-reduce:fade-in-0 ${colours} ${activePlace === placeId ? "scale-150 shadow-md" : ""}`}
          >
            <span
              className="absolute size-10 rounded-full"
              aria-hidden={true}
            ></span>
            {children}
          </Comp>
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
  const showRouteLines = useAtomValue(showRouteLinesAtom);
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
          elementId={getElementId("saved", index)}
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
            elementId={getElementId("day", index, dayIndex)}
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
      {activeMapMarker &&
        activeMapMarker.isInDay !== null &&
        showRouteLines && <RouteLines activeDay={activeMapMarker.isInDay} />}
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
        maxZoom: 15,
        duration: 3000,
        curve: 1,
        padding: {
          bottom: 128,
          top: 96,
          left: 48,
          right: 48,
        },
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
            markerColorLookup[dayIndex % markerColorLookup.length].hexBorder,
          "line-width": ["interpolate", ["linear"], ["zoom"], 5, 4, 15, 12],
        }}
      />
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
        }}
      />
    </Source>
  );
};

export const MapLegendPanel = () => {
  const [expanded, setExpanded] = useState(true);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (buttonRef.current && isMounted.current) {
      buttonRef.current.focus();
    }
    const rAF = requestAnimationFrame(() => (isMounted.current = true));

    return () => cancelAnimationFrame(rAF);
  }, [expanded]);

  if (!expanded)
    return (
      <Button
        variant="outline"
        size="small"
        iconOnly
        className="absolute right-0 top-0 z-10 mr-4 mt-4 origin-top-right bg-white shadow-md animate-in zoom-in-110 motion-reduce:animate-none"
        aria-label="Open map legend panel"
        onClick={() => setExpanded(true)}
        ref={!expanded ? buttonRef : undefined}
      >
        <IconRoute />
      </Button>
    );

  return (
    <div className="absolute right-0 top-0 z-10 mr-4 mt-4 w-56 origin-top-right rounded-2xl border-2 border-slate-200 bg-white shadow-md transition-transform animate-in zoom-in-95 motion-safe:has-[[data-close=true]:active]:scale-[98%] motion-reduce:animate-none">
      <div className="flex items-center justify-between p-1 pl-2">
        <h3 className="text-xs font-medium text-slate-700">Legend</h3>
        <Button
          data-close={true}
          variant="ghost"
          size="small"
          iconOnly
          aria-label="Close map legend panel"
          onClick={() => setExpanded(false)}
          className="ring-offset-white"
          ref={expanded ? buttonRef : undefined}
        >
          <IconX />
        </Button>
      </div>
      <Separator />
      <div className="max-h-48 space-y-3 overflow-auto p-2 pt-4 text-slate-900">
        <MapLegends />
      </div>
    </div>
  );
};

export const MapLegends = () => {
  const days = useAtomValue(dayPlacesAtom);
  const places = useAtomValue(tripPlacesAtom);
  const startDate = useAtomValue(tripStartDateAtom);
  const [activeMapMarker, setActiveMapMarker] = useAtom(mapActiveMarkerAtom);
  const [showRouteLines, setShowRouteLines] = useAtom(showRouteLinesAtom);

  const onDayLegendClick = (dayId: number) => {
    if (places[dayId] && places[dayId].length > 0) {
      const active = places[dayId][0];
      setActiveMapMarker({
        isInDay: dayId,
        name: active.placeInfo.displayName,
        placeId: active.placeInfo.placeId,
        position: [
          active.placeInfo.location.longitude,
          active.placeInfo.location.latitude,
        ],
        shouldAnimate: true,
        type: "saved",
      });
    }
  };

  return (
    <>
      <div className="flex items-center">
        <label htmlFor="route-switch" className="grow text-sm">
          Show route lines
        </label>
        <Switch
          id="route-switch"
          className="-my-2"
          checked={showRouteLines}
          onCheckedChange={setShowRouteLines}
        />
      </div>
      <div className="flex items-center gap-3">
        <div
          aria-hidden={true}
          className="h-2.5 w-6 rounded-full border-2 border-amber-900 bg-amber-300"
        ></div>
        <p className="text-sm">Saved Places</p>
      </div>
      {activeMapMarker && activeMapMarker.type === "skipped" && (
        <div className="flex items-center gap-3">
          <div
            aria-hidden={true}
            className="h-2.5 w-6 rounded-full border-2 border-slate-400 bg-slate-200"
          ></div>
          <p className="text-sm">Skipped Place</p>
        </div>
      )}
      {days.map((day, index) => {
        const date = addDays(startDate, index);
        return (
          <button
            key={day.dayId}
            className="flex w-full items-center gap-3 rounded-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            onClick={() => onDayLegendClick(day.dayId)}
          >
            <div
              aria-hidden={true}
              className={`h-2.5 w-6 rounded-full border-2 ${markerColorLookup[index % markerColorLookup.length].bg} ${markerColorLookup[index % markerColorLookup.length].border}`}
            ></div>
            <p className="text-sm">
              <DateHydration date={date} />
            </p>
            <Separator orientation="vertical" className="h-auto self-stretch" />
            <p className="text-sm">
              <DateHydration date={date} weekday />
            </p>
          </button>
        );
      })}
    </>
  );
};
