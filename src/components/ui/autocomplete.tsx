"use client";

import { Presence } from "@radix-ui/react-presence";
import { defaultFilter } from "cmdk";
import {
  ComponentPropsWithoutRef,
  type JSX,
  type KeyboardEvent,
  SetStateAction,
  useEffect,
  useMemo,
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
  CommandSeparator,
} from "./command";

type asyncProps<P> = {
  listItems: P[] | undefined;
  listElement: (data: P) => JSX.Element;
  listValueFunction: (data: P) => string;
  inputReplaceFunction: (data: P) => string;
  onSelectItem: (data: P) => void | Promise<void>;
  header?: string;
};

type syncProps<P> = {
  listItems: P[];
  listElement: (data: P, originalIndex: number) => JSX.Element;
  listValueFunction: (data: P) => string;
  inputReplaceFunction: (data: P) => string;
  onSelectItem: (data: P) => void | Promise<void>;
  header?: string;
};

type AutoCompleteProps<T, P> = {
  async?: asyncProps<T>;
  sync?: syncProps<P>;
  value: string;
  setValue: React.Dispatch<SetStateAction<string>>;
  onUserInput: (value: string) => void | Promise<void>;
  clearOnSelect?: boolean;
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
  clearOnSelect,
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
  const prevInput = useRef(value);

  const scoredItems = useMemo(
    () =>
      sync && defaultFilter
        ? sync.listItems
            .map((item, index) => {
              const score = value
                ? defaultFilter!(sync.inputReplaceFunction(item), value)
                : 0;
              if (score === 0) return;
              return [item, index, score] as const;
            })
            .filter((val) => !!val)
            .sort((a, b) => b[2] - a[2])
        : undefined,
    [sync, value],
  );

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
    // Is open and prevPresent is same as present, listItems is the one changed
    // Or no change as input is the same as previous one before closed
    // Set isClosed to false to remove spinner
    if (
      (present && prevPresent.current === present) ||
      (present && value === prevInput.current)
    ) {
      setIsClosed(false);
    }
    prevPresent.current = present;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present, async?.listItems]);

  useEffect(() => {
    const val = value;
    return () => {
      if (val) prevInput.current = val;
    };
  }, [value]);

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
              {sync && scoredItems && scoredItems.length > 0 && (
                <CommandGroup heading={sync.header}>
                  {scoredItems?.slice(0, 5).map(([item, index]) => {
                    const key = sync.listValueFunction(item);
                    return (
                      <CommandItem
                        key={key}
                        value={key}
                        onSelect={() => {
                          sync.onSelectItem(item);
                          if (clearOnSelect) setValue("");
                          else setValue(sync.inputReplaceFunction(item));
                          const input = inputRef.current;
                          if (input)
                            requestAnimationFrame(() => {
                              input.blur();
                            });
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {sync.listElement(item, index)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {sync && async && scoredItems && scoredItems.length > 0 && (
                <CommandSeparator alwaysRender />
              )}

              <CommandGroup heading={async?.header}>
                {((isLoading &&
                  async?.listItems &&
                  async?.listItems.length === 0) ||
                  isClosed) && <CommandLoading />}
                {!isClosed &&
                  async &&
                  async.listItems &&
                  async.listItems.map((data) => {
                    const key = async.listValueFunction(data);
                    return (
                      <CommandItem
                        key={key}
                        value={key}
                        onSelect={() => {
                          async.onSelectItem(data);
                          if (clearOnSelect) setValue("");
                          else setValue(async.inputReplaceFunction(data));
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
