import Skeleton from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex h-14 items-center justify-end bg-white pr-4">
        <Skeleton className="size-8 rounded-full" />
      </div>
      <main className="flex grow flex-col items-center gap-6 px-4 py-8">
        <div>
          <Skeleton className="mx-auto mb-4 size-16 rounded-full" />
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="h-10 w-[132px] rounded-full" />
        <div className="flex w-full max-w-3xl flex-col gap-3 xl:flex-row">
          <Skeleton className="mr-8 h-4 w-24" />
          <div className="grow space-y-2">
            <div className="flex h-14 items-center gap-3 rounded-xl bg-white p-4">
              <Skeleton className="mr-8 h-5 w-12" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex h-14 items-center gap-3 rounded-xl bg-white p-4">
              <Skeleton className="mr-8 h-5 w-12" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex h-14 items-center gap-3 rounded-xl bg-white p-4">
              <Skeleton className="mr-4 h-5 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
        <div className="flex w-full max-w-3xl flex-col gap-3 xl:flex-row">
          <Skeleton className="mr-8 h-4 w-24" />
          <div className="flex h-[140px] grow flex-col items-end gap-6 p-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
