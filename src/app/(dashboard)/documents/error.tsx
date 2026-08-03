"use client";

export default function DocumentsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-lg font-semibold text-gray-900">Documents Error</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-md">{error.message}</p>
      <button onClick={reset} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Try Again
      </button>
    </div>
  );
}
