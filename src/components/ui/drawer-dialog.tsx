"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { useState } from "react";

type DrawerDialogProps = {
  header: string;
  content: React.ReactNode;
  mainActionLabel: string;
  onMainAction: (close: () => void) => void;
  cancelAction?: string;
  loading?: boolean;
  destructive?: boolean;
  canCancel?: boolean;
  children: React.ReactNode;
};

export default function DrawerDialog({
  header,
  content,
  mainActionLabel,
  onMainAction,
  cancelAction = "Cancel",
  loading = false,
  destructive = false,
  canCancel = true,
  children,
}: DrawerDialogProps) {
  const [open, setOpen] = useState(false);
  const isLarge = useMediaQuery("(min-width: 640px)");

  if (isLarge) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogTitle>{header}</DialogTitle>
          <div>{content}</div>
          <DialogFooter>
            <Button
              className={cn(destructive && "border-rose-900 bg-rose-600")}
              primaryBgColor={destructive ? "bg-rose-900" : undefined}
              onClick={() => onMainAction(() => setOpen(false))}
              loading={loading}
            >
              {mainActionLabel}
            </Button>
            {canCancel && (
              <DialogClose asChild>
                <Button variant="ghost">{cancelAction}</Button>
              </DialogClose>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="space-y-6">
          <DrawerTitle>{header}</DrawerTitle>
          <div>{content}</div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button
                className={cn(destructive && "border-rose-900 bg-rose-600")}
                primaryBgColor={destructive ? "bg-rose-900" : undefined}
                onClick={() => onMainAction(() => setOpen(false))}
                loading={loading}
              >
                {mainActionLabel}
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button variant="ghost">{cancelAction}</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
