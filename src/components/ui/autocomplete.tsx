"use client";

import { Presence } from "@radix-ui/react-presence";
import {
  ComponentPropsWithoutRef,
  type JSX,
  type KeyboardEvent,
  SetStateAction,
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

type AutoCompleteProps<T> = {
  listItems: T[];
  listElement: (data: T) => JSX.Element;
  listValueFunction: (data: T) => string;
  inputReplaceFunction: (value: string) => string;
  emptyMessage: string;
  value: string;
  setValue: React.Dispatch<SetStateAction<string>>;
  onUserInput: (value: string) => void | Promise<void>;
  onSelectItem: (value: string) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputLarge?: boolean;
  inputClassName?: string;
  inputLeft?: React.ReactNode;
} & ComponentPropsWithoutRef<typeof Command>;

export default function AutoComplete<T>({
  listElement,
  listItems,
  listValueFunction,
  inputReplaceFunction,
  placeholder,
  emptyMessage,
  value,
  setValue,
  onUserInput,
  onSelectItem,
  disabled,
  isLoading = false,
  inputLarge = false,
  inputClassName,
  inputLeft,
  ...rest
}: AutoCompleteProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setOpen] = useState(false);

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
    if (
      (event.key === "Enter" && input.value !== "") ||
      event.key === "Escape"
    ) {
      requestAnimationFrame(() => {
        input.blur();
      });
    }
  };

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
        className={inputClassName}
        large={inputLarge}
      />
      <div className="relative mt-1">
        <Presence present={value.length > 0 && isOpen}>
          <div
            className={cn(
              "absolute top-0 isolate z-50 w-full origin-top pb-4 data-[state=open]:block data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
            )}
            data-state={value.length > 0 && isOpen ? "open" : "closed"}
          >
            <CommandList>
              {isLoading && listItems.length === 0 && <CommandLoading />}
              {listItems.length > 0 && (
                <CommandGroup>
                  {listItems.map((data) => {
                    const key = listValueFunction(data);
                    return (
                      <CommandItem
                        key={key}
                        value={key}
                        onSelect={(value) => {
                          onSelectItem(value);
                          setValue(inputReplaceFunction(value));
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
                        {listElement(data)}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {!isLoading && value.length > 0 && (
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
