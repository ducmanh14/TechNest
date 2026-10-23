import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, Guard, useAuth } from "./auth";
import { Catalog, Detail } from "./pages/Catalog";
import AuthPage from "./pages/AuthPage";
import AdminCatalog from "./pages/AdminCatalog";
import "./styles.css";
const installed = Object.values(
  import.meta.glob("./features/*/index.jsx", { eager: true }),
);
const commerce = installed.some((x) => x.featureName === "commerce");
function App() {
  const { user, logout } = useAuth();
  const [error, setError] = React.useState("");
  return (
    <>
      <header>
        <div className="header-inner">
          <Link className="logo" to="/">
            tech<span>nest</span>
            <i>●</i>
          </Link>
          <nav aria-label="Điều hướng chính">
            <Link to="/">Sản phẩm</Link>
            {commerce && (
              <>
                <Link to="/cart">Giỏ hàng</Link>
                <Link to="/orders">Đơn của tôi</Link>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <Link to="/admin/catalog">Catalog admin</Link>
                {commerce && <Link to="/admin/orders">Đơn admin</Link>}
              </>
            )}
            {user ? (
              <>
                <span className="user">{user.fullname}</span>
                <button
                  className="secondary"
                  onClick={() => logout().catch((e) => setError(e.message))}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link className="button small" to="/login">
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>
        {error && <p className="notice error">{error}</p>}
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route
            path="/products/:id"
            element={<Detail commerce={commerce} />}
          />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage register />} />
          <Route
            path="/admin/catalog"
            element={
              <Guard admin>
                <AdminCatalog />
              </Guard>
            }
          />
          {installed
            .flatMap((m) => m.routes || [])
            .map((r) => (
              <Route
                key={r.path}
                path={r.path}
                element={<Guard admin={r.admin}>{r.element}</Guard>}
              />
            ))}
          <Route
            path="*"
            element={
              <div className="panel">
                <h1>Không tìm thấy trang</h1>
                <Link to="/">Về trang chủ</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer>
        <div>
          <strong>TechNest</strong>
          <p>Công nghệ vừa vặn với cuộc sống của bạn.</p>
        </div>
        <p>
          Đồ án học tập • Node.js / Express / MySQL
          <br />
          Dữ liệu và hình ảnh minh họa.
        </p>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);