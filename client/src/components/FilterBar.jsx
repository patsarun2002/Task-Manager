export default function FilterBar({
  filter,
  search,
  sort,
  priority,
  category,
  onFilterChange,
  onSearchChange,
  onSortChange,
  onPriorityChange,
  categories = [],
  onCategoryChange,
}) {
  const tabs = [
    { value: "all", label: "ทั้งหมด" },
    { value: "pending", label: "ค้างอยู่" },
    { value: "done", label: "เสร็จแล้ว" },
  ];

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => onFilterChange(t.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              filter === t.value
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + selects */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="ค้นหา task..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-zinc-600 dark:text-zinc-300 cursor-pointer"
        >
          <option value="">เรียง: ค่าเริ่มต้น</option>
          <option value="date">เรียง: วันที่</option>
        </select>

        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-zinc-600 dark:text-zinc-300 cursor-pointer"
        >
          <option value="all">Priority: ทั้งหมด</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition text-zinc-600 dark:text-zinc-300 cursor-pointer"
        >
          <option value="">Category: ทั้งหมด</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
