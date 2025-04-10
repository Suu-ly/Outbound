import Skeleton from "@/components/ui/skeleton";

export default function PlaceDetailsSkeletonLoader() {
  return (
    <div
      className="relative mb-2 ml-[46px] flex items-start rounded-xl bg-white p-2 duration-300 animate-in fade-in-0"
      role="presentation"
    >
      <span className="sr-only">Loading place</span>
      <Skeleton className="absolute -left-[41px] top-0 size-8 rounded-full border-2 border-gray-100"></Skeleton>
      <Skeleton className="relative mr-2 max-h-full w-20 shrink-0 self-stretch overflow-hidden rounded-lg xl:mr-3 xl:w-36"></Skeleton>
      <div className="w-full xl:min-h-24">
        <div className="flex gap-3">
          <div className="flex min-h-[60px] grow flex-col items-start gap-2">
            <Skeleton className="h-2 w-full max-w-20"></Skeleton>
            <Skeleton className="h-4 w-full max-w-48"></Skeleton>
            <Skeleton className="h-2 w-full max-w-16"></Skeleton>
          </div>
          <Skeleton className="size-8 rounded-full"></Skeleton>
        </div>
        <Skeleton className="mt-3 hidden h-8 w-full rounded-lg xl:block"></Skeleton>
      </div>
    </div>
  );
}
