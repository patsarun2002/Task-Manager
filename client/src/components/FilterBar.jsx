import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">
            🔍
          </span>
          <Input
            type="text"
            placeholder="ค้นหา task..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        <Select
          value={sort || "__default"}
          onValueChange={(v) => onSortChange(v === "__default" ? "" : v)}
        >
          <SelectTrigger className="w-[160px] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
            <SelectValue placeholder="เรียง: ค่าเริ่มต้น" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__default">เรียง: ค่าเริ่มต้น</SelectItem>
            <SelectItem value="date">เรียง: วันที่</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-[160px] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
            <SelectValue placeholder="Priority: ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Priority: ทั้งหมด</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="low">🟢 Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={category || "__all"}
          onValueChange={(v) => onCategoryChange(v === "__all" ? "" : v)}
        >
          <SelectTrigger className="w-[160px] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
            <SelectValue placeholder="Category: ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Category: ทั้งหมด</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
