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

export function insertBefore(index: string) {
  return averageStrings("\x20", index); // Average with zero
}

export function insertAfter(index: string) {
  return averageStrings(index, "\x7F"); // Average with "one"
}
