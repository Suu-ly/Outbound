import { Separator } from "@/components/ui/separator";
import Skeleton from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="size-full space-y-6 p-4 sm:w-1/2 xl:w-1/3">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-64" />
      <div className="flex w-full max-w-3xl flex-col gap-3 xl:flex-row">
        <Skeleton className="mr-8 h-4 w-24" />
        <div className="grow space-y-2">
          <div className="rounded-xl bg-white">
            <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 p-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-14 rounded-full" />
            </div>
            <div className="p-3">
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="rounded-xl bg-white">
            <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 p-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-14 rounded-full" />
            </div>
            <div className="p-3">
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <div className="rounded-xl bg-white">
            <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 p-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-14 rounded-full" />
            </div>
            <div className="p-3">
              <Skeleton className="h-3 w-96" />
            </div>
          </div>
        </div>
      </div>
      <Separator />
      <div className="flex w-full max-w-3xl flex-col gap-3 xl:flex-row">
        <Skeleton className="mr-8 h-4 w-24" />
        <div className="grow rounded-xl bg-white">
          <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 p-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-14 rounded-full" />
          </div>
          <div className="p-3">
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>
    </main>
  );
}
