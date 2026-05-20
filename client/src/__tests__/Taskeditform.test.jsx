// __tests__/TaskEditForm.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskEditForm from "@/features/tasks/components/TaskEditForm";

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
  editTitle: "ชื่อเดิม",
  setEditTitle: vi.fn(),
  editDeadline: "",
  setEditDeadline: vi.fn(),
  editDeadlineTime: "",
  setEditDeadlineTime: vi.fn(),
  editPriority: "medium",
  setEditPriority: vi.fn(),
  editCategory: "",
  setEditCategory: vi.fn(),
  editRecurring: "none",
  setEditRecurring: vi.fn(),
  editRecurringDays: [],
  setEditRecurringDays: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe("TaskEditForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Render ─────────────────────────────────────────
  it("render input title พร้อม value ที่ส่งมา", () => {
    render(<TaskEditForm {...defaultProps} />);
    const input = screen.getByDisplayValue("ชื่อเดิม");
    expect(input).toBeInTheDocument();
  });

  it("render ปุ่ม บันทึก และ ยกเลิก", () => {
    render(<TaskEditForm {...defaultProps} />);
    expect(screen.getByText("บันทึก")).toBeInTheDocument();
    expect(screen.getByText("ยกเลิก")).toBeInTheDocument();
  });

  it("render date input และ time input", () => {
    render(<TaskEditForm {...defaultProps} />);
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const timeInputs = document.querySelectorAll('input[type="time"]');
    expect(dateInputs.length).toBe(1);
    expect(timeInputs.length).toBe(1);
  });

  it("render priority select พร้อม value ปัจจุบัน", () => {
    render(<TaskEditForm {...defaultProps} editPriority="high" />);
    // shadcn Select แสดง label ของ value
    expect(screen.getByText("🔴 High")).toBeInTheDocument();
  });

  it("render category input", () => {
    render(<TaskEditForm {...defaultProps} editCategory="งาน" />);
    expect(screen.getByDisplayValue("งาน")).toBeInTheDocument();
  });

  // ── Callbacks ─────────────────────────────────────
  it("เรียก onSave เมื่อกดปุ่ม บันทึก", async () => {
    const user = userEvent.setup();
    render(<TaskEditForm {...defaultProps} />);
    await user.click(screen.getByText("บันทึก"));
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it("เรียก onCancel เมื่อกดปุ่ม ยกเลิก", async () => {
    const user = userEvent.setup();
    render(<TaskEditForm {...defaultProps} />);
    await user.click(screen.getByText("ยกเลิก"));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("เรียก setEditTitle เมื่อแก้ไข input", async () => {
    const user = userEvent.setup();
    render(<TaskEditForm {...defaultProps} />);
    const input = screen.getByDisplayValue("ชื่อเดิม");
    await user.clear(input);
    await user.type(input, "ชื่อใหม่");
    expect(defaultProps.setEditTitle).toHaveBeenCalled();
  });

  it("เรียก setEditCategory เมื่อแก้ไข category", async () => {
    const user = userEvent.setup();
    render(<TaskEditForm {...defaultProps} />);
    const catInput = screen.getByPlaceholderText("Category...");
    await user.type(catInput, "เรียน");
    expect(defaultProps.setEditCategory).toHaveBeenCalled();
  });

  it("เรียก setEditDeadline เมื่อเปลี่ยน date", () => {
    render(<TaskEditForm {...defaultProps} />);
    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: "2025-12-31" } });
    expect(defaultProps.setEditDeadline).toHaveBeenCalledWith("2025-12-31");
  });

  it("เรียก setEditDeadlineTime เมื่อเปลี่ยน time", () => {
    render(<TaskEditForm {...defaultProps} editDeadline="2025-12-31" />);
    const timeInput = document.querySelector('input[type="time"]');
    fireEvent.change(timeInput, { target: { value: "09:00" } });
    expect(defaultProps.setEditDeadlineTime).toHaveBeenCalledWith("09:00");
  });

  // ── Time input disabled state ──────────────────────
  it("time input disabled เมื่อไม่มี deadline", () => {
    render(<TaskEditForm {...defaultProps} editDeadline="" />);
    const timeInput = document.querySelector('input[type="time"]');
    expect(timeInput).toBeDisabled();
  });

  it("time input ไม่ disabled เมื่อมี deadline", () => {
    render(<TaskEditForm {...defaultProps} editDeadline="2025-12-31" />);
    const timeInput = document.querySelector('input[type="time"]');
    expect(timeInput).not.toBeDisabled();
  });

  // ── Recurring ──────────────────────────────────────
  it("ไม่แสดง day buttons เมื่อ recurring = none", () => {
    render(<TaskEditForm {...defaultProps} editRecurring="none" />);
    const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    DAY_LABELS.forEach((label) => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });
  });

  it("แสดง day buttons 7 วันเมื่อ recurring = weekly", () => {
    render(<TaskEditForm {...defaultProps} editRecurring="weekly" />);
    const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
    DAY_LABELS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("วันที่ถูกเลือกมี style active (bg-blue-600)", () => {
    render(
      <TaskEditForm
        {...defaultProps}
        editRecurring="weekly"
        editRecurringDays={[1, 3]} // จ และ พ
      />
    );
    const mondayBtn = screen.getByText("จ");
    expect(mondayBtn.className).toMatch(/bg-blue-600/);
  });

  it("วันที่ไม่ได้เลือกไม่มี bg-blue-600", () => {
    render(<TaskEditForm {...defaultProps} editRecurring="weekly" editRecurringDays={[1]} />);
    const sundayBtn = screen.getByText("อา");
    expect(sundayBtn.className).not.toMatch(/bg-blue-600/);
  });

  it("เรียก setEditRecurringDays เมื่อกดปุ่มวัน", async () => {
    const user = userEvent.setup();
    render(<TaskEditForm {...defaultProps} editRecurring="weekly" editRecurringDays={[]} />);
    await user.click(screen.getByText("อา")); // วันอาทิตย์ = index 0
    expect(defaultProps.setEditRecurringDays).toHaveBeenCalled();
  });

  it("onValueChange ของ recurring Select เรียก setEditRecurring และ reset days", () => {
    const setEditRecurring = vi.fn();
    const setEditRecurringDays = vi.fn();
    render(
      <TaskEditForm
        {...defaultProps}
        editRecurring="weekly"
        editRecurringDays={[1, 2]}
        setEditRecurring={setEditRecurring}
        setEditRecurringDays={setEditRecurringDays}
      />
    );
    // recurring select is the second select (index 1) - first is priority
    const selects = screen.getAllByTestId("select");
    const recurringSelect = selects[1];
    fireEvent.change(recurringSelect, { target: { value: "daily" } });
    expect(setEditRecurring).toHaveBeenCalledWith("daily");
    expect(setEditRecurringDays).toHaveBeenCalledWith([]);
  });

  it("toggleDay เพิ่มวันเมื่อยังไม่มีใน list", () => {
    const setEditRecurringDays = vi.fn();
    render(
      <TaskEditForm
        {...defaultProps}
        editRecurring="weekly"
        editRecurringDays={[]}
        setEditRecurringDays={setEditRecurringDays}
      />
    );
    const dayBtn = screen.getAllByRole("button").find((b) => b.textContent === "จ");
    fireEvent.click(dayBtn);
    expect(setEditRecurringDays).toHaveBeenCalled();
    const updater = setEditRecurringDays.mock.calls[0][0];
    expect(updater([])).toEqual([1]); // add day 1
  });

  it("toggleDay ลบวันเมื่อมีอยู่ใน list", () => {
    const setEditRecurringDays = vi.fn();
    render(
      <TaskEditForm
        {...defaultProps}
        editRecurring="weekly"
        editRecurringDays={[1, 2]}
        setEditRecurringDays={setEditRecurringDays}
      />
    );
    const dayBtn = screen.getAllByRole("button").find((b) => b.textContent === "จ");
    fireEvent.click(dayBtn);
    expect(setEditRecurringDays).toHaveBeenCalled();
    const updater = setEditRecurringDays.mock.calls[0][0];
    expect(updater([1, 2])).toEqual([2]); // remove day 1
  });
});
