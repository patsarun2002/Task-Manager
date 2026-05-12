export default function FilterBar({
  filter,
  search,
  sort,
  onFilterChange,
  onSearchChange,
  onSortChange,
}) {
  return (
    <div className="filter-bar">
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
    </div>
  );
}
