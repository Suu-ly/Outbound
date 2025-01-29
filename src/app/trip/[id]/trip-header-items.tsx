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
import { useAtomValue } from "jotai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { isTripAdminAtom } from "../atoms";

const discoverRegex = new RegExp(`\/trip\/[a-z0-9]{12}\/discover`);
const skipRegex = new RegExp(`\/trip\/[a-z0-9]{12}\/skipped`);

export default function TripHeaderItems() {
  const path = usePathname();
  const [, copyToClipboard] = useCopyToClipboard();

  const basePath = path.substring(0, 18);

  const isDiscover = discoverRegex.test(path);

  const isSkip = skipRegex.test(path);

  const isAdmin = useAtomValue(isTripAdminAtom);

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
        className={!isDiscover ? "hidden sm:inline-flex" : undefined}
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
            className={!isDiscover ? "hidden sm:inline-flex" : undefined}
          >
            <IconSettings />
          </ButtonLink>
          {!isDiscover && (
            <ButtonLink href={`${basePath}/discover`} size="small">
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
                className={!isDiscover ? "sm:hidden" : "hidden"}
                onClick={onCopy}
              >
                <IconShare />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                className={!isDiscover ? "sm:hidden" : "hidden"}
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
