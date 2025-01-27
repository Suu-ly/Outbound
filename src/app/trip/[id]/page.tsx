"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { IconMap, IconX } from "@tabler/icons-react";
import { useState } from "react";

export default function TripPage() {
  const session = authClient.useSession();

  const [viewMap, setViewMap] = useState(false);

  return (
    <main className="pointer-events-none absolute z-50 h-[calc(100dvh-56px)] w-full sm:static sm:h-full sm:w-1/2 lg:w-1/3">
      <div className="relative size-full">
        {viewMap && (
          <Button
            variant="outline"
            className="pointer-events-auto absolute left-1/2 top-4 -translate-x-1/2 bg-white shadow-md sm:hidden"
            onClick={() => setViewMap((prev) => !prev)}
          >
            <IconX />
            Close Map
          </Button>
        )}
        {!viewMap && (
          <Button
            variant="outline"
            className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-md sm:hidden"
            onClick={() => setViewMap((prev) => !prev)}
          >
            <IconMap />
            View Map
          </Button>
        )}
        {!viewMap && (
          <div className="pointer-events-auto h-full bg-zinc-50"></div>
        )}
      </div>
    </main>
  );
}
