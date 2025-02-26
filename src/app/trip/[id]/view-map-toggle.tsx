"use client";

import { Button } from "@/components/ui/button";
import { IconMap, IconX } from "@tabler/icons-react";
import { useState } from "react";

export default function ViewMapToggle({
  children,
}: {
  children: React.ReactNode;
}) {
  const [viewMap, setViewMap] = useState(false);

  return (
    <main className="pointer-events-none absolute bottom-0 z-50 h-[calc(100dvh-56px)] w-full sm:static sm:h-full sm:w-1/2 xl:w-1/3">
      <div className="relative size-full">
        {viewMap && (
          <Button
            variant="outline"
            className="pointer-events-auto absolute left-1/2 top-4 z-10 -translate-x-1/2 bg-white shadow-md sm:hidden"
            onClick={() => setViewMap((prev) => !prev)}
          >
            <IconX />
            Close Map
          </Button>
        )}
        <div
          className={`h-full overflow-auto bg-zinc-50 ${viewMap ? "pointer-events-none invisible" : "pointer-events-auto"}`}
        >
          <Button
            variant="outline"
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 bg-white shadow-md sm:hidden"
            onClick={() => setViewMap((prev) => !prev)}
          >
            <IconMap />
            View Map
          </Button>
          {children}
        </div>
      </div>
    </main>
  );
}
