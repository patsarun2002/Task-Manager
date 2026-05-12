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
  onCategoryChange, // ← เพิ่ม
}) {
  return (
    <div className="filter-bar">
      {/* ของเดิม */}
      <div className="filter-buttons">
        {["all", "pending", "done"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => onFilterChange(f)}
          >
            {f === "all"
              ? "ทั้งหมด"
              : f === "pending"
                ? "ค้างอยู่"
                : "เสร็จแล้ว"}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="ค้นหา task..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="sort-select"
      >
        <option value="">เรียงตาม: ค่าเริ่มต้น</option>
        <option value="date">เรียงตาม: วันที่</option>
      </select>

      {/* ← เพิ่ม */}
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="sort-select"
      >
        <option value="all">Priority: ทั้งหมด</option>
        <option value="high">🔴 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🟢 Low</option>
      </select>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="sort-select"
      >
        <option value="">Category...</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}