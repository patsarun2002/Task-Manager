import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FilterBar from "@/components/FilterBar";

const defaultProps = {
  filter: "all",
  search: "",
  sort: "",
  priority: "all",
  category: "",
  categories: ["งาน", "เรียน", "ส่วนตัว"],
  onFilterChange: vi.fn(),
  onSearchChange: vi.fn(),
  onSortChange: vi.fn(),
  onPriorityChange: vi.fn(),
  onCategoryChange: vi.fn(),
};

describe("FilterBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("render tab filter ครบ 3 อัน", () => {
    render(<FilterBar {...defaultProps} />);

    expect(screen.getByText("ทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText("ค้างอยู่")).toBeInTheDocument();
    expect(screen.getByText("เสร็จแล้ว")).toBeInTheDocument();
  });

  it("เรียก onFilterChange เมื่อกด tab", () => {
    render(<FilterBar {...defaultProps} />);

    fireEvent.click(screen.getByText("ค้างอยู่"));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("pending");

    fireEvent.click(screen.getByText("เสร็จแล้ว"));
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith("done");
  });

  it("เรียก onSearchChange เมื่อพิมพ์ใน search input", () => {
    render(<FilterBar {...defaultProps} />);

    const input = screen.getByPlaceholderText("ค้นหา task...");
    fireEvent.change(input, { target: { value: "ทดสอบ" } });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("ทดสอบ");
  });

  it("แสดง search value ที่ส่งมาใน prop", () => {
    render(<FilterBar {...defaultProps} search="hello" />);

    const input = screen.getByPlaceholderText("ค้นหา task...");
    expect(input.value).toBe("hello");
  });

  it("tab ที่ active มี class ที่แตกต่าง", () => {
    render(<FilterBar {...defaultProps} filter="pending" />);

    const pendingBtn = screen.getByText("ค้างอยู่");
    const allBtn = screen.getByText("ทั้งหมด");

    // active tab มี bg-white / text-zinc-900
    expect(pendingBtn.className).toMatch(/bg-white|dark:bg-zinc-700/);
    // inactive tab ไม่มี bg-white
    expect(allBtn.className).not.toMatch(/bg-white/);
  });
});
