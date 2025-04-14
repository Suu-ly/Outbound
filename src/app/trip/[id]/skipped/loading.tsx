import Skeleton from "@/components/ui/skeleton";

const SkippedPlaceSkeleton = () => {
  return (
    <div className="space-y-2 rounded-xl bg-white p-2">
      <div className="flex w-full">
        <Skeleton className="mr-2 max-h-full w-20 shrink-0 self-stretch overflow-hidden rounded-lg xl:mr-3 xl:w-36"></Skeleton>
        <div className="w-full xl:min-h-24">
          <div className="flex">
            <div className="mr-2 flex min-h-[60px] grow flex-col items-start gap-2">
              <Skeleton className="h-2 w-full max-w-20"></Skeleton>
              <Skeleton className="h-4 w-full max-w-48"></Skeleton>
              <Skeleton className="h-2 w-full max-w-16"></Skeleton>
            </div>
            <Skeleton className="hidden size-8 rounded-full xl:block"></Skeleton>
          </div>
          <Skeleton className="mt-3 hidden h-8 w-full rounded-lg xl:block"></Skeleton>
        </div>
      </div>
      <div className="flex gap-2 xl:hidden">
        <Skeleton className="h-8 grow" />
        <Skeleton className="size-8 rounded-full" />
      </div>
    </div>
  );
};

export default function Loading() {
  return (
    <main className="size-full space-y-6 p-4 sm:w-1/2 xl:w-1/3">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2">
        <SkippedPlaceSkeleton />
        <SkippedPlaceSkeleton />
        <SkippedPlaceSkeleton />
        <SkippedPlaceSkeleton />
        <SkippedPlaceSkeleton />
      </div>
    </main>
  );
}
