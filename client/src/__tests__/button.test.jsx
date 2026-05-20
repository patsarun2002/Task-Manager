import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders as button element by default", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });

  it("renders as Slot.Root when asChild is true", () => {
    render(
      <Button asChild>
        <a href="#">Link Button</a>
      </Button>
    );
    const link = screen.getByRole("link");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "#");
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.firstChild;
    expect(button).toHaveClass("border-border");
  });

  it("applies size classes", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.firstChild;
    expect(button).toHaveClass("h-7");
  });

  it("applies custom className", () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    const button = container.firstChild;
    expect(button).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
