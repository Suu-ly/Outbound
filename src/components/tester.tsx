"use client";

import { IconDotsVertical } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import TimePicker from "./time-picker";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
} from "./ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import DrawerDialog from "./ui/drawer-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const Tester = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() =>
          toast("Hello world", {
            description: "This is a test",
            action: {
              label: "Undo",
              onClick: () => console.log("Undo"),
            },
          })
        }
      >
        Toast Normal
      </Button>
      <Button onClick={() => toast.error("This is an error")}>
        Toast error
      </Button>
      <Button
        onClick={() =>
          toast.success("This is an success", { description: "Event created" })
        }
      >
        Toast success
      </Button>
      <Button
        onClick={() =>
          toast.warning("This is an warning", { description: "Event created" })
        }
      >
        Toast warning
      </Button>
      <DrawerDialog
        header="Responsive Dialog"
        description={
          "This is to tell you that there is a certain action that will happen and is asking you to confirm."
        }
        mainActionLabel="Confirm"
        onMainAction={(close) => close()}
        destructive
      >
        <Button size="large">Open Drawer Dialog</Button>
      </DrawerDialog>
      <Carousel className="w-full" orientation="vertical">
        <div
          className="transition-transform active:scale-95"
          style={{ clipPath: "inset(0% 0% 0% 0% round 0.75rem)" }}
        >
          <CarouselContent className="mt-0 h-80">
            {Array.from({ length: 3 }).map((_, index) => (
              <CarouselItem
                key={index}
                className="relative size-full bg-slate-300 pt-0"
              >
                <div className="absolute bottom-2 right-2 flex gap-3 rounded-lg bg-slate-950/70 p-1.5 backdrop-blur">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="size-5">
                      <AvatarFallback>{index}</AvatarFallback>
                    </Avatar>
                    <div className="text-xs text-slate-200">{index}</div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
        <CarouselIndicator />
      </Carousel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button iconOnly size="small" variant="outline">
              <IconDotsVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Content filter preferences</DialogTitle>
            <DialogDescription>
              The content filter flags text that may violate our content policy.
              It&apos;s powered by our moderation endpoint which is free to use
              to moderate your OpenAI API traffic. Learn more.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <h4 className="text-sm text-slate-500">Playground Warnings</h4>
            <div className="flex items-start justify-between space-x-4 pt-3">
              There&apos;s some stuff here
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select something" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectContent>
      </Select>
      <TimePicker
        onConfirm={(close, hours, minutes) => {
          console.log(hours, minutes);
          close();
        }}
        startHours={9}
        startMinutes={10}
        header="Select Time"
        description="Let's pick a time"
        isDuration
      >
        <Button variant="ghost">Pick time</Button>
      </TimePicker>
    </>
  );
};

export default Tester;
