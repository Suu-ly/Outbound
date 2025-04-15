import { ComponentProps } from "react";

export default function Arrow(props: ComponentProps<"svg">) {
  return (
    <svg
      width="33"
      height="52"
      viewBox="0 0 33 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M1 1C23 1 32.5 16.4999 31 25.5C29.5 34.5001 16 28.0243 20.5 22.5121C25 16.9999 42.5 31.5 17 48.5M17 48.5L19 39.5M17 48.5L26 50.5" />
    </svg>
  );
}
