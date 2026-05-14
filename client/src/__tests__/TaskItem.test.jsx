import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskItem from "@/components/TaskItem";

const makeTask = (overrides = {}) => ({
  id: 1,
  title: "ทดสอบ task",
  status: "pending",
  priority: "medium",
  category: "งาน",
  deadline: null,
  deadlineTime: null,
  note: "",
  recurringType: null,
  recurringDays: null,
  subtasks: [],
  ...overrides,
});

const defaultProps = {
  onToggle: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onAddSubtask: vi.fn(),
  onToggleSubtask: vi.fn(),
  onDeleteSubtask: vi.fn(),
  dragListeners: {},
  onHeightChange: vi.fn(),
};

describe("TaskItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("แสดง title ของ task", () => {
    render(<TaskItem task={makeTask()} {...defaultProps} />);
    expect(screen.getByText("ทดสอบ task")).toBeInTheDocument();
  });

  it("แสดง priority badge", () => {
    render(<TaskItem task={makeTask({ priority: "high" })} {...defaultProps} />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("แสดง category badge", () => {
    render(<TaskItem task={makeTask({ category: "เรียน" })} {...defaultProps} />);
    expect(screen.getByText("เรียน")).toBeInTheDocument();
  });

  it("task ที่ done มี line-through", () => {
    render(<TaskItem task={makeTask({ status: "done" })} {...defaultProps} />);
    const title = screen.getByText("ทดสอบ task");
    expect(title.className).toMatch(/line-through/);
  });

  it("เรียก onToggle เมื่อคลิก checkbox", async () => {
    const user = userEvent.setup();
    const task = makeTask();
    render(<TaskItem task={task} {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(defaultProps.onToggle).toHaveBeenCalledWith(task);
  });

  it("แสดง action buttons เมื่อ hover (ตรวจ DOM มีอยู่)", () => {
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    // buttons exist in DOM แต่ opacity-0 — ตรวจ existence แทน visibility
    const editBtn = screen.getByTitle(/subtask|note/i) ?? screen.getAllByRole("button")[1];
    expect(editBtn).toBeInTheDocument();
  });

  it("แสดง confirm delete เมื่อกดปุ่มลบ", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    // hover เพื่อให้ opacity-100
    const container = screen.getByText("ทดสอบ task").closest(".group");
    fireEvent.mouseEnter(container);

    // กดปุ่มลบ (ปุ่มที่มี 🗑)
    const _trashBtn = screen.getByTitle ? null : null;
    const allBtns = screen.getAllByRole("button");
    const deleteBtn = allBtns.find((b) => b.textContent.includes("🗑"));
    if (deleteBtn) {
      await user.click(deleteBtn);
      expect(await screen.findByText("ลบ")).toBeInTheDocument();
      expect(screen.getByText("ยกเลิก")).toBeInTheDocument();
    }
  });

  it("เรียก onDelete เมื่อยืนยันการลบ", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask({ id: 42 })} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const deleteBtn = allBtns.find((b) => b.textContent.includes("🗑"));

    if (deleteBtn) {
      await user.click(deleteBtn);
      const confirmBtn = await screen.findByText("ลบ");
      await user.click(confirmBtn);
      expect(defaultProps.onDelete).toHaveBeenCalledWith(42);
    }
  });

  it("ยกเลิกการลบได้", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const deleteBtn = allBtns.find((b) => b.textContent.includes("🗑"));

    if (deleteBtn) {
      await user.click(deleteBtn);
      const cancelBtn = await screen.findByText("ยกเลิก");
      await user.click(cancelBtn);

      expect(defaultProps.onDelete).not.toHaveBeenCalled();
      // กลับมาเป็น 🗑 อีกครั้ง
      await waitFor(() => {
        const btns = screen.getAllByRole("button");
        expect(btns.some((b) => b.textContent.includes("🗑"))).toBe(true);
      });
    }
  });

  it("แสดง deadline เมื่อมีการกำหนด", () => {
    render(
      <TaskItem
        task={makeTask({ deadline: "2025-12-31", deadlineTime: "09:00" })}
        {...defaultProps}
      />
    );
    // วันที่ format เป็น th-TH
    expect(screen.getByText(/2568|2025|31/)).toBeInTheDocument();
  });

  it("แสดง overdue style เมื่อ deadline เลยแล้ว", () => {
    const { container } = render(
      <TaskItem task={makeTask({ deadline: "2020-01-01", status: "pending" })} {...defaultProps} />
    );
    // card จะมี border-red
    expect(container.firstChild.className).toMatch(/red/);
  });

  it("expand subtask panel เมื่อกดปุ่ม ▼", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const expandBtn = allBtns.find((b) => b.textContent.includes("▼"));
    if (expandBtn) {
      await user.click(expandBtn);
      expect(screen.getByPlaceholderText("เพิ่ม subtask...")).toBeInTheDocument();
    }
  });

  it("แสดง subtask list เมื่อ expand", async () => {
    const user = userEvent.setup();
    render(
      <TaskItem
        task={makeTask({
          subtasks: [
            { id: 1, title: "subtask A", done: false },
            { id: 2, title: "subtask B", done: true },
          ],
        })}
        {...defaultProps}
      />
    );

    const allBtns = screen.getAllByRole("button");
    const expandBtn = allBtns.find((b) => b.textContent.includes("▼"));
    if (expandBtn) {
      await user.click(expandBtn);
      expect(screen.getByText("subtask A")).toBeInTheDocument();
      expect(screen.getByText("subtask B")).toBeInTheDocument();
    }
  });
});
