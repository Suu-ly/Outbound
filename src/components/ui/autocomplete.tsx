"use client";

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
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

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

  const scoredItems = useMemo(
    () =>
      sync && !!defaultFilter
        ? sync.listItems
            .map((item, index) => {
              const score = value
                ? defaultFilter!(sync.inputReplaceFunction(item), value)
                : 1;
              if (score === 0) return;
              return [item, index, score] as const;
            })
            .filter((val) => !!val)
            .sort((a, b) => b[2] - a[2])
        : undefined,
    [sync, value],
  );
  const present =
    isOpen &&
    ((sync && scoredItems && scoredItems.length > 0) || value.length > 0);
  const prevAsyncItems = useRef<T[] | undefined>(undefined);
  const prevIsLoading = useRef(false);
  const prevInputBeforeClose = useRef(value);
  const prevInput = useRef(value);

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
    if (!isClosed) return;
    const itemsChanged = () => {
      if (
        Array.isArray(async?.listItems) &&
        Array.isArray(prevAsyncItems.current)
      ) {
        if (async.listItems.length !== prevAsyncItems.current.length)
          return true;
        for (let i = 0; i < async.listItems.length; i++) {
          if (
            async.listValueFunction(async.listItems[i]) !==
            async.listValueFunction(prevAsyncItems.current[i])
          )
            return true;
        }
        // For empty arrays, always treat as different
        if (async.listItems.length === 0) {
          return true;
        }
        return false;
      }
      return !async?.listItems !== !prevAsyncItems.current;
    };
    if (
      (prevIsLoading.current && !isLoading) ||
      (!isLoading && itemsChanged()) ||
      value === prevInputBeforeClose.current
    ) {
      setIsClosed(false);
    }
    return () => {
      prevIsLoading.current = isLoading;
      prevAsyncItems.current = async?.listItems;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, async, value]);

  useEffect(() => {
    const val = value;
    if (!val) {
      prevInputBeforeClose.current = prevInput.current;
      if (sync) setIsClosed(true);
    }
    return () => {
      if (val) prevInput.current = val;
    };
  }, [sync, value]);

  return (
    <Command onKeyDown={handleKeyDown} shouldFilter={false} {...rest}>
      <Popover open={present}>
        <PopoverTrigger asChild>
          <div>
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
          </div>
        </PopoverTrigger>
        <PopoverContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          onAnimationEnd={() => {
            if (value.length === 0) setIsClosed(true);
          }}
          className="w-[--radix-popover-trigger-width] rounded-none border-0 bg-transparent p-0 shadow-none"
        >
          <CommandList className="w-full">
            {sync && scoredItems && scoredItems.length > 0 && (
              <CommandGroup heading={sync.header}>
                {scoredItems.map(([item, index]) => {
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

            {sync &&
              async &&
              scoredItems &&
              scoredItems.length > 0 &&
              value.length > 0 && <CommandSeparator alwaysRender />}

            {(!sync || value.length > 0) && (
              <CommandGroup heading={async?.header}>
                {isClosed && <CommandLoading />}
                {!isClosed &&
                  async?.listItems &&
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
                {async?.listItems && async.listItems.length === 0 && (
                  <div className="select-none rounded-sm px-2 py-6 text-center text-slate-700">
                    {emptyMessage}
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
}
