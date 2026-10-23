import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../services/api";
export default function AuthPage({ register = false }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullname: "",
  }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { login } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (register) {
        await api("/auth/register", { method: "POST", body: form });
        navigate("/login", {
          state: { message: "Đăng ký thành công. Hãy đăng nhập." },
        });
      } else {
        await login(form);
        const from = location.state?.from;
        navigate(
          typeof from === "string" &&
            from.startsWith("/") &&
            !from.startsWith("//")
            ? from
            : "/",
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (name, label, type = "text") => (
    <label>
      {label}
      <input
        type={type}
        value={form[name]}
        required
        minLength={name === "password" ? 8 : 2}
        maxLength={name === "password" ? 72 : 150}
        autoComplete={
          name === "password"
            ? register
              ? "new-password"
              : "current-password"
            : name === "username"
              ? "username"
              : "name"
        }
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </label>
  );
  return (
    <section className="auth panel">
      <span className="eyebrow">TÀI KHOẢN TECHNEST</span>
      <h1>{register ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {location.state?.message && (
        <p className="notice">{location.state.message}</p>
      )}
      <form onSubmit={submit}>
        {register && field("fullname", "Họ tên")}
        {field("username", "Tên đăng nhập")}
        {field("password", "Mật khẩu", "password")}
        <button disabled={busy}>
          {busy ? "Đang xử lý…" : register ? "Đăng ký" : "Đăng nhập"}
        </button>
      </form>
      <p>
        {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
        <Link to={register ? "/login" : "/register"}>
          {register ? "Đăng nhập" : "Đăng ký ngay"}
        </Link>
      </p>
    </section>
  );
}