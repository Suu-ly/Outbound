"use client";
import { cn } from "@/lib/utils";
import { composeRefs } from "@radix-ui/react-compose-refs";
import * as React from "react";

type InputProps = React.ComponentProps<"input"> & {
  left?: React.ReactNode;
  right?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, left, right, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
      <div
        className={cn(
          "has-[input:disabled]:pointer-event flex h-12 w-full rounded-xl border-2 border-slate-200 bg-white text-slate-900 transition-colors has-[input:focus-visible]:border-slate-900 has-[input:disabled]:bg-slate-100 has-[input:disabled]:text-slate-400 has-[input:disabled]:opacity-70 [&_input]:placeholder:text-slate-400 [&_svg]:size-5 [&_svg]:text-slate-500",
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
          <div className="flex shrink-0 items-center pl-3 pr-1.5">{left}</div>
        )}
        <input
          type={type}
          ref={composeRefs(inputRef, ref)}
          {...props}
          className={cn(
            "w-full bg-transparent py-3 file:border-0 file:bg-transparent file:text-slate-900 focus-visible:outline-none",
            !left && "indent-4",
          )}
        />
        {right !== undefined && (
          <div
            className="flex shrink-0 items-center pl-1.5 pr-3 has-[button]:pr-1.5"
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
