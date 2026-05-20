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
    const { accessToken, refreshToken } = await authService.login(
      req.body.email,
      req.body.password,
    );
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    console.error("[login]", err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "เกิดข้อผิดพลาดบนเซิร์ฟเวอร์" });
  }
}

export async function refresh(req, res) {
  try {
    const { accessToken, refreshToken } = await authService.refresh(
      req.cookies?.refreshToken,
    );
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
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
