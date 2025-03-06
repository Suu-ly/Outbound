import { SelectPlace, SelectTripTravelTime } from "./db/schema";

export type ApiResponse<T> =
  | {
      data: T;
      status: "success";
    }
  | {
      status: "error";
      message: string;
    };

export type GoogleError = {
  error: {
    code: number;
    message: string;
    status: string;
  };
};

export type AutocompleteReturn = {
  id: string;
  label: string;
  subtitle?: string;
};

type BingQuery = {
  displayText: string;
  searchLink: string;
  text: string;
  thumbnail: {
    url: string;
  };
  webSearchUrl: string;
};

type BingImageAnswer = {
  _type: "Images";
  currentOffset: number;
  id: string;
  isFamilyFriendly: boolean;
  nextOffset: number;
  pivotSuggestions: {
    pivot: string;
    suggestions: BingQuery;
  };
  queryExpansions: BingQuery;
  queryContext: {
    adultIntent: boolean;
    alterationOverrideQuery: string;
    alteredQuery: string;
    askUserForLocation: boolean;
    originalQuery: string;
  };
  readLink: string;
  relatedSearches: BingQuery[];
  similarTerms: BingQuery;
  totalEstimatedMatches: number;
  value: {
    webSearchUrl: string;
    name: string;
    thumbnailUrl: string;
    datePublished: string;
    isFamilyFriendly: boolean;
    contentUrl: string;
    hostPageUrl: string;
    contentSize: string;
    encodingFormat: string;
    hostPageDisplayUrl: string;
    width: number;
    height: number;
    thumbnail: {
      width: number;
      height: number;
    };
    imageInsightsToken: string;
    insightsMetadata: {
      shoppingSourcesCount: number;
      recipeSourcesCount: number;
      pagesIncludingCount: number;
      availableSizesCount: number;
    };
    imageId: string;
    accentColor: string;
  }[];
  webSearchUrl: string;
};

type BingError = {
  _type: "ErrorResponse";
  errors: {
    code: string;
    subCode: string;
    message: string;
    moreDetails: string;
  }[];
};

export type BingImageResponse = BingImageAnswer | BingError;

export type BingReturn = { image: string; thumbnail: string };

export type PlacesReview = {
  name: string;
  relativePublishTimeDescription: string;
  rating: number;
  text: {
    text: string;
    languageCode: string;
  };
  originalText: {
    text: string;
    languageCode: string;
  };
  authorAttribution: {
    displayName: string;
    uri: string;
    photoUri: string;
  };
  publishTime: string;
  flagContentUri: string;
  googleMapsUri: string;
};

export type PlacesPhoto = {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: {
    displayName: string;
    uri: string;
    photoUri: string;
  }[];
  flagContentUri: string;
  googleMapsUri: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PlacesResult = {
  places: {
    name: string;
    id: string;
    types: string[];
    internationalPhoneNumber?: string;
    location: Coordinates;
    viewport: {
      low: Coordinates;
      high: Coordinates;
    };
    rating?: number;
    userRatingCount?: number;
    googleMapsUri: string;
    websiteUri?: string;
    regularOpeningHours?: {
      openNow: boolean;
      periods: {
        open: {
          day: number;
          hour: number;
          minute: number;
        };
        close?: {
          day: number;
          hour: number;
          minute: number;
        };
      }[];
      weekdayDescriptions: string[];
      nextOpenTime: string;
    };
    iconBackgroundColor:
      | "#FF9E67"
      | "#4B96F3"
      | "#909CE1"
      | "#13B5C7"
      | "#10BDFF"
      | "#7B9EB0"
      | "#4DB546"
      | "#F88181";
    displayName: {
      text: string;
      languageCode: string;
    };
    primaryTypeDisplayName?: {
      text: string;
      languageCode: string;
    };
    primaryType?: string;
    formattedAddress: string;
    shortFormattedAddress?: string;
    editorialSummary?: {
      text: string;
      languageCode: string;
    };
    reviews?: PlacesReview[];
    photos?: PlacesPhoto[];
    paymentOptions?: {
      acceptsCreditCards?: boolean;
      acceptsDebitCards?: boolean;
      acceptsCashOnly?: boolean;
      acceptsNfc?: boolean;
    };
    parkingOptions?: {
      freeParkingLot?: boolean;
      paidParkingLot?: boolean;
      freeStreetParking?: boolean;
      paidStreetParking?: boolean;
      valetParking?: boolean;
      freeGarageParking?: boolean;
      paidGarageParking?: boolean;
    };
    accessibilityOptions: {
      wheelchairAccessibleParking?: boolean;
      wheelchairAccessibleEntrance?: boolean;
      wheelchairAccessibleRestroom?: boolean;
      wheelchairAccessibleSeating?: boolean;
    };
    outdoorSeating?: boolean;
    liveMusic?: boolean;
    goodForChildren?: boolean;
    allowsDogs?: boolean;
    restroom?: boolean;
    goodForGroups?: boolean;
    goodForWatchingSports?: boolean;
  }[];
  contextualContents: {
    justifications?: [
      {
        reviewJustification?: {
          highlightedText: {
            text: string;
          };
        };
      },
      Record<never, never>,
    ];
  }[];
  nextPageToken?: string;
};

export type InitialQuery = {
  trip: {
    id: string;
    name: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    private: boolean;
    roundUpTime: boolean;
    currentSearchIndex: number;
    nextPageToken: string[] | null;
    startTime: string;
    endTime: string;
  };
  location: {
    name: string;
    coverImg: string;
    viewport: BoundingBox;
    windows: BoundingBox[];
  };
  place: SelectPlace | null;
  inner: {
    placeId: string | null;
    dayId: number | null;
    note: string | null;
    timeSpent: number | null;
    type: "saved" | "skipped" | "undecided" | null;
    tripOrder: string;
    dayOrder: string;
    dayStartTime: string | null;
  };
  travelTime: {
    nextId: string | null;
    drive: DistanceType | null;
    cycle: DistanceType | null;
    walk: DistanceType | null;
    selectedMode: SelectTripTravelTime["type"] | null;
  };
};

export type TripData = {
  id: string;
  name: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  private: boolean;
  roundUpTime: boolean;
  startTime: string;
  endTime: string;
  coverImg: string;
  viewport: BoundingBox;
};

export type WindowData = {
  name: string;
  windows: BoundingBox[];
  currentSearchIndex: number;
  nextPageToken: string[] | null;
};

export type DayData = {
  dayId: number;
  dayOrder: string;
  dayStartTime: string;
};

export type PlaceDataPlaceInfo = {
  placeId: string;
  displayName: string;
  primaryTypeDisplayName: string;
  typeColor: string;
  location: Coordinates;
  viewport: {
    low: Coordinates;
    high: Coordinates;
  };
  coverImgSmall: string;
  rating: number | null;
  googleMapsLink: string;
  openingHours: {
    periods: {
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }[];
    text: string[];
  } | null;
};

type PlaceDataUserPlaceInfo = {
  note: string | null;
  tripOrder: string;
  timeSpent: number;
  timeToNextPlace: number | null;
};

export type PlaceDataEntry = {
  placeInfo: PlaceDataPlaceInfo;
  userPlaceInfo: PlaceDataUserPlaceInfo;
};

export type PlaceData = {
  saved: PlaceDataEntry[];
  [key: string | number]: PlaceDataEntry[];
};

export type InitialQueryPrepared = {
  tripData: TripData;
  windowData: WindowData;
  dayData: DayData[];
  discoverData: TripPlaceDetails[];
  placeData: PlaceData;
  travelTimeData: TravelTimeGraphType;
};

export type TripPlaceDetails = SelectPlace & {
  photos?: PlacesResult["places"][number]["photos"] | null;
};

export type DiscoverReturn = {
  places: TripPlaceDetails[];
  nextPageToken: string | null;
};

type GeoJsonValues =
  | {
      type: "Point";
      coordinates: [number, number];
    }
  | {
      type: "MultiPolygon";
      coordinates: [[number, number][]][];
    }
  | {
      type: "Polygon";
      coordinates: [[number, number][]];
    };

export type NominatimResponse = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: [string, string, string, string];
  geojson: GeoJsonValues;
}[];

export type BoundingBox = [[number, number], [number, number]];

export type DistanceType =
  | {
      route: true;
      distance: number;
      distanceDisplay: string;
      duration: number;
      durationDisplay: string;
      durationDisplayRoundUp: string;
      geometry: {
        coordinates: [number, number][];
        type: "LineString";
      };
      summary: string | null;
    }
  | { route: false };

export type TravelTimeGraphType = Record<
  string,
  Record<
    string,
    {
      drive: DistanceType;
      cycle: DistanceType;
      walk: DistanceType;
      mode?: string;
    }
  >
>;
