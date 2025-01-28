import { atom } from "jotai";

export const tripDetailsAtom = atom<{
  name: string;
  startDate: Date;
  endDate: Date;
  private: boolean;
  roundUpTime: boolean;
  startTime: string;
  endTime: string;
  location: string;
  coverImg: string;
}>();

export const isTripAdminAtom = atom<boolean>();
