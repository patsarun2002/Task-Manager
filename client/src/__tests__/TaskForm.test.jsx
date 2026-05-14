import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskForm from "@/components/TaskForm";

const defaultProps = {
  onSubmit: vi.fn(),
  isLoggedIn: true,
  onLoginRequired: vi.fn(),
};

describe("TaskForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("render input fields ครบ", () => {
    render(<TaskForm {...defaultProps} />);

    expect(screen.getByPlaceholderText("ชื่อ task...")).toBeInTheDocument();
    expect(screen.getByText("+ เพิ่ม")).toBeInTheDocument();
  });

  it("แสดง error เมื่อ submit โดยไม่กรอก title", async () => {
    render(<TaskForm {...defaultProps} />);

    fireEvent.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(screen.getByText("กรุณากรอกชื่อ task")).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("เรียก onSubmit พร้อม data ที่ถูกต้องเมื่อกรอก title", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);

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

    const input = screen.getByPlaceholderText("ชื่อ task...");
    await user.type(input, "task ที่จะถูกล้าง");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("เรียก onLoginRequired เมื่อไม่ได้ login แล้วกด submit", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} isLoggedIn={false} />);

    await user.type(screen.getByPlaceholderText("ชื่อ task..."), "test");
    await user.click(screen.getByText("+ เพิ่ม"));

    expect(defaultProps.onLoginRequired).toHaveBeenCalled();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("แสดง error เมื่อเลือก weekly recurring แต่ไม่ได้เลือกวัน", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);

    // เลือก recurring weekly ผ่าน select
    const recurringSelect = screen.getByDisplayValue("🔁 ไม่ซ้ำ");
    await user.selectOptions(recurringSelect, "weekly");

    await user.type(screen.getByPlaceholderText("ชื่อ task..."), "recurring task");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(screen.getByText("กรุณาเลือกอย่างน้อย 1 วัน")).toBeInTheDocument();
    });
  });

  it("ส่ง recurring daily ได้ถูกต้อง", async () => {
    const user = userEvent.setup();
    render(<TaskForm {...defaultProps} />);

    const recurringSelect = screen.getByDisplayValue("🔁 ไม่ซ้ำ");
    await user.selectOptions(recurringSelect, "daily");

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
});
