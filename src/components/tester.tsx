"use client";

import { toast } from "sonner";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselItem,
} from "./ui/carousel";
import DrawerDialog from "./ui/drawer-dialog";

const Tester = () => {
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
        content={
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
    </>
  );
};

export default Tester;
