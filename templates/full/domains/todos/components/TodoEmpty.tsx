"use client";

export function TodoEmpty() {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
      <p className="text-base font-medium text-gray-600">No todos yet</p>
      <p className="mt-1 text-sm text-gray-500">Create your first todo to get started</p>
    </div>
  );
}
