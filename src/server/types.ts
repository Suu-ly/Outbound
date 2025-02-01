import { SelectPlace } from "./db/schema";

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

export type PlacesResult = {
  places: {
    name: string;
    id: string;
    types: string[];
    internationalPhoneNumber?: string;
    location: {
      latitude: number;
      longitude: number;
    };
    viewport: {
      low: {
        latitude: number;
        longitude: number;
      };
      high: {
        latitude: number;
        longitude: number;
      };
    };
    rating: number;
    userRatingCount: number;
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
        close: {
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
    reviews?: {
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
    }[];
    photos?: {
      name: string;
      widthPx: number;
      heightPx: number;
      authorAttributions: [
        {
          displayName: string;
          uri: string;
          photoUri: string;
        },
      ];
      flagContentUri: string;
      googleMapsUri: string;
    }[];
    paymentOptions?: {
      acceptsCreditCards?: boolean;
      acceptsDebitCards?: boolean;
      acceptsCashOnly?: boolean;
      acceptsNfc?: boolean;
    };
    parkingOptions: {
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
    outdoorSeating: boolean;
    liveMusic: boolean;
    goodForChildren: boolean;
    allowsDogs: boolean;
    restroom: boolean;
    goodForGroups: boolean;
    goodForWatchingSports: boolean;
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

export type TripPlaceDetails = SelectPlace & {
  photos: PlacesResult["places"][number]["photos"];
};

export type DiscoverReturn = {
  places: TripPlaceDetails[];
  nextPageToken: string | null;
};
