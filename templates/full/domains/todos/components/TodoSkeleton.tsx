"use client";

export function TodoSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
