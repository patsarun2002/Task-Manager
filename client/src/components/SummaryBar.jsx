export default function SummaryBar({ summary }) {
  const items = [
    {
      label: "ทั้งหมด",
      value: summary.total,
      color: "text-zinc-700 dark:text-zinc-300",
      bg: "bg-zinc-50 dark:bg-zinc-800",
      border: "border-zinc-200 dark:border-zinc-700",
    },
    {
      label: "ค้างอยู่",
      value: summary.pending,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-900",
    },
    {
      label: "เสร็จแล้ว",
      value: summary.done,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-900",
    },
    {
      label: "เลยกำหนด",
      value: summary.overdue,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-900",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex flex-col items-center py-3 px-2 rounded-xl border ${item.bg} ${item.border}`}
        >
          <span className={`text-2xl font-bold leading-none ${item.color}`}>
            {item.value}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
