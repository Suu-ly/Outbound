// Stolen from https://github.com/nodejs/nodejs.org/blob/main/apps/site/hooks/react-client/useCopyToClipboard.ts
import { useEffect, useState } from "react";

const copyToClipboard = async (value: string | undefined) => {
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

  const copyText = (text: string | undefined) =>
    copyToClipboard(text).then(setCopied);

  useEffect(() => {
    if (copied) {
      const timerId = setTimeout(() => setCopied(false), 3000);

      return () => clearTimeout(timerId);
    }

    return undefined;
  }, [copied]);

  return [copied, copyText] as const;
};

export default useCopyToClipboard;
