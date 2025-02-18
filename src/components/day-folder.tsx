import { cn } from "@/lib/utils";
import { PlaceDataPlaceInfo } from "@/server/types";
import {
  IconChevronRight,
  IconGripVertical,
  IconSearch,
} from "@tabler/icons-react";
import { forwardRef } from "react";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

type DayFolderProps = {
  date: Date;
  savedPlaces?: PlaceDataPlaceInfo[];
};

const DayFolder = forwardRef<
  React.ComponentRef<typeof Collapsible>,
  React.ComponentPropsWithoutRef<typeof Collapsible> & DayFolderProps
>(({ className, date, children, ...props }, ref) => {
  return (
    <Collapsible ref={ref} {...props} className="space-y-4" defaultOpen>
      <div
        className={cn(
          "flex items-center gap-1 rounded-lg bg-white p-2 pr-1",
          className,
        )}
      >
        <CollapsibleTrigger className="-m-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 data-[state=open]:rotate-90">
          <IconChevronRight className="text-slate-700" />
        </CollapsibleTrigger>
        <div className="flex w-full gap-4 font-display text-lg font-medium text-slate-900">
          <span>
            {date.toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "2-digit",
            })}
          </span>
          <Separator orientation="vertical" className="h-auto" />
          <span>
            {date.toLocaleDateString(undefined, {
              weekday: "short",
            })}
          </span>
        </div>
        <Button
          iconOnly
          variant="ghost"
          size="small"
          aria-label="Drag handle"
          className="shrink-0"
        >
          <IconGripVertical />
        </Button>
      </div>
      <CollapsibleContent className="space-y-4">
        {children}
        <Input left={<IconSearch />} placeholder="Add a location..." />
      </CollapsibleContent>
    </Collapsible>
  );
});

DayFolder.displayName = "DayFolder";

export default DayFolder;
