"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { composeRefs } from "@radix-ui/react-compose-refs";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";
import Spinner from "./spinner";

const Command = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive ref={ref} className={cn("w-full", className)} {...props} />
));
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
    left?: React.ReactNode;
    right?: React.ReactNode;
    large?: boolean;
  }
>(({ className, left, right, large = false, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div
      cmdk-input-wrapper=""
      className={cn(
        "group flex w-full rounded-xl border-2 border-slate-200 bg-white text-slate-900 transition-colors has-[input:disabled]:pointer-events-none has-[input:focus-visible]:border-slate-900 has-[input:disabled]:bg-slate-100 has-[input:disabled]:text-slate-400 has-[input:disabled]:opacity-70 [&_input]:placeholder:text-slate-400 [&_svg]:text-slate-500",
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
      <CommandPrimitive.Input
        ref={composeRefs(inputRef, ref)}
        className={cn(
          "w-full bg-transparent file:border-0 file:bg-transparent file:text-slate-900 focus-visible:outline-none",
          large && "text-2xl",
          !left && "indent-4",
        )}
        {...props}
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
});

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "relative top-1 flex size-full max-h-[300px] scroll-py-2 flex-col overflow-hidden overflow-y-auto overflow-x-hidden rounded-xl border-2 border-slate-200 bg-white text-slate-900 shadow-md",
      className,
    )}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-slate-500"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandLoading = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Loading>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>
>((props, ref) => (
  <CommandPrimitive.Loading
    ref={ref}
    className="flex w-full justify-center py-6"
    {...props}
  >
    <Spinner />
  </CommandPrimitive.Loading>
));

CommandLoading.displayName = CommandPrimitive.Loading.displayName;

const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-2 text-slate-900 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500",
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("h-px bg-slate-200", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative mb-1 flex cursor-default select-none items-center gap-2 rounded-lg p-2 outline-none last:mb-0 data-[disabled=true]:pointer-events-none data-[selected='true']:bg-slate-100 data-[disabled=true]:text-slate-400 data-[selected=true]:text-slate-900 data-[disabled=true]:opacity-70 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <kbd
      className={cn(
        "ml-auto text-xs tracking-widest text-slate-500",
        className,
      )}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
};
