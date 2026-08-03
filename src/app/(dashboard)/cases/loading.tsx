import { ListSkeleton } from "@/components/ui/skeleton";
export default function CasesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-56 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="h-10 w-28 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-gray-200 animate-pulse rounded" />
        <div className="h-10 w-40 bg-gray-200 animate-pulse rounded" />
      </div>
      <ListSkeleton count={5} type="row" />
    </div>
  );
}
