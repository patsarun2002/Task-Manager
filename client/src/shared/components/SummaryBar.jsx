export default function SummaryBar({ summary }) {
  const items = [
    {
      label: "ทั้งหมด",
      value: summary.total,
      color: "text-zinc-800 dark:text-zinc-200",
      bg: "bg-white dark:bg-zinc-800/80",
      border: "border-zinc-300 dark:border-zinc-700",
    },
    {
      label: "ค้างอยู่",
      value: summary.pending,
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-100/70 dark:bg-amber-950/30",
      border: "border-amber-300 dark:border-amber-900",
    },
    {
      label: "เสร็จแล้ว",
      value: summary.done,
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-100/70 dark:bg-emerald-950/30",
      border: "border-emerald-300 dark:border-emerald-900",
    },
    {
      label: "เลยกำหนด",
      value: summary.overdue,
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-100/70 dark:bg-red-950/30",
      border: "border-red-300 dark:border-red-900",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex flex-col items-center py-3 px-2 rounded-xl border ${item.bg} ${item.border}`}
        >
          <span className={`text-2xl font-bold leading-none ${item.color}`}>{item.value}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
