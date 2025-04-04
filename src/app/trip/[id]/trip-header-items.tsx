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
import { useAtomValue, useSetAtom } from "jotai";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  changeTripNameDialogOpenAtom,
  deleteTripDialogOpenAtom,
  isTripAdminAtom,
  setToPublicDialogOpenAtom,
  tripDetailsAtom,
} from "../atoms";

const discoverRegex = new RegExp(`\/trip\/[a-z0-9]{12}\/discover`);
const skipRegex = new RegExp(`\/trip\/[a-z0-9]{12}\/skipped`);

export default function TripHeaderItems({ loggedIn }: { loggedIn: boolean }) {
  const path = usePathname();
  const id = useParams<{ id: string }>().id;

  const basePath = `/trip/${id}`;

  const isDiscover = discoverRegex.test(path);

  const isSkip = skipRegex.test(path);

  const isAdmin = useAtomValue(isTripAdminAtom);
  const tripDetails = useAtomValue(tripDetailsAtom);

  const setToPublicDialogOpen = useSetAtom(setToPublicDialogOpenAtom);
  const openDialog = () => {
    setToPublicDialogOpen({
      tripId: tripDetails.id,
    });
  };
  const setChangeTripNameDialogOpen = useSetAtom(changeTripNameDialogOpenAtom);
  const setDeleteTripDialogOpen = useSetAtom(deleteTripDialogOpenAtom);

  return (
    <>
      <ShareButton
        link={process.env.NEXT_PUBLIC_URL + basePath}
        message="Trip link copied to clipboard!"
        className={!isDiscover ? "hidden sm:inline-flex" : undefined}
        onAction={tripDetails.private ? openDialog : undefined}
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
                link={process.env.NEXT_PUBLIC_URL + basePath}
                message="Trip link copied to clipboard!"
                onAction={tripDetails.private ? openDialog : undefined}
                className={!isDiscover ? "sm:hidden" : "hidden"}
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
              <DropdownMenuItem
                onSelect={() =>
                  setChangeTripNameDialogOpen({
                    tripId: tripDetails.id,
                    currentName: tripDetails.name,
                  })
                }
              >
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
              <DropdownMenuItem
                onSelect={() =>
                  setDeleteTripDialogOpen({
                    tripId: tripDetails.id,
                    name: tripDetails.name,
                  })
                }
                className="text-rose-700 focus:text-rose-900 [&_svg]:text-rose-600 [&_svg]:focus:text-rose-700"
              >
                <IconTrash />
                Delete trip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      {!loggedIn && (
        <ButtonLink
          href={
            "/login?" +
            new URLSearchParams([["redirect", `/trip/${id}`]]).toString()
          }
          size="small"
          prefetch={false}
        >
          Login
        </ButtonLink>
      )}
    </>
  );
}
