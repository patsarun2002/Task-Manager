// __tests__/SubtaskList.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SubtaskList from "@/components/SubtaskList";

const makeTask = (subtasks = []) => ({
  id: 1,
  subtasks,
});

const defaultProps = {
  onAdd: vi.fn(),
  onToggle: vi.fn(),
  onDelete: vi.fn(),
};

describe("SubtaskList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Render ─────────────────────────────────────────
  it("render input เพิ่ม subtask และปุ่ม + เพิ่ม", () => {
    render(<SubtaskList task={makeTask()} {...defaultProps} />);

    expect(screen.getByPlaceholderText("เพิ่ม subtask...")).toBeInTheDocument();
    expect(screen.getByText("+ เพิ่ม")).toBeInTheDocument();
  });

  it("render subtask list ที่มีอยู่แล้ว", () => {
    const subtasks = [
      { id: 1, title: "งาน A", done: false },
      { id: 2, title: "งาน B", done: true },
    ];
    render(<SubtaskList task={makeTask(subtasks)} {...defaultProps} />);

    expect(screen.getByText("งาน A")).toBeInTheDocument();
    expect(screen.getByText("งาน B")).toBeInTheDocument();
  });

  it("subtask ที่ done มี line-through", () => {
    const subtasks = [{ id: 1, title: "เสร็จแล้ว", done: true }];
    render(<SubtaskList task={makeTask(subtasks)} {...defaultProps} />);

    const span = screen.getByText("เสร็จแล้ว");
    expect(span.className).toMatch(/line-through/);
  });

  it("subtask ที่ไม่ done ไม่มี line-through", () => {
    const subtasks = [{ id: 1, title: "ยังไม่เสร็จ", done: false }];
    render(<SubtaskList task={makeTask(subtasks)} {...defaultProps} />);

    const span = screen.getByText("ยังไม่เสร็จ");
    expect(span.className).not.toMatch(/line-through/);
  });

  // ── Progress bar ───────────────────────────────────
  it("ไม่แสดง progress bar เมื่อไม่มี subtask", () => {
    const { container } = render(<SubtaskList task={makeTask()} {...defaultProps} />);
    // progress bar อยู่ใน div ที่มี h-1.5
    expect(container.querySelector(".h-1\\.5")).not.toBeInTheDocument();
  });

  it("แสดง progress bar และตัวเลข done/total", () => {
    const subtasks = [
      { id: 1, title: "A", done: true },
      { id: 2, title: "B", done: false },
      { id: 3, title: "C", done: false },
    ];
    render(<SubtaskList task={makeTask(subtasks)} {...defaultProps} />);

    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("progress bar width เป็น 100% เมื่อทำครบทุก subtask", () => {
    const subtasks = [
      { id: 1, title: "A", done: true },
      { id: 2, title: "B", done: true },
    ];
    const { container } = render(<SubtaskList task={makeTask(subtasks)} {...defaultProps} />);

    const bar = container.querySelector(".bg-emerald-400");
    expect(bar.style.width).toBe("100%");
  });

  // ── Add subtask ────────────────────────────────────
  it("เรียก onAdd เมื่อกดปุ่ม + เพิ่ม", async () => {
    const user = userEvent.setup();
    defaultProps.onAdd.mockResolvedValue(undefined);
    render(<SubtaskList task={makeTask()} {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("เพิ่ม subtask..."), "subtask ใหม่");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(defaultProps.onAdd).toHaveBeenCalledWith(1, { title: "subtask ใหม่" });
    });
  });

  it("เรียก onAdd เมื่อกด Enter ใน input", async () => {
    const user = userEvent.setup();
    defaultProps.onAdd.mockResolvedValue(undefined);
    render(<SubtaskList task={makeTask()} {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("เพิ่ม subtask..."), "subtask Enter{Enter}");

    await waitFor(() => {
      expect(defaultProps.onAdd).toHaveBeenCalledWith(1, { title: "subtask Enter" });
    });
  });

  it("ไม่เรียก onAdd เมื่อ input ว่างเปล่า", async () => {
    const user = userEvent.setup();
    render(<SubtaskList task={makeTask()} {...defaultProps} />);

    await user.click(screen.getByText("+ เพิ่ม"));

    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it("ไม่เรียก onAdd เมื่อ input มีแค่ space", async () => {
    const user = userEvent.setup();
    render(<SubtaskList task={makeTask()} {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("เพิ่ม subtask..."), "   ");
    await user.click(screen.getByText("+ เพิ่ม"));

    expect(defaultProps.onAdd).not.toHaveBeenCalled();
  });

  it("ล้าง input หลัง add สำเร็จ", async () => {
    const user = userEvent.setup();
    defaultProps.onAdd.mockResolvedValue(undefined);
    render(<SubtaskList task={makeTask()} {...defaultProps} />);

    const input = screen.getByPlaceholderText("เพิ่ม subtask...");
    await user.type(input, "subtask ที่จะถูกล้าง");
    await user.click(screen.getByText("+ เพิ่ม"));

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("ปุ่ม disabled ระหว่าง saving", async () => {
    let resolveAdd;
    defaultProps.onAdd.mockReturnValue(
      new Promise((res) => {
        resolveAdd = res;
      })
    );
    render(<SubtaskList task={makeTask()} {...defaultProps} />);

    const input = screen.getByPlaceholderText("เพิ่ม subtask...");
    const addBtn = screen.getByText("+ เพิ่ม");

    fireEvent.change(input, { target: { value: "กำลัง save" } });
    fireEvent.click(addBtn);

    // ระหว่าง saving ปุ่มต้อง disabled
    expect(addBtn).toBeDisabled();

    resolveAdd();
    await waitFor(() => {
      expect(addBtn).not.toBeDisabled();
    });
  });

  // ── Toggle / Delete ────────────────────────────────
  it("เรียก onToggle เมื่อคลิก checkbox ของ subtask", async () => {
    const user = userEvent.setup();
    const subtasks = [{ id: 5, title: "toggle me", done: false }];
    render(<SubtaskList task={makeTask(subtasks)} {...defaultProps} />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);

    expect(defaultProps.onToggle).toHaveBeenCalledWith(1, 5);
  });

  it("เรียก onDelete เมื่อกดปุ่ม ✕", async () => {
    const user = userEvent.setup();
    const subtasks = [{ id: 7, title: "ลบฉัน", done: false }];
    render(<SubtaskList task={makeTask(subtasks)} {...defaultProps} />);

    // hover เพื่อให้ opacity-100
    const listItem = screen.getByText("ลบฉัน").closest("li");
    fireEvent.mouseEnter(listItem);

    const deleteBtn = listItem.querySelector("button");
    await user.click(deleteBtn);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(1, 7);
  });
});
