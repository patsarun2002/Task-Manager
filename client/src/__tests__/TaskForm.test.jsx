import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskForm from "@/features/tasks/components/TaskForm";

// Mock Shadcn Select ด้วย native <select> เพราะ Radix UI ใช้ Pointer Events
// ซึ่ง jsdom ไม่รองรับ ทำให้ userEvent.click พัง
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
  onSubmit: vi.fn(),
  isLoggedIn: true,
  onLoginRequired: vi.fn(),
};

const openForm = () => fireEvent.click(screen.getByText("+ เพิ่ม task ใหม่..."));

// recurring select คือ <select> ตัวที่ 2 (index 1) — ตัวแรกคือ priority
const getRecurringSelect = () => screen.getAllByTestId("select")[1];

describe("TaskForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("render input fields ครบ", () => {
    render(<TaskForm {...defaultProps} />);
    openForm();

    expect(screen.getByPlaceholderText("ชื่อ task...")).toBeInTheDocument();
    expect(screen.getByText("+ เพิ่ม")).toBeInTheDocument();
  });

  it("แสดง error เมื่อ submit โดยไม่กรอก title", async () => {
    render(<TaskForm {...defaultProps} />);
    openForm();

    fireEvent.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(screen.getByText("กรุณากรอกชื่อ task")).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("เรียก onSubmit พร้อม data ที่ถูกต้องเมื่อกรอก title", async () => {
    const user = userEvent.setup();
    defaultProps.onSubmit.mockResolvedValue(undefined);
    render(<TaskForm {...defaultProps} />);
    openForm();

    await user.type(screen.getByPlaceholderText("ชื่อ task..."), "ทดสอบ task");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "ทดสอบ task",
          priority: "medium",
          recurring: null,
        })
      );
    });
  });

  it("ล้าง form หลัง submit สำเร็จ", async () => {
    const user = userEvent.setup();
    defaultProps.onSubmit.mockResolvedValue(undefined);
    render(<TaskForm {...defaultProps} />);
    openForm();

    await user.type(screen.getByPlaceholderText("ชื่อ task..."), "task ที่จะถูกล้าง");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(screen.getByText("+ เพิ่ม task ใหม่...")).toBeInTheDocument();
    });
  });

  it("เรียก onLoginRequired เมื่อไม่ได้ login แล้วกด submit", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} isLoggedIn={false} />);

    await user.click(screen.getByText("+ เพิ่ม task ใหม่..."));

    expect(defaultProps.onLoginRequired).toHaveBeenCalled();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("แสดง error เมื่อเลือก weekly recurring แต่ไม่ได้เลือกวัน", async () => {
    const user = userEvent.setup();
    defaultProps.onSubmit.mockResolvedValue(undefined);
    render(<TaskForm {...defaultProps} />);
    openForm();

    fireEvent.change(getRecurringSelect(), { target: { value: "weekly" } });

    await user.type(screen.getByPlaceholderText("ชื่อ task..."), "recurring task");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(screen.getByText("กรุณาเลือกอย่างน้อย 1 วัน")).toBeInTheDocument();
    });
  });

  it("ส่ง recurring daily ได้ถูกต้อง", async () => {
    const user = userEvent.setup();
    defaultProps.onSubmit.mockResolvedValue(undefined);
    render(<TaskForm {...defaultProps} />);
    openForm();

    fireEvent.change(getRecurringSelect(), { target: { value: "daily" } });

    await user.type(screen.getByPlaceholderText("ชื่อ task..."), "ทำทุกวัน");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          recurring: expect.objectContaining({ type: "daily" }),
        })
      );
    });
  });

  it("เรียก handleCancel เมื่อกดปุ่ม ยกเลิก", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    openForm();

    await user.click(screen.getByText("ยกเลิก"));

    // Form should close and show the "Add task" button again
    await waitFor(() => {
      expect(screen.getByText("+ เพิ่ม task ใหม่...")).toBeInTheDocument();
    });
  });

  it("เรียก setDeadline เมื่อเปลี่ยน date", () => {
    render(<TaskForm {...defaultProps} />);
    openForm();

    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: "2025-12-31" } });
    expect(dateInput.value).toBe("2025-12-31");
  });

  it("เรียก setDeadlineTime เมื่อเปลี่ยน time", () => {
    render(<TaskForm {...defaultProps} />);
    openForm();

    // First set a date so time is enabled
    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: "2025-12-31" } });

    const timeInput = document.querySelector('input[type="time"]');
    fireEvent.change(timeInput, { target: { value: "09:00" } });
    expect(timeInput.value).toBe("09:00");
  });

  it("เรียก setPriority เมื่อเปลี่ยน priority select", () => {
    render(<TaskForm {...defaultProps} />);
    openForm();

    const selects = screen.getAllByTestId("select");
    const prioritySelect = selects[0]; // First select is priority
    fireEvent.change(prioritySelect, { target: { value: "high" } });
    expect(prioritySelect.value).toBe("high");
  });

  it("เรียก setCategory เมื่อพิมพ์ category", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    openForm();

    const catInput = screen.getByPlaceholderText(/Category เช่น/);
    await user.type(catInput, "งาน");
    expect(catInput.value).toBe("งาน");
  });

  it("toggleDay เพิ่มวันเมื่อยังไม่มีใน list", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    openForm();

    fireEvent.change(getRecurringSelect(), { target: { value: "weekly" } });

    await user.click(screen.getByText("อา")); // Sunday = index 0
    // The day button should now have active class
    const sundayBtn = screen.getByText("อา");
    expect(sundayBtn.className).toMatch(/bg-blue-600/);
  });

  it("toggleDay ลบวันเมื่อมีอยู่ใน list", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);
    openForm();

    fireEvent.change(getRecurringSelect(), { target: { value: "weekly" } });

    // Click to add
    await user.click(screen.getByText("อา"));
    let sundayBtn = screen.getByText("อา");
    expect(sundayBtn.className).toMatch(/bg-blue-600/);

    // Click to remove
    await user.click(screen.getByText("อา"));
    sundayBtn = screen.getByText("อา");
    expect(sundayBtn.className).not.toMatch(/bg-blue-600/);
  });

  it("ส่ง recurring weekly พร้อม days ได้ถูกต้อง", async () => {
    const user = userEvent.setup();
    defaultProps.onSubmit.mockResolvedValue(undefined);
    render(<TaskForm {...defaultProps} />);
    openForm();

    fireEvent.change(getRecurringSelect(), { target: { value: "weekly" } });

    // Select Monday and Wednesday
    await user.click(screen.getByText("จ")); // Monday = index 1
    await user.click(screen.getByText("พ")); // Wednesday = index 3

    await user.type(screen.getByPlaceholderText("ชื่อ task..."), "ทำทุกสัปดาห์");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          recurring: expect.objectContaining({
            type: "weekly",
            days: [1, 3],
          }),
        })
      );
    });
  });

  it("แสดง 'กำลังเพิ่ม...' เมื่อ isSubmitting = true", () => {
    render(<TaskForm {...defaultProps} isSubmitting={true} />);
    openForm();

    expect(screen.getByText("กำลังเพิ่ม...")).toBeInTheDocument();
  });
});
