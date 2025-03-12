"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Rating from "@/components/ui/rating";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useCopyToClipboard from "@/lib/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { PlacesReview } from "@/server/types";
import { Slot } from "@radix-ui/react-slot";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

const InfoWithCopy = ({
  copy,
  tooltipLabel,
  successMessage,
  asChild = false,
  children,
}: {
  copy: string;
  tooltipLabel: string;
  successMessage?: string;
  asChild?: boolean;
  children: ReactNode;
}) => {
  const [copied, copyToClipboard] = useCopyToClipboard();

  const onCopy = useCallback(() => {
    copyToClipboard(copy);
    toast.success(successMessage ?? "Copied to clipboard!", {
      id: copy,
    });
  }, [copy, copyToClipboard, successMessage]);

  const Comp = asChild ? Slot : "div";

  return (
    <div className="group relative">
      <Comp className="inline-flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 [&_svg]:size-5 [&_svg]:text-slate-600">
        {children}
      </Comp>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            iconOnly
            onClick={onCopy}
            size="small"
            className="absolute right-4 top-0.5 hidden bg-slate-100 group-hover:inline-flex"
          >
            {copied ? <IconCheck /> : <IconCopy />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltipLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
};

const Review = ({ review }: { review: PlacesReview }) => {
  const [expanded, setExpanded] = useState(false);
  const [scrollHeight, setScrollHeight] = useState(72);
  const [isOverflowing, setIsOverflowing] = useState(true);
  const textNode = useRef<HTMLDivElement>(null);

  const isMountAnimationPreventedRef = useRef(true);
  const originalStylesRef = useRef<Record<string, string>>(undefined);

  const handleOnClick = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Code referenced from https://github.com/radix-ui/primitives/blob/main/packages/react/collapsible/src/collapsible.tsx
  useLayoutEffect(() => {
    const node = textNode.current;
    if (node) {
      originalStylesRef.current = originalStylesRef.current || {
        transitionDuration: node.style.transitionDuration,
        animationName: node.style.animationName,
      };
      // block any animations/transitions so the element renders at its full dimensions
      node.style.transitionDuration = "0s";
      node.style.animationName = "none";
      setScrollHeight(node.scrollHeight);

      // kick off any animations/transitions that were originally set up if it isn't the initial mount
      if (!isMountAnimationPreventedRef.current) {
        node.style.transitionDuration =
          originalStylesRef.current.transitionDuration;
        node.style.animationName = originalStylesRef.current.animationName;
      }
    }
  }, [expanded]);

  useEffect(() => {
    const handleResize = () => {
      if (textNode.current) {
        setIsOverflowing(textNode.current.scrollHeight > 72);
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize();
    const rAF = requestAnimationFrame(
      () => (isMountAnimationPreventedRef.current = false),
    );

    return () => {
      cancelAnimationFrame(rAF);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="rounded-xl bg-white p-4">
      <div className="mb-4 flex gap-1.5">
        <span className="text-xs font-medium text-slate-700">
          {review.rating.toFixed(1)}
        </span>
        <Rating rating={review.rating} size={16} className="text-amber-400" />
        <span className="text-xs text-slate-500">
          {review.relativePublishTimeDescription}
        </span>
      </div>
      <div className="mb-6" id={review.name}>
        <p
          className={cn(
            "mb-1 overflow-hidden whitespace-pre-line text-slate-700",
            isOverflowing && !expanded && "line-clamp-3",
            isOverflowing &&
              "data-[expanded=false]:animate-minimise data-[expanded=true]:animate-expand",
          )}
          style={
            {
              "--content-height": `${scrollHeight}px`,
              "--content-closed": "4.5rem",
            } as CSSProperties
          }
          data-expanded={expanded}
          ref={textNode}
        >
          {review.text
            ? review.text.text
            : review.originalText
              ? review.originalText.text
              : ""}
        </p>
        {isOverflowing && (
          <button
            className="-m-2 rounded-full p-2 text-xs font-medium text-brand-600 ring-offset-zinc-50 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            aria-expanded={expanded}
            aria-controls={review.name}
            onClick={handleOnClick}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Avatar className="rounded-none">
          <AvatarImage
            src={review.authorAttribution.photoUri}
            alt={review.authorAttribution.displayName}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <AvatarFallback>
            {review.authorAttribution.displayName.substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-slate-700">
          {review.authorAttribution.displayName}
        </span>
      </div>
    </div>
  );
};

export { InfoWithCopy, Review };
