"use client";
import { cn } from "@/lib/utils";
import { composeRefs } from "@radix-ui/react-compose-refs";
import * as React from "react";

type InputProps = React.ComponentProps<"input"> & {
  left?: React.ReactNode;
  right?: React.ReactNode;
  large?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, left, right, large = false, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-xl border-2 border-slate-200 bg-white text-slate-900 transition has-[input:disabled]:pointer-events-none has-[input:focus-visible]:border-slate-900 has-[input:disabled]:bg-slate-100 has-[input:disabled]:text-slate-400 has-[input:disabled]:opacity-70 has-[input:active]:ring-2 has-[input:active]:ring-slate-300 [&_input]:placeholder:text-slate-400 [&_svg]:text-slate-500",
          large ? "h-16 [&_svg]:size-7" : "h-12 [&_svg]:size-5",
          className,
        )}
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("input, button, a")) return;

          const input = inputRef.current;
          if (!input) return;

          // Same selector as in the CSS to find the right slot
          const isRightSlot = target.closest("[data-right='true']");

          const cursorPosition = isRightSlot ? input.value.length : 0;

          requestAnimationFrame(() => {
            // Only some input types support this, browsers will throw an error if not supported
            // See: https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setSelectionRange#:~:text=Note%20that%20according,not%20support%20selection%22.
            try {
              input.setSelectionRange(cursorPosition, cursorPosition);
            } catch {}
            input.focus();
          });
        }}
      >
        {left !== undefined && (
          <div
            className={`flex shrink-0 items-center ${large ? "pl-4 pr-3" : "pl-3 pr-1.5"}`}
          >
            {left}
          </div>
        )}
        <input
          type={type}
          ref={composeRefs(inputRef, ref)}
          {...props}
          className={cn(
            "w-full bg-transparent file:h-full file:border-0 file:bg-transparent file:text-slate-900 focus-visible:outline-none",
            large && "text-2xl",
            !left && "indent-4",
          )}
        />
        {right !== undefined && (
          <div
            className={`flex shrink-0 items-center ${large ? "pl-3 pr-4 has-[button]:pr-3" : "pl-1.5 pr-3 has-[button]:pr-1.5"}`}
            data-right={true}
          >
            {right}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
