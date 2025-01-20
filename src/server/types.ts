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

export type BoundsReturn = {
  id: string;
  viewport: [[number, number], [number, number]];
  name: string;
};
