import Skeleton from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex h-14 items-center justify-between bg-white pl-5 pr-4">
        <Skeleton className="size-5 sm:w-44" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <main className="flex grow items-center justify-center p-4">
        <Spinner className="size-10" />
      </main>
    </div>
  );
}
