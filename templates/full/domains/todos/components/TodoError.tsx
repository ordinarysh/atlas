"use client";

interface TodoErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function TodoError({ message = "Failed to load todos", onRetry }: TodoErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h3 className="text-base font-semibold text-red-800">Something went wrong</h3>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
