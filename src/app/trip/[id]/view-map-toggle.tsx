"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/lib/use-media-query";
import { IconMap, IconX } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { isDraggingAtom } from "../atoms";
import { MapLegends } from "./map-view";

const snapPoints = ["68px", "260px"]; // 1. Just the legend header 2. Full bottom sheet

export default function ViewMapToggle({
  children,
}: {
  children: React.ReactNode;
}) {
  const [viewMap, setViewMap] = useState(false);
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);
  const isDragging = useAtomValue(isDraggingAtom);
  const isLarge = useMediaQuery("(min-width: 640px)");
  return (
    <main
      className={`${viewMap ? "pointer-events-none sm:pointer-events-auto" : ""} fixed inset-x-0 bottom-0 top-14 isolate z-10 sm:static sm:h-full sm:w-1/2 xl:w-1/3`}
    >
      {viewMap && !isLarge && (
        <>
          <Button
            variant="outline"
            className="pointer-events-auto absolute left-1/2 top-4 z-10 -translate-x-1/2 bg-white shadow-md"
            onClick={() => setViewMap(false)}
          >
            <IconX />
            Close Map
          </Button>
          <Drawer
            dismissible={false}
            modal={false}
            snapPoints={snapPoints}
            activeSnapPoint={snap}
            setActiveSnapPoint={setSnap}
            open
          >
            <DrawerContent className="h-full px-0">
              <DrawerTitle className="mb-3 px-4 font-sans text-sm font-medium text-slate-700">
                Legend
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Legends describing what category each place on the map belongs
                to
              </DrawerDescription>
              <Separator />
              <div className="max-h-48 space-y-3 overflow-auto p-4">
                <MapLegends />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}
      <div
        className={`h-full scroll-p-8 overflow-auto ${isDragging ? "scroll-auto" : "scroll-smooth"} bg-zinc-50 ${viewMap ? "invisible sm:visible" : ""}`}
      >
        <Button
          variant="outline"
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 bg-white shadow-md sm:hidden"
          onClick={() => setViewMap(true)}
        >
          <IconMap />
          View Map
        </Button>
        {children}
      </div>
    </main>
  );
}
