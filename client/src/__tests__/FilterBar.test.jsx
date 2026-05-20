import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FilterBar from "@/shared/components/FilterBar";

// Mock Shadcn Select for easier testing
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)} data-testid="select">
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }) => <>{children}</>,
  SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
}));

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

  it("เรียก onSortChange เมื่อเปลี่ยน sort select", () => {
    render(<FilterBar {...defaultProps} />);
    const selects = screen.getAllByTestId("select");
    const sortSelect = selects[0]; // First select is sort
    fireEvent.change(sortSelect, { target: { value: "date" } });
    expect(defaultProps.onSortChange).toHaveBeenCalledWith("date");
  });

  it("เรียก onSortChange ด้วยค่าว่างเมื่อเลือก default", () => {
    render(<FilterBar {...defaultProps} sort="date" />);
    const selects = screen.getAllByTestId("select");
    const sortSelect = selects[0];
    fireEvent.change(sortSelect, { target: { value: "__default" } });
    expect(defaultProps.onSortChange).toHaveBeenCalledWith("");
  });

  it("เรียก onPriorityChange เมื่อเปลี่ยน priority select", () => {
    render(<FilterBar {...defaultProps} />);
    const selects = screen.getAllByTestId("select");
    const prioritySelect = selects[1]; // Second select is priority
    fireEvent.change(prioritySelect, { target: { value: "high" } });
    expect(defaultProps.onPriorityChange).toHaveBeenCalledWith("high");
  });

  it("เรียก onCategoryChange เมื่อเปลี่ยน category select", () => {
    render(<FilterBar {...defaultProps} />);
    const selects = screen.getAllByTestId("select");
    const categorySelect = selects[2]; // Third select is category
    fireEvent.change(categorySelect, { target: { value: "งาน" } });
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith("งาน");
  });

  it("เรียก onCategoryChange ด้วยค่าว่างเมื่อเลือก all", () => {
    render(<FilterBar {...defaultProps} category="งาน" />);
    const selects = screen.getAllByTestId("select");
    const categorySelect = selects[2];
    fireEvent.change(categorySelect, { target: { value: "__all" } });
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith("");
  });
});
