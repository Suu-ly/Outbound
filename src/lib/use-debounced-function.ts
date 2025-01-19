import { useCallback, useRef } from "react";

export default function useDebouncedFunction() {
  const timer = useRef<NodeJS.Timeout>(null);

  const debounce = useCallback((fn: () => void, timeout = 150) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fn();
    }, timeout);
  }, []);

  return debounce;
}
