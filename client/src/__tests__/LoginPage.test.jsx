import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginPage from "@/features/auth/components/LoginPage";

// path ต้องตรงกับที่ LoginPage.jsx import จริง: "../services/api"
vi.mock("@/services/api", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

import { login, register } from "@/services/api";

// helper — หา submit button จาก data-slot="button" (shadcn Button)
// ต่างจาก tab button ที่เป็น plain <button> ไม่มี data-slot
function getSubmitBtn() {
  return document.querySelector('button[data-slot="button"]');
}

// หา tab button (plain button ไม่มี data-slot) ที่ตรงกับ text
function getTabBtn(text) {
  return Array.from(document.querySelectorAll("button:not([data-slot])")).find(
    (b) => b.textContent === text
  );
}

const defaultProps = {
  onLogin: vi.fn(),
  modal: false,
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("render form login ตั้งต้น", () => {
    render(<LoginPage {...defaultProps} />);

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("รหัสผ่าน")).toBeInTheDocument();
    // ใช้ data-slot แทน getByText เพราะ "เข้าสู่ระบบ" มี 2 element (tab + submit)
    expect(getSubmitBtn()).toBeInTheDocument();
  });

  it("แสดง error เมื่อ submit โดยไม่กรอกข้อมูล", async () => {
    const user = userEvent.setup();
    render(<LoginPage {...defaultProps} />);

    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(screen.getByText("กรุณากรอกข้อมูลให้ครบ")).toBeInTheDocument();
    });
  });

  it("เรียก login API และ onLogin เมื่อ submit สำเร็จ", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ data: { accessToken: "token123" } });
    render(<LoginPage {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email"), "test@email.com");
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "password123");
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "test@email.com",
        password: "password123",
      });
      expect(defaultProps.onLogin).toHaveBeenCalled();
    });
  });

  it("แสดง error จาก API เมื่อ login ล้มเหลว", async () => {
    const user = userEvent.setup();
    login.mockRejectedValue({
      response: { data: { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" } },
    });
    render(<LoginPage {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email"), "wrong@email.com");
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "wrongpass");
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(screen.getByText("อีเมลหรือรหัสผ่านไม่ถูกต้อง")).toBeInTheDocument();
    });
  });

  it("แสดง error default เมื่อ API error ไม่มี response.data.error", async () => {
    const user = userEvent.setup();
    login.mockRejectedValue({ response: {} });
    render(<LoginPage {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email"), "test@email.com");
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "password123");
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(screen.getByText("เกิดข้อผิดพลาด")).toBeInTheDocument();
    });
  });

  it("สลับ tab ไป register ได้", async () => {
    const user = userEvent.setup();
    render(<LoginPage {...defaultProps} />);

    await user.click(getTabBtn("สมัครสมาชิก"));

    // submit button เปลี่ยน text เป็น "สมัครสมาชิก"
    expect(getSubmitBtn().textContent).toBe("สมัครสมาชิก");
  });

  it("เรียก register API และแสดง success หลังสมัครสำเร็จ", async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({ data: {} });
    render(<LoginPage {...defaultProps} />);

    await user.click(getTabBtn("สมัครสมาชิก"));
    await user.type(screen.getByPlaceholderText("Email"), "new@email.com");
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "newpassword");
    await user.click(getSubmitBtn());

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: "new@email.com",
        password: "newpassword",
      });
      expect(screen.getByText("สมัครสมาชิกสำเร็จ — กรุณาเข้าสู่ระบบ")).toBeInTheDocument();
    });
  });

  it("render แบบ modal ไม่มี wrapper full-page", () => {
    const { container } = render(<LoginPage {...defaultProps} modal />);
    expect(container.firstChild.className).not.toMatch(/min-h-screen/);
  });

  it("กด Enter ใน password field ส่ง form ได้", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ data: {} });
    render(<LoginPage {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email"), "test@email.com");
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "password123{Enter}");

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
  });

  it("กด Enter ใน email field ส่ง form ได้", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ data: {} });
    render(<LoginPage {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("Email"), "test@email.com");
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "password123");
    await user.type(screen.getByPlaceholderText("Email"), "{Enter}");

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
  });
});
