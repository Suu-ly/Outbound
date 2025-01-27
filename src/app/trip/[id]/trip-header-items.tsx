"use client";

import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import {
  IconDotsVertical,
  IconMapPinSearch,
  IconSettings,
  IconShare,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";

export default function TripSwipePage() {
  const path = usePathname();

  const isPlan = false;

  if (isPlan)
    return (
      <>
        <Button size="small" variant="ghost" iconOnly>
          <IconShare />
        </Button>
        <Button size="small" variant="ghost" iconOnly>
          <IconSettings />
        </Button>
        <Button size="small" variant="ghost" iconOnly>
          <IconDotsVertical />
        </Button>
      </>
    );

  return (
    <>
      <ButtonLink href={`${path}/plan`} size="small">
        <IconMapPinSearch />
        Discover Places
      </ButtonLink>
      <Button size="small" variant="ghost" iconOnly>
        <IconDotsVertical />
      </Button>
    </>
  );
}
