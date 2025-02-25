"use client";

import { Presence } from "@radix-ui/react-presence";
import {
  ComponentPropsWithoutRef,
  type JSX,
  type KeyboardEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "./command";

type AsyncProps<T> = {
  listItems: T[] | undefined;
  listElement: (data: T) => JSX.Element;
  listValueFunction: (data: T) => string;
  inputReplaceFunction: (data: T) => string;
  onSelectItem: (data: T) => void | Promise<void>;
};

type SyncProps<P> = {
  syncListItems: P[];
  syncListElement: (data: P) => JSX.Element;
  syncListValueFunction: (data: P) => string;
  syncInputReplaceFunction: (data: P) => string;
  onSelectSyncItem: (data: P) => void | Promise<void>;
};

type AutoCompleteProps<T, P> = {
  async?: AsyncProps<T>;
  sync?: SyncProps<P>;
  value: string;
  setValue: React.Dispatch<SetStateAction<string>>;
  onUserInput: (value: string) => void | Promise<void>;
  emptyMessage: string;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputLarge?: boolean;
  inputClassName?: string;
  inputLeft?: React.ReactNode;
  inputRight?: React.ReactNode;
} & ComponentPropsWithoutRef<typeof Command>;

export default function AutoComplete<T, P>({
  async,
  sync,
  placeholder,
  emptyMessage,
  value,
  setValue,
  onUserInput,
  disabled,
  isLoading = false,
  inputLarge = false,
  inputClassName,
  inputLeft,
  inputRight,
  ...rest
}: AutoCompleteProps<T, P>) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setOpen] = useState(false);
  // This is used to show loading spinner only from the initial empty state
  const [isClosed, setIsClosed] = useState(true);

  const present = value.length > 0 && isOpen;
  const prevPresent = useRef(present);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    // Keep the options displayed when the user is typing
    if (!isOpen) {
      setOpen(true);
    }

    // This is not a default behaviour of the <input /> field
    if (event.key === "Escape") {
      requestAnimationFrame(() => {
        input.blur();
      });
    }
  };

  useEffect(() => {
    console.log(async?.listItems);
    // Is open and prevPresent is same as present, listItems is the one changed
    if (present && prevPresent.current === present) {
      setIsClosed(false);
    }
    prevPresent.current = present;
  }, [present, async?.listItems]);

  return (
    <Command onKeyDown={handleKeyDown} shouldFilter={false} {...rest}>
      <CommandInput
        ref={inputRef}
        value={value}
        onValueChange={(e) => {
          setValue(e);
          onUserInput(e);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        disabled={disabled}
        left={inputLeft}
        right={inputRight}
        className={inputClassName}
        large={inputLarge}
      />
      <div className="relative mt-1">
        <Presence present={present}>
          <div
            onAnimationEnd={() => {
              if (value.length === 0) setIsClosed(true);
            }}
            className={cn(
              "absolute top-0 isolate z-50 w-full origin-top pb-4 data-[state=open]:block data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
            )}
            data-state={present ? "open" : "closed"}
          >
            <CommandList>
              {((isLoading &&
                async?.listItems &&
                async?.listItems.length === 0) ||
                isClosed) && <CommandLoading />}
              {!isClosed && (
                <CommandGroup>
                  {async &&
                    async.listItems &&
                    async.listItems.map((data) => {
                      const key = async.listValueFunction(data);
                      return (
                        <CommandItem
                          key={key}
                          value={key}
                          onSelect={() => {
                            async.onSelectItem(data);
                            setValue(async.inputReplaceFunction(data));
                            const input = inputRef.current;
                            if (input)
                              requestAnimationFrame(() => {
                                input.blur();
                              });
                          }}
                          onMouseDown={(event) => {
                            event.preventDefault();
                          }}
                        >
                          {async.listElement(data)}
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              )}
              {!isLoading && !isClosed && (
                <CommandEmpty className="select-none rounded-sm px-2 py-6 text-center text-slate-700">
                  {emptyMessage}
                </CommandEmpty>
              )}
            </CommandList>
          </div>
        </Presence>
      </div>
    </Command>
  );
}
