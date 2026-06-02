import { authService } from "../services/authService.js";
import { COOKIE_OPTIONS, COOKIE_CLEAR_OPTIONS } from "../utils/cookie.js";

export async function register(req, res) {
  try {
    const user = await authService.register(req.body.email, req.body.password);
    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ", userId: user.id });
  } catch (err) {
    console.error("[register]", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

export async function login(req, res) {
  try {
    const { accessToken, refreshToken, user } = await authService.login(
      req.body.email,
      req.body.password,
    );
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user });
  } catch (err) {
    console.error("[login]", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

export async function refresh(req, res) {
  try {
    const { accessToken, refreshToken, user } = await authService.refresh(
      req.cookies?.refreshToken,
    );
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken, user });
  } catch (err) {
    console.error("[refresh]", err);
    res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

export async function logout(req, res) {
  try {
    await authService.logout(req.cookies?.refreshToken);
    res.clearCookie("refreshToken", COOKIE_CLEAR_OPTIONS);
    res.json({ message: "ออกจากระบบสำเร็จ" });
  } catch (err) {
    console.error("[logout]", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    const user = await authService.updateProfile(req.user.id, name, email);
    res.json({ message: "อัปเดตข้อมูลสำเร็จ", user });
  } catch (err) {
    console.error("[updateProfile]", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { accessToken, refreshToken } = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
    );
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ", accessToken });
  } catch (err) {
    console.error("[changePassword]", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({
      message: "หากอีเมลนี้มีอยู่ในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล",
    });
  } catch (err) {
    console.error("[forgotPassword]", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json({ message: "รีเซ็ตรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("[resetPassword]", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}
