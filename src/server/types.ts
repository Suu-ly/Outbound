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
