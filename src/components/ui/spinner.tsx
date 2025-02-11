import { cn } from "@/lib/utils";
import React from "react";

type SpinnerProps = React.ComponentPropsWithoutRef<"svg">;

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, ...rest }, ref) => {
    return (
      <>
        <svg
          aria-hidden="true"
          ref={ref}
          className={cn(
            "duration-3s inline size-5 animate-spin text-slate-400",
            className,
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          {...rest}
        >
          <circle
            cx="12"
            cy="12"
            r="9.5"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-spinner"
          ></circle>
        </svg>
        <span className="sr-only">Loading</span>
      </>
    );
  },
);

Spinner.displayName = "Spinner";

export default Spinner;
