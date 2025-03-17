"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function TripOverviewSortSelect() {
  const searchParams = useSearchParams().get("sortBy");
  const path = usePathname();
  const { replace } = useRouter();
  const handleValueChange = (value: string) => {
    const params = new URLSearchParams();
    if (value === "date") {
      params.set("sortBy", value);
    } else {
      params.delete("sortBy");
    }
    replace(`${path}?${params.toString()}`);
  };

  return (
    <Select
      onValueChange={handleValueChange}
      defaultValue={searchParams ?? "recent"}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">Recently Edited</SelectItem>
        <SelectItem value="date">Trip Start Date</SelectItem>
      </SelectContent>
    </Select>
  );
}
