import AutoComplete from "@/components/ui/autocomplete";
import useDebouncedFunction from "@/lib/use-debounced-function";
import { defaultTripPlaceUserInfo, getStartingIndex } from "@/lib/utils";
import {
  ApiResponse,
  AutocompleteReturn,
  PlaceData,
  PlaceDataEntry,
  TripPlaceDetails,
} from "@/server/types";
import { IconSearch } from "@tabler/icons-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";
import { useParams } from "next/navigation";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 } from "uuid";
import { tripDetailsAtom, tripPlacesAtom } from "../atoms";

type TripAutocompleteProps = {
  isInDay: number | string;
  handleMove: (
    isInDay: number | string,
    data: PlaceDataEntry,
    newDay: number | string,
  ) => void;
  setLoadingState: Dispatch<SetStateAction<Record<keyof PlaceData, string[]>>>;
};

export default function TripAutocomplete({
  isInDay,
  handleMove,
  setLoadingState,
}: TripAutocompleteProps) {
  const session = useRef(v4());
  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [selectedId, setSelectedId] = useState<AutocompleteReturn>();
  const [places, setPlaces] = useAtom(tripPlacesAtom);
  const tripDetails = useAtomValue(tripDetailsAtom);
  const tripId = useParams<{ id: string }>().id;
  const debounce = useDebouncedFunction();

  const checkIfPlaceExists = (id: string) => {
    return Object.values(places).find((placeGroup) =>
      placeGroup.find((place) => place.placeInfo.placeId === id),
    );
  };

  const getAutocompleteData = async (query: string) => {
    const urlParams = new URLSearchParams([
      ["query", query],
      ["session", session.current],
      ["trip", "true"],
    ]);
    for (let i = 0; i < tripDetails.viewport.length; i++) {
      for (let j = 0; j < tripDetails.viewport[0].length; j++) {
        urlParams.append("bias", tripDetails.viewport[i][j].toString());
      }
    }
    const data = await fetch(`/api/places/autocomplete?${urlParams.toString()}`)
      .then((response) => response.json())
      .then((data) => data as ApiResponse<AutocompleteReturn[]>);
    if (data.status === "error") {
      throw new Error(data.message);
    }
    return data.data;
  };

  const { data: autocomplete } = useQuery({
    queryKey: ["autocomplete", debouncedValue],
    queryFn: () => getAutocompleteData(debouncedValue),
    placeholderData: keepPreviousData,
    enabled: debouncedValue !== "",
    meta: {
      errorMessage: "Unable to autocomplete query",
    },
  });

  const getLocationData = async (
    selectedId: AutocompleteReturn | undefined,
  ) => {
    if (!selectedId) throw new Error("Selected place is not valid");
    setLoadingState((prev) => {
      if (!prev[isInDay])
        return {
          ...prev,
          [isInDay]: [selectedId.id],
        };
      return {
        ...prev,
        [isInDay]: [...prev[isInDay], selectedId.id],
      };
    });
    const urlParams = new URLSearchParams([
      ["name", selectedId.label],
      ["secondary", selectedId.subtitle ?? ""],
      ["tripId", tripId],
      ["dayId", String(isInDay)],
    ]);
    const data = await fetch(`/api/places/details?${urlParams.toString()}`)
      .then((response) => response.json())
      .then(
        (data) =>
          data as ApiResponse<{
            place: TripPlaceDetails;
            order: string | null;
          }>,
      );
    setLoadingState((prev) => {
      if (!prev[isInDay]) return prev;
      return {
        ...prev,
        [isInDay]: prev[isInDay].filter((data) => data !== selectedId.id),
      };
    });
    if (data.status === "error") {
      throw new Error(data.message);
    }
    setPlaces((prev) => ({
      ...prev,
      [isInDay]: [
        ...prev[isInDay],
        {
          placeInfo: {
            placeId: data.data.place.id,
            displayName: data.data.place.displayName,
            primaryTypeDisplayName: data.data.place.primaryTypeDisplayName,
            typeColor: data.data.place.typeColor,
            location: data.data.place.location,
            viewport: data.data.place.viewport,
            coverImgSmall: data.data.place.coverImgSmall,
            googleMapsLink: data.data.place.googleMapsLink,
            rating: data.data.place.rating,
            openingHours: data.data.place.openingHours,
          },
          userPlaceInfo: {
            ...defaultTripPlaceUserInfo,
            tripOrder: data.data.order ?? getStartingIndex(), // should never be null
          },
        },
      ],
    }));
    return data.data;
  };

  useQuery({
    queryKey: ["selected", selectedId?.id],
    queryFn: () => getLocationData(selectedId),
    enabled: !!selectedId,
    meta: {
      errorMessage: "Unable to fetch data for selected location",
    },
  });

  return (
    <AutoComplete
      sync={{
        listItems: places.saved,
        listElement: (data, originalIndex) => (
          <div className="flex items-center gap-3">
            <div className="flex size-6 items-center justify-center rounded-full border border-amber-300 text-xs text-amber-600">
              {originalIndex}
            </div>
            <div>
              <div
                className="text-xs font-medium"
                style={{ color: data.placeInfo.typeColor }}
              >
                {data.placeInfo.primaryTypeDisplayName}
              </div>
              <div className="text-slate-900">{data.placeInfo.displayName}</div>
            </div>
          </div>
        ),
        listValueFunction: (data) => data.placeInfo.placeId,
        inputReplaceFunction: (data) => data.placeInfo.displayName,
        onSelectItem: (data) => {
          handleMove("saved", data, isInDay);
        },
        header: "From saved places",
      }}
      async={{
        listItems: autocomplete,
        listElement: (data) => (
          <div>
            {data.label}
            {data.subtitle && (
              <div className="text-xs text-slate-500">{data.subtitle}</div>
            )}
          </div>
        ),
        listValueFunction: (data) => data.id,
        inputReplaceFunction: (data) => data.label,
        onSelectItem: (data) => {
          if (!checkIfPlaceExists(data.id)) {
            setSelectedId(data);
          } else toast.error("Place already added!");
        },
        header: "From the web",
      }}
      emptyMessage="No results found!"
      clearOnSelect
      value={value}
      setValue={setValue}
      onUserInput={(string) => {
        debounce(() => setDebouncedValue(string));
      }}
      inputLeft={<IconSearch />}
      placeholder="Add a location..."
      className="mt-4"
    />
  );
}
