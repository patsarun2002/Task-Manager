// __tests__/Pagination.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Pagination from "@/components/Pagination";

const defaultProps = {
  page: 1,
  totalPages: 5,
  onPageChange: vi.fn(),
};

describe("Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Render conditions ──────────────────────────────
  it("ไม่ render อะไรเลยเมื่อ totalPages <= 1", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("ไม่ render เมื่อ totalPages = 0", () => {
    const { container } = render(<Pagination page={1} totalPages={0} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("render ปุ่ม prev และ next", () => {
    render(<Pagination {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    // prev และ next เป็น icon buttons
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("แสดงเลขหน้าทั้งหมดเมื่อหน้าน้อย", () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  // ── Disabled state ─────────────────────────────────
  it("ปุ่ม prev disabled เมื่ออยู่หน้า 1", () => {
    render(<Pagination {...defaultProps} page={1} />);
    const buttons = screen.getAllByRole("button");
    const prevBtn = buttons[0]; // ปุ่มแรกคือ prev
    expect(prevBtn).toBeDisabled();
  });

  it("ปุ่ม next disabled เมื่ออยู่หน้าสุดท้าย", () => {
    render(<Pagination {...defaultProps} page={5} totalPages={5} />);
    const buttons = screen.getAllByRole("button");
    const nextBtn = buttons[buttons.length - 1]; // ปุ่มสุดท้ายคือ next
    expect(nextBtn).toBeDisabled();
  });

  it("ปุ่ม prev ไม่ disabled เมื่ออยู่หน้า 2+", () => {
    render(<Pagination {...defaultProps} page={2} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).not.toBeDisabled();
  });

  it("ปุ่ม next ไม่ disabled เมื่อยังไม่ถึงหน้าสุดท้าย", () => {
    render(<Pagination {...defaultProps} page={3} totalPages={5} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[buttons.length - 1]).not.toBeDisabled();
  });

  // ── onPageChange callbacks ─────────────────────────
  it("เรียก onPageChange(page + 1) เมื่อกด next", async () => {
    const user = userEvent.setup();
    render(<Pagination {...defaultProps} page={2} />);
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);
  });

  it("เรียก onPageChange(page - 1) เมื่อกด prev", async () => {
    const user = userEvent.setup();
    render(<Pagination {...defaultProps} page={3} />);
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it("เรียก onPageChange ด้วยหน้าที่ถูกต้องเมื่อกดเลขหน้า", async () => {
    const user = userEvent.setup();
    render(<Pagination page={1} totalPages={3} onPageChange={defaultProps.onPageChange} />);
    await user.click(screen.getByText("3"));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);
  });

  // ── Dots (ellipsis) ────────────────────────────────
  it("แสดง ... เมื่อหน้ามีมากและอยู่ตรงกลาง", () => {
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);
    const dots = screen.getAllByText("…");
    expect(dots.length).toBeGreaterThanOrEqual(1);
  });

  it("ไม่แสดง ... เมื่อหน้าน้อย (3 หน้า)", () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.queryByText("…")).not.toBeInTheDocument();
  });

  // ── Active page highlight ──────────────────────────
  it("หน้าปัจจุบัน render ด้วย variant default (ต่างจากหน้าอื่น)", () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);
    // หน้า 2 จะมี variant="default" ซึ่งมี bg-primary / bg-zinc-900 class
    const btn2 = screen.getByText("2").closest("button");
    const btn1 = screen.getByText("1").closest("button");
    expect(btn2.className).not.toBe(btn1.className);
  });
});
