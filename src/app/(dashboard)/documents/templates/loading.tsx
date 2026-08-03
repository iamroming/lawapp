export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-1/4 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}
