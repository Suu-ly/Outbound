import Skeleton from "@/components/ui/skeleton";
import PlaceDetailsSkeletonLoader from "./place-details-skeleton-loader";

export default function Loading() {
  return (
    <main className="size-full sm:w-1/2 xl:w-1/3">
      <div className="flex aspect-square w-full items-end bg-slate-200 p-4">
        <div className="w-full rounded-2xl bg-white p-4">
          <Skeleton className="mx-auto mb-6 h-8 w-56" />
          <Skeleton className="mx-auto mb-2 h-6 w-52" />
          <Skeleton className="mx-auto h-4 w-16" />
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <PlaceDetailsSkeletonLoader />
        <PlaceDetailsSkeletonLoader />
        <PlaceDetailsSkeletonLoader />
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <div className="-mx-2 space-y-2 rounded-2xl bg-gray-100 px-2 py-1">
          <div className="flex items-center justify-between p-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="size-8 rounded-full" />
          </div>
          <PlaceDetailsSkeletonLoader />
          <Skeleton className="ml-11 h-10 grow" />
          <PlaceDetailsSkeletonLoader />
          <Skeleton className="ml-11 h-10 grow" />
          <PlaceDetailsSkeletonLoader />
          <Skeleton className="h-10 grow" />
        </div>
      </div>
    </main>
  );
}
