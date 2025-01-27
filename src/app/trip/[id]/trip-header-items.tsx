"use client";

import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useCopyToClipboard from "@/lib/use-copy-to-clipboard";
import {
  IconDotsVertical,
  IconEdit,
  IconMapPinSearch,
  IconPlaylistX,
  IconSettings,
  IconShare,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

export default function TripSwipePage() {
  const path = usePathname();
  const [, copyToClipboard] = useCopyToClipboard();

  const basePath = path.substring(0, 17);

  const isPlan = /\/trip\/[a-z0-9]{12}\/plan/.test(path);

  const isSkip = /\/trip\/[a-z0-9]{12}\/skipped/.test(path);

  const isAdmin = true;

  const onCopy = useCallback(() => {
    copyToClipboard(window.location.origin + basePath);
    toast.success("Trip link copied to clipboard!", {
      id: "CopyToClipboard",
    });
  }, [basePath, copyToClipboard]);

  return (
    <>
      <Button
        size="small"
        variant="ghost"
        iconOnly
        aria-label="Share"
        className={!isPlan ? "hidden sm:inline-flex" : undefined}
        onClick={onCopy}
      >
        <IconShare />
      </Button>
      {isAdmin && (
        <>
          <ButtonLink
            href={`${basePath}/settings`}
            size="small"
            variant="ghost"
            iconOnly
            aria-label="Settings"
            className={!isPlan ? "hidden sm:inline-flex" : undefined}
          >
            <IconSettings />
          </ButtonLink>
          {!isPlan && (
            <ButtonLink href={`${basePath}/plan`} size="small">
              <IconMapPinSearch />
              Discover Places
            </ButtonLink>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="small" variant="ghost" iconOnly aria-label="More">
                <IconDotsVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className={!isPlan ? "sm:hidden" : undefined}
                onClick={onCopy}
              >
                <IconShare />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                className={!isPlan ? "sm:hidden" : undefined}
                asChild
              >
                <Link href={`${basePath}/settings`}>
                  <IconSettings />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconEdit />
                Edit trip name
              </DropdownMenuItem>
              {!isSkip && (
                <DropdownMenuItem asChild>
                  <Link href={`${basePath}/skipped`}>
                    <IconPlaylistX />
                    View skipped places
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-rose-700 focus:text-rose-900 [&_svg]:text-rose-600 [&_svg]:focus:text-rose-700">
                <IconTrash />
                Delete trip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </>
  );
}
