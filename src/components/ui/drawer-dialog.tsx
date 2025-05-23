"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type DrawerDialogProps = {
  header: string;
  content?: React.ReactNode;
  description: string;
  mainActionLabel: string;
  onMainAction: (close: () => void) => void;
  cancelAction?: string;
  loading?: boolean;
  destructive?: boolean;
  canCancel?: boolean;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function DrawerDialog({
  header,
  description,
  content,
  mainActionLabel,
  onMainAction,
  cancelAction = "Cancel",
  loading = false,
  destructive = false,
  canCancel = true,
  open,
  onOpenChange,
  children,
}: DrawerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isLarge = useMediaQuery("(min-width: 640px)");

  const close = () => {
    if (onOpenChange) onOpenChange(false);
    setInternalOpen(false);
  };

  if (isLarge) {
    return (
      <Dialog
        open={open !== undefined ? open : internalOpen}
        onOpenChange={(open) => {
          if (onOpenChange) onOpenChange(open);
          setInternalOpen(open);
        }}
      >
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent
          onInteractOutside={(e) => loading && e.preventDefault()}
          onEscapeKeyDown={(e) => loading && e.preventDefault()}
        >
          <DialogTitle className="line-clamp-2 break-words">
            {header}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {description}
          </DialogDescription>
          {content && <div>{content}</div>}
          <DialogFooter>
            <Button
              className={cn(destructive && "border-rose-900 bg-rose-600")}
              primaryBgColor={destructive ? "bg-rose-900" : undefined}
              onClick={() => onMainAction(close)}
              loading={loading}
            >
              {mainActionLabel}
            </Button>
            {canCancel && (
              <DialogClose asChild>
                <Button variant="ghost" disabled={loading}>
                  {cancelAction}
                </Button>
              </DialogClose>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open !== undefined ? open : internalOpen}
      onOpenChange={(open) => {
        if (onOpenChange) onOpenChange(open);
        setInternalOpen(open);
      }}
    >
      {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
      <DrawerContent
        onInteractOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        <div className="space-y-6">
          <DrawerTitle className="line-clamp-2 break-words">
            {header}
          </DrawerTitle>
          <DrawerDescription className="whitespace-pre-line">
            {description}
          </DrawerDescription>
          {content && <div>{content}</div>}
          <DrawerFooter>
            <Button
              className={cn(destructive && "border-rose-900 bg-rose-600")}
              primaryBgColor={destructive ? "bg-rose-900" : undefined}
              onClick={() => onMainAction(close)}
              loading={loading}
            >
              {mainActionLabel}
            </Button>
            {canCancel && (
              <DrawerClose asChild>
                <Button variant="ghost" disabled={loading}>
                  {cancelAction}
                </Button>
              </DrawerClose>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
