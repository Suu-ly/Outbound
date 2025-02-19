"use client";
import { cn } from "@/lib/utils";
import { composeRefs } from "@radix-ui/react-compose-refs";
import * as React from "react";

type InputProps = React.ComponentProps<"textarea"> & {
  left?: React.ReactNode;
  right?: React.ReactNode;
  small?: boolean;
  maxRows?: number;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, InputProps>(
  (
    { className, left, rows = 1, right, small = false, maxRows = 4, ...props },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLTextAreaElement>(null);

    const [rowsState, setRowsState] = React.useState(rows);

    React.useEffect(() => {
      if (!inputRef.current) return;

      const input = inputRef.current;

      const handleChange = () => {
        input.style.height = "0";
        setRowsState(Math.min(input.scrollHeight / 24, maxRows));
        input.style.removeProperty("height");
      };

      input.addEventListener("input", handleChange);

      return input.removeEventListener("change", handleChange);
    }, [maxRows]);

    return (
      <div
        className={cn(
          "flex w-full rounded-xl border-2 border-slate-200 bg-white text-slate-900 transition has-[textarea:disabled]:pointer-events-none has-[textarea:focus-visible]:border-slate-900 has-[textarea:disabled]:bg-slate-100 has-[textarea:disabled]:text-slate-400 has-[textarea:disabled]:opacity-70 has-[textarea:active]:ring-2 has-[textarea:active]:ring-slate-300 [&_svg]:size-5 [&_svg]:text-slate-500 [&_textarea]:placeholder:text-slate-400",
          small ? "py-1" : "py-2",
          className,
        )}
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("textarea, button, a")) return;

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
        <div
          className={`flex h-6 shrink-0 items-center ${small && left ? "pl-1.5 pr-1.5" : small ? "px-1" : left ? "pl-3 pr-1.5" : "pl-3"}`}
        >
          {left}
        </div>
        <textarea
          ref={composeRefs(inputRef, ref)}
          {...props}
          rows={rowsState}
          className={cn(
            "w-full resize-none overflow-y-auto bg-transparent focus-visible:outline-none",
          )}
        />
        <div
          className={`flex h-6 shrink-0 items-center ${small && right ? "pl-1.5 pr-1.5" : small ? "px-1" : right ? "pl-1.5 pr-3 has-[button]:pr-1.5" : "pr-3"}`}
          data-right={true}
        >
          {right}
        </div>
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export default Textarea;
