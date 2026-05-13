export default function TaskSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 animate-pulse"
        >
          <div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-2/3" />
            <div className="h-2.5 bg-zinc-100 dark:bg-zinc-700 rounded-full w-1/3" />
          </div>
          <div className="h-5 w-14 bg-zinc-100 dark:bg-zinc-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}
