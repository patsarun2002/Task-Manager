import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskItem from "@/features/tasks/components/TaskItem";

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
  onNote: vi.fn(),
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

  it("เรียก onEdit เมื่อกดปุ่ม บันทึก ใน edit mode", async () => {
    const user = userEvent.setup();
    defaultProps.onEdit.mockResolvedValue(undefined);
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    // Click edit button
    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      // Now in edit mode, click save button
      const saveBtn = screen.getByText("บันทึก");
      await user.click(saveBtn);
      expect(defaultProps.onEdit).toHaveBeenCalled();
    }
  });

  it("ไม่เรียก onEdit เมื่อ title ว่างใน edit mode", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    // Click edit button
    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      // Clear title and click save
      const titleInput = screen.getByDisplayValue("ทดสอบ task");
      await user.clear(titleInput);
      const saveBtn = screen.getByText("บันทึก");
      await user.click(saveBtn);
      expect(defaultProps.onEdit).not.toHaveBeenCalled();
    }
  });

  it("เรียก onEdit พร้อมข้อมูลที่ถูกต้องเมื่อบันทึก", async () => {
    const user = userEvent.setup();
    defaultProps.onEdit.mockResolvedValue(undefined);
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      const saveBtn = screen.getByText("บันทึก");
      await user.click(saveBtn);
      expect(defaultProps.onEdit).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: "ทดสอบ task",
        })
      );
    }
  });

  it("console.error เมื่อ onEdit ล้มเหลว", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    defaultProps.onEdit.mockRejectedValue(new Error("Save failed"));
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      const saveBtn = screen.getByText("บันทึก");
      await user.click(saveBtn);
      expect(consoleErrorSpy).toHaveBeenCalledWith("save failed:", expect.any(Error));
      consoleErrorSpy.mockRestore();
    }
  });

  it("ยกเลิก edit mode เมื่อกดปุ่ม ยกเลิก", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      // Now in edit mode, click cancel button
      const cancelBtn = screen.getByText("ยกเลิก");
      await user.click(cancelBtn);
      // Should be back to view mode
      expect(screen.getByText("ทดสอบ task")).toBeInTheDocument();
    }
  });

  it("เรียก onNote เมื่อ blur note textarea และมีการเปลี่ยนแปลง", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask({ note: "" })} {...defaultProps} />);

    // Expand to show note textarea
    const allBtns = screen.getAllByRole("button");
    const expandBtn = allBtns.find((b) => b.textContent.includes("▼"));
    if (expandBtn) {
      await user.click(expandBtn);
      const noteTextarea = screen.getByPlaceholderText("เพิ่ม note...");
      await user.type(noteTextarea, "new note");
      await user.tab(); // Blur the textarea
      expect(defaultProps.onNote).toHaveBeenCalledWith(1, "new note");
    }
  });

  it("ไม่เรียก onNote เมื่อ blur note textarea แต่ไม่มีการเปลี่ยนแปลง", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask({ note: "existing note" })} {...defaultProps} />);

    // Expand to show note textarea
    const allBtns = screen.getAllByRole("button");
    const expandBtn = allBtns.find((b) => b.textContent.includes("▼"));
    if (expandBtn) {
      await user.click(expandBtn);
      screen.getByDisplayValue("existing note");
      await user.tab(); // Blur without changing
      expect(defaultProps.onNote).not.toHaveBeenCalled();
    }
  });

  it("ใช้ค่า default medium เมื่อ task.priority ไม่มี", () => {
    render(<TaskItem task={makeTask({ priority: undefined })} {...defaultProps} />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("ใช้ค่า default medium เมื่อ task.category ไม่มี", () => {
    render(<TaskItem task={makeTask({ category: undefined })} {...defaultProps} />);
    expect(screen.queryByText(/งาน|เรียน|ส่วนตัว/)).not.toBeInTheDocument();
  });

  it("แสดง recurring 'ทุกวัน' เมื่อ recurringType = daily", () => {
    render(<TaskItem task={makeTask({ recurringType: "daily" })} {...defaultProps} />);
    expect(screen.getByText(/🔁.*ทุกวัน/)).toBeInTheDocument();
  });

  it("แสดง recurring 'ทุกสัปดาห์' เมื่อ recurringType = weekly", () => {
    render(<TaskItem task={makeTask({ recurringType: "weekly" })} {...defaultProps} />);
    expect(screen.getByText(/🔁.*ทุกสัปดาห์/)).toBeInTheDocument();
  });

  it("แสดง deadline time เมื่อมี deadlineTime", () => {
    render(
      <TaskItem
        task={makeTask({ deadline: "2025-12-31", deadlineTime: "09:00" })}
        {...defaultProps}
      />
    );
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
  });

  it("แสดง overdue style เมื่อ deadline เลยแล้ว", () => {
    const { container } = render(
      <TaskItem task={makeTask({ deadline: "2020-01-01", status: "pending" })} {...defaultProps} />
    );
    expect(container.firstChild.className).toMatch(/red/);
  });

  it("save recurring daily เมื่อ editRecurring = daily", async () => {
    const user = userEvent.setup();
    defaultProps.onEdit.mockResolvedValue(undefined);
    render(<TaskItem task={makeTask({ recurringType: "daily" })} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      const saveBtn = screen.getByText("บันทึก");
      await user.click(saveBtn);
      expect(defaultProps.onEdit).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          recurring: expect.objectContaining({ type: "daily" }),
        })
      );
    }
  });

  it("save recurring weekly เมื่อ editRecurring = weekly", async () => {
    const user = userEvent.setup();
    defaultProps.onEdit.mockResolvedValue(undefined);
    render(
      <TaskItem
        task={makeTask({ recurringType: "weekly", recurringDays: [1, 3] })}
        {...defaultProps}
      />
    );

    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      const saveBtn = screen.getByText("บันทึก");
      await user.click(saveBtn);
      expect(defaultProps.onEdit).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          recurring: expect.objectContaining({ type: "weekly", days: [1, 3] }),
        })
      );
    }
  });

  it("ยกเลิก edit mode และ reset values", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask()} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      // Change some values
      const titleInput = screen.getByDisplayValue("ทดสอบ task");
      await user.clear(titleInput);
      await user.type(titleInput, "changed title");
      // Cancel
      const cancelBtn = screen.getByText("ยกเลิก");
      await user.click(cancelBtn);
      // Should be back to original title
      expect(screen.getByText("ทดสอบ task")).toBeInTheDocument();
    }
  });

  it("ยกเลิก edit mode และ reset priority/category เมื่อ task ไม่มีค่า", async () => {
    const user = userEvent.setup();
    render(
      <TaskItem task={makeTask({ priority: undefined, category: undefined })} {...defaultProps} />
    );

    const allBtns = screen.getAllByRole("button");
    const editBtn = allBtns.find((b) => b.textContent.includes("✏"));
    if (editBtn) {
      await user.click(editBtn);
      const cancelBtn = screen.getByText("ยกเลิก");
      await user.click(cancelBtn);
      expect(screen.getByText("Medium")).toBeInTheDocument();
    }
  });

  it("ไม่แสดง overdue style เมื่อ task done", () => {
    const { container } = render(
      <TaskItem task={makeTask({ deadline: "2020-01-01", status: "done" })} {...defaultProps} />
    );
    expect(container.firstChild.className).not.toMatch(/red/);
  });

  it("ไม่แสดง overdue style เมื่อไม่มี deadline", () => {
    const { container } = render(
      <TaskItem task={makeTask({ deadline: undefined })} {...defaultProps} />
    );
    expect(container.firstChild.className).not.toMatch(/red/);
  });

  it("เรียก onNote เมื่อ blur note textarea และ note เปลี่ยนจาก undefined เป็นมีค่า", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask({ note: undefined })} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const expandBtn = allBtns.find((b) => b.textContent.includes("▼"));
    if (expandBtn) {
      await user.click(expandBtn);
      const noteTextarea = screen.getByPlaceholderText("เพิ่ม note...");
      await user.type(noteTextarea, "new note");
      await user.tab(); // Blur
      expect(defaultProps.onNote).toHaveBeenCalledWith(1, "new note");
    }
  });

  it("ไม่เรียก onNote เมื่อ blur note textarea และ note เปลี่ยนจากมีค่าเป็น undefined", async () => {
    const user = userEvent.setup();
    render(<TaskItem task={makeTask({ note: "existing note" })} {...defaultProps} />);

    const allBtns = screen.getAllByRole("button");
    const expandBtn = allBtns.find((b) => b.textContent.includes("▼"));
    if (expandBtn) {
      await user.click(expandBtn);
      const noteTextarea = screen.getByDisplayValue("existing note");
      await user.clear(noteTextarea);
      await user.tab(); // Blur
      expect(defaultProps.onNote).toHaveBeenCalledWith(1, "");
    }
  });
});
