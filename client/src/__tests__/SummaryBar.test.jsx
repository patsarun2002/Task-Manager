import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SummaryBar from "@/components/SummaryBar";

const makeSummary = (overrides = {}) => ({
  total: 10,
  pending: 6,
  done: 4,
  overdue: 2,
  ...overrides,
});

describe("SummaryBar", () => {
  it("แสดงตัวเลขครบทุกช่อง", () => {
    render(<SummaryBar summary={makeSummary()} />);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("แสดง label ครบทุกช่อง", () => {
    render(<SummaryBar summary={makeSummary()} />);

    expect(screen.getByText("ทั้งหมด")).toBeInTheDocument();
    expect(screen.getByText("ค้างอยู่")).toBeInTheDocument();
    expect(screen.getByText("เสร็จแล้ว")).toBeInTheDocument();
    expect(screen.getByText("เลยกำหนด")).toBeInTheDocument();
  });

  it("แสดง 0 ได้ถูกต้องเมื่อไม่มี task", () => {
    render(<SummaryBar summary={makeSummary({ total: 0, pending: 0, done: 0, overdue: 0 })} />);

    const zeros = screen.getAllByText("0");
    expect(zeros).toHaveLength(4);
  });

  it("overdue แสดงค่าที่อัปเดตแล้วเมื่อ re-render", () => {
    const { rerender } = render(<SummaryBar summary={makeSummary({ overdue: 1 })} />);
    expect(screen.getByText("1")).toBeInTheDocument();

    rerender(<SummaryBar summary={makeSummary({ overdue: 5 })} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
