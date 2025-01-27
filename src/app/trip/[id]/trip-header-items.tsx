"use client";

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
  IconShare,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TripSwipePage() {
  const path = usePathname();

  const isPlan = /\/trip\/[a-z0-9]{12}\/plan/.test(path);

  const isAdmin = true;

  return (
    <>
      <Button
        size="small"
        variant="ghost"
        iconOnly
        aria-label="Share"
        className={!isPlan ? "hidden sm:inline-flex" : undefined}
      >
        <IconShare />
      </Button>
      {isAdmin && (
        <>
          <Button
            size="small"
            variant="ghost"
            iconOnly
            aria-label="Settings"
            className={!isPlan ? "hidden sm:inline-flex" : undefined}
          >
            <IconSettings />
          </Button>
          {!isPlan && (
            <ButtonLink href={`${path}/plan`} size="small">
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
              <DropdownMenuItem>
                <IconShare />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconSettings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconEdit />
                Edit trip name
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${path}/skipped`}>
                  <IconPlaylistX />
                  View skipped places
                </Link>
              </DropdownMenuItem>
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
