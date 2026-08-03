import { ListSkeleton } from "@/components/ui/skeleton";
export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="h-10 w-28 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
      <ListSkeleton count={6} type="card" />
    </div>
  );
}
