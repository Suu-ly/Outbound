"use client";

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
  emptyMessage: string;
  value: string;
  setValue: React.Dispatch<SetStateAction<string>>;
  onValueChange: (value: string) => void;
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
  placeholder,
  emptyMessage,
  value,
  setValue,
  onValueChange,
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
          onValueChange(e);
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
        <div
          className={cn(
            "absolute top-0 z-50 w-full",
            value.length > 0 && isOpen ? "block" : "hidden",
          )}
        >
          <CommandList>
            {isLoading && <CommandLoading />}
            {listItems.length > 0 && (
              <CommandGroup>
                {listItems.map((data) => {
                  const key = listValueFunction(data);
                  return (
                    <CommandItem
                      key={key}
                      value={key}
                      onSelect={(value) => {
                        setValue(value);
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
            {!isLoading ? (
              <CommandEmpty className="select-none rounded-sm px-2 py-3 text-center text-sm">
                {emptyMessage}
              </CommandEmpty>
            ) : null}
          </CommandList>
        </div>
      </div>
    </Command>
  );
}
