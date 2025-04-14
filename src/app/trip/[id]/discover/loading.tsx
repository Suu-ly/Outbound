import Skeleton from "@/components/ui/skeleton";

const ReviewSkeleton = () => {
  return (
    <div className="rounded-xl bg-white p-4">
      <div className="mb-4 flex gap-1.5">
        <Skeleton className="size-3" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="mb-2 h-5 w-full" />
      <Skeleton className="mb-2 h-5 w-full" />
      <Skeleton className="mb-3 h-5 w-full" />
      <Skeleton className="mb-6 h-3 w-16" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
};

export default function Loading() {
  return (
    <main className="size-full bg-sky-300 p-4 sm:w-1/2 sm:bg-gray-50 xl:w-1/3">
      <div className="hidden size-full space-y-6 sm:block">
        <Skeleton className="h-[400px] rounded-xl sm:h-[520px]" />
        <div>
          <Skeleton className="mb-2 h-7 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div>
          <Skeleton className="mb-2 h-5 w-full" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex flex-col gap-3 xl:flex-row">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <ReviewSkeleton />
        <ReviewSkeleton />
        <ReviewSkeleton />
      </div>
    </main>
  );
}
