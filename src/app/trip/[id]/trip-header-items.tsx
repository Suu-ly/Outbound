"use client";

import ShareButton from "@/components/share-button";
import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconDotsVertical,
  IconEdit,
  IconMapPinSearch,
  IconPlaylistX,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isTripAdminAtom } from "../atoms";

const discoverRegex = new RegExp(`\/trip\/[a-z0-9]{12}\/discover`);
const skipRegex = new RegExp(`\/trip\/[a-z0-9]{12}\/skipped`);

export default function TripHeaderItems() {
  const path = usePathname();

  const basePath = path.substring(0, 18);

  const isDiscover = discoverRegex.test(path);

  const isSkip = skipRegex.test(path);

  const isAdmin = useAtomValue(isTripAdminAtom);

  return (
    <>
      <ShareButton
        className={!isDiscover ? "hidden sm:inline-flex" : undefined}
        link={
          typeof window !== "undefined"
            ? window.location.origin + basePath
            : "/"
        }
      />
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
              <ShareButton
                isDropdown
                className={!isDiscover ? "sm:hidden" : "hidden"}
                link={
                  typeof window !== "undefined"
                    ? window.location.origin + basePath
                    : "/"
                }
              />

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
