import { SelectTripTravelTime } from "@/server/db/schema";
import { DistanceType } from "@/server/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BASE = 95; // 95 printable ASCII characters
const MID = Math.floor(BASE / 2); // Averaging is not entirely precise because base is odd
const ASCII_START = 32; // Space (ASCII 32)

function charToDigit(c: string) {
  return c.charCodeAt(0) - ASCII_START;
}

function digitToChar(d: number) {
  return String.fromCharCode(d + ASCII_START);
}

// For base 95 averaging of strings
function averageStrings(a: string, b: string) {
  const maxLen = Math.max(a.length, b.length);
  a = a.padEnd(maxLen, "\x20"); // Pad with spaces (ASCII 32)
  b = b.padEnd(maxLen, "\x20");

  // Sum up from right to left, with carry. Do not bring carry over for leftmost char sum
  const sums = [];
  let carry = 0;
  for (let i = maxLen - 1; i >= 0; i--) {
    const sum = charToDigit(a[i]) + charToDigit(b[i]) + carry;
    if (i === 0) sums.unshift(sum);
    else {
      const res = sum % BASE;
      carry = Math.floor(sum / BASE);
      sums.unshift(res);
    }
  }

  // Reset carry to 0
  carry = 0;
  const result = [];
  // Divide by half from left to right with carry
  for (let i = 0; i < sums.length; i++) {
    const sum = sums[i] + carry * BASE;
    result.push(Math.floor(sum / 2));
    carry = sum % 2;
  }
  // If carry still present, add MID to end
  if (carry > 0) result.push(MID);

  return result
    .map((digit) => digitToChar(digit))
    .join("")
    .trimEnd(); // Remove trailing zeros (spaces)
}

export function getStartingIndex() {
  return digitToChar(Math.floor(BASE / 3)); // Bias index towards start as more likely to insert after
}

export function insertBefore(index: string | undefined) {
  if (!index) return getStartingIndex();
  return averageStrings("\x20", index); // Average with zero
}

export function insertAfter(index: string | undefined) {
  if (!index) return getStartingIndex();
  return averageStrings(index, "\x7F"); // Average with "one"
}

export function insertBetween(left: string, right: string) {
  return averageStrings(left, right);
}

export const defaultTripPlaceUserInfo = {
  note: null,
  timeSpent: 120,
  timeToNextPlace: null,
};

export function minsToString(minutes: number, roundUp?: boolean) {
  const numHours = Math.floor(minutes / 60);
  const mins = roundUp ? Math.ceil((minutes % 60) / 15) * 15 : minutes % 60;
  let output = roundUp ? "~" : "";
  if (numHours) output += `${numHours} hr${numHours > 1 ? "s" : ""}`;
  if (numHours && mins) output += " ";
  if (mins) output += `${mins} min${mins > 1 ? "s" : ""}`;
  if (!output) output = "none";
  return output;
}

export function digitStringToMins(input: string) {
  return parseInt(input.substring(0, 2)) * 60 + parseInt(input.substring(2));
}

export function minsTo24HourFormat(minutes: number) {
  if (minutes < 0) throw new Error("Invalid minutes");
  const hours = Math.floor(minutes / 60);
  return {
    value:
      `${hours % 24}`.padStart(2, "0") + `${minutes % 60}`.padStart(2, "0"),
    overflow: hours >= 24,
  };
}

export function getTravelTimesFromObject(
  mode: SelectTripTravelTime["type"] | null,
  times: Record<SelectTripTravelTime["type"], DistanceType>,
) {
  if (!mode) mode = "drive";
  const modeTimes = times[mode];
  if (!modeTimes.route || !modeTimes) return 0;
  return modeTimes.duration;
}
