import BackButton from "@/components/back-button";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";
import ViewMapToggle from "../view-map-toggle";

export default function TripPage() {
  return (
    <ViewMapToggle>
      <div className="space-y-4 p-4 xl:space-y-6">
        <BackButton className="-ml-2" />
        <h1 className="font-display text-2xl font-semibold xl:text-4xl">
          Skipped Places
        </h1>
        <Input
          left={<IconSearch />}
          placeholder="Search for a skipped place..."
        />
      </div>
    </ViewMapToggle>
  );
}
