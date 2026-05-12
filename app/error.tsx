"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="grid h-dvh place-items-center bg-neutral-950 text-neutral-200">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-lg font-semibold">問題が発生しました</h1>
        <p className="mb-4 text-sm text-neutral-400">
          {error.message || "予期しないエラーです"}
        </p>
        <button
          onClick={reset}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}
