import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../services/api";
import "./AuthPage.css";

export default function AuthPage({ register = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: location.state?.username || "",
    password: "",
    fullname: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const from = location.state?.from;

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (register) {
        await api("/auth/register", { method: "POST", body: form });
        navigate("/login", {
          replace: true,
          state: {
            from,
            username: form.username,
            message: "Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.",
          },
        });
      } else {
        await login({ username: form.username, password: form.password });
        const destination =
          typeof from === "string" &&
          from.startsWith("/") &&
          !from.startsWith("//")
            ? from
            : "/";
        navigate(destination, { replace: true });
      }
    } catch (e) {
      setError(e.message || "Chưa thể xử lý. Bạn thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tn-auth-layout" aria-label="Tài khoản TechNest">
      <aside className="tn-auth-visual" aria-labelledby="tn-auth-story-title">
        <Link className="tn-auth-brand" to="/" aria-label="TechNest — Trang chủ">
          technest<span>.</span>
        </Link>
        <div className="tn-auth-story">
          <p className="tn-auth-kicker">CÔNG NGHỆ CHO MỖI NGÀY</p>
          <h2 id="tn-auth-story-title">
            Một tài khoản.<br />Mở nhiều trải nghiệm.
          </h2>
          <p>Khám phá những thiết bị phù hợp với cách bạn học, làm việc và tận hưởng cuộc sống.</p>
        </div>
        <figure className="tn-auth-picture">
          <img
            src="/images/products/01-laptop.png"
            alt="Laptop — ảnh minh họa sản phẩm TechNest"
            width="1254"
            height="1254"
          />
        </figure>
        <p className="tn-auth-visual-note">TECHNEST / KHỞI ĐẦU CHO NHỮNG ĐIỀU BẠN MUỐN LÀM</p>
      </aside>

      <div className="tn-auth-form-side">
        <div className="tn-auth-topbar">
          <Link className="tn-auth-brand tn-auth-mobile-brand" to="/">
            technest<span>.</span>
          </Link>
          <Link className="tn-auth-back" to="/">← Về cửa hàng</Link>
        </div>

        <div className="tn-auth-form-box">
          <p className="tn-auth-kicker">TÀI KHOẢN TECHNEST</p>
          <h1>{register ? "Bắt đầu cùng TechNest" : "Chào mừng trở lại"}</h1>
          <p className="tn-auth-description">
            {register
              ? "Tạo tài khoản để lưu giỏ hàng và theo dõi đơn mua của bạn."
              : "Đăng nhập để tiếp tục khám phá và quản lý đơn hàng của bạn nhé."}
          </p>

          {location.state?.message && !register && (
            <p className="notice tn-auth-message" role="status">{location.state.message}</p>
          )}
          {error && (
            <p className="notice error tn-auth-message" id="tn-auth-error" role="alert">{error}</p>
          )}

          <form className="tn-auth-form" onSubmit={submit} aria-busy={busy}>
            {register && (
              <label htmlFor="tn-auth-fullname">
                Họ và tên
                <input
                  id="tn-auth-fullname" name="fullname" autoComplete="name"
                  placeholder="Nhập họ và tên" required minLength={2} maxLength={150}
                  value={form.fullname} onChange={update} disabled={busy}
                />
              </label>
            )}
            <label htmlFor="tn-auth-username">
              Tên đăng nhập
              <input
                id="tn-auth-username" name="username" autoComplete="username"
                placeholder="Nhập tên đăng nhập" required minLength={3} maxLength={40}
                pattern="[A-Za-z0-9_]+" title="Từ 3 đến 40 ký tự: chữ, số hoặc dấu gạch dưới."
                value={form.username} onChange={update} disabled={busy}
                aria-describedby={error ? "tn-auth-error" : undefined}
              />
            </label>
            <div className="tn-auth-password-field">
              <label htmlFor="tn-auth-password">Mật khẩu</label>
              <span className="tn-auth-password-wrap">
                <input
                  id="tn-auth-password" name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder="Nhập mật khẩu" required minLength={8} maxLength={72}
                  value={form.password} onChange={update} disabled={busy}
                  aria-describedby={error ? "tn-auth-error" : register ? "tn-auth-password-hint" : undefined}
                />
                <button
                  className="tn-auth-password-toggle" type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPassword} disabled={busy}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                    {showPassword && <path d="m3 3 18 18" />}
                  </svg>
                </button>
              </span>
            </div>
            {register && <p className="tn-auth-hint" id="tn-auth-password-hint">Dùng ít nhất 8 ký tự cho mật khẩu.</p>}
            <button className="tn-auth-submit" type="submit" disabled={busy}>
              {busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập"}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="tn-auth-switch">
            {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <Link to={register ? "/login" : "/register"} state={{ from }}>
              {register ? "Đăng nhập" : "Đăng ký ngay"}
            </Link>
          </p>
        </div>

        <p className="tn-auth-copyright">© {new Date().getFullYear()} TechNest. Hãy đến với chúng tôi.</p>
      </div>
    </section>
  );
}
