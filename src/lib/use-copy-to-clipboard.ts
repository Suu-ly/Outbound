// Stolen from https://github.com/nodejs/nodejs.org/blob/main/apps/site/hooks/react-client/useCopyToClipboard.ts
import { useEffect, useRef, useState } from "react";

export const copyToClipboard = async (value: string | undefined) => {
  if (!value || typeof navigator === "undefined") {
    return Promise.resolve(false);
  }

  return navigator.clipboard
    .writeText(value)
    .then(() => true)
    .catch(() => false);
};

const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const copyDelay = useRef<NodeJS.Timeout>(null);

  const copyText = async (text: string | undefined) => {
    // Only display loading spinner if copying takes more than 100ms
    copyDelay.current = setTimeout(() => setIsCopying(true), 100);
    const res = await copyToClipboard(text);
    setCopied(res);
  };

  useEffect(() => {
    if (copied) {
      if (copyDelay.current) clearTimeout(copyDelay.current);
      setIsCopying(false);

      const timerId = setTimeout(() => setCopied(false), 3000);

      return () => clearTimeout(timerId);
    }

    return undefined;
  }, [copied]);

  return [copied, copyText, isCopying] as const;
};

export default useCopyToClipboard;
