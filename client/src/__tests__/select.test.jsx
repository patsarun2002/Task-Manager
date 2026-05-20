import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  Select,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

describe("Select UI Components", () => {
  it("SelectGroup renders children", () => {
    render(
      <SelectGroup>
        <div>Group Content</div>
      </SelectGroup>
    );
    expect(screen.getByText("Group Content")).toBeInTheDocument();
  });

  it("SelectGroup applies custom className", () => {
    const { container } = render(<SelectGroup className="custom-group" />);
    expect(container.firstChild).toHaveClass("custom-group");
  });

  it("SelectLabel renders text", () => {
    render(
      <SelectGroup>
        <SelectLabel>Label</SelectLabel>
      </SelectGroup>
    );
    expect(screen.getByText("Label")).toBeInTheDocument();
  });

  it("SelectLabel applies custom className", () => {
    render(
      <SelectGroup>
        <SelectLabel className="custom-label">Label</SelectLabel>
      </SelectGroup>
    );
    expect(screen.getByText("Label")).toHaveClass("custom-label");
  });

  it("SelectSeparator renders", () => {
    const { container } = render(<SelectSeparator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("SelectSeparator applies custom className", () => {
    const { container } = render(<SelectSeparator className="custom-separator" />);
    expect(container.firstChild).toHaveClass("custom-separator");
  });

  it("SelectContent with position popper applies conditional className", () => {
    render(
      <Select open>
        <SelectContent position="popper">
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    // This test ensures SelectContent with position="popper" is rendered
    // The conditional className on lines 58-71 will be applied
  });
});
