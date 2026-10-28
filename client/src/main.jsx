import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthProvider, Guard } from "./auth";
import { Catalog, Detail } from "./pages/Catalog";
import AuthPage from "./pages/AuthPage";
import AdminCatalog from "./pages/AdminCatalog";
import Header from "./components/Header";
import "./styles.css";
const installed = Object.values(
  import.meta.glob("./features/*/index.jsx", { eager: true }),
);
const commerce = installed.some((x) => x.featureName === "commerce");
function App() {
  const [error, setError] = React.useState("");
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(
    location.pathname.replace(/\/+$/, "").toLowerCase(),
  );
  const pageRef = React.useRef(null);
const previousLayout = React.useRef(isAuthPage);

React.useLayoutEffect(() => {
  // Chỉ chạy khi chuyển giữa cửa hàng và trang tài khoản.
  if (previousLayout.current === isAuthPage) return;

  previousLayout.current = isAuthPage;

  const page = pageRef.current;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!page?.animate || reduceMotion) return;

  const animation = page.animate(
    [
      {
        opacity: 0,
        transform: `translateX(${isAuthPage ? 80 : -80}px)`,
      },
      {
        opacity: 1,
        transform: "none",
      },
    ],
    {
      duration: 380,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  );

  return () => animation.cancel();
}, [isAuthPage]);
  return (
  <div ref={pageRef} className="tn-page-slide">
      {!isAuthPage && <Header commerce={commerce} onError={setError} />}
      <main className={isAuthPage ? "tn-auth-main" : undefined}>
        {!isAuthPage && error && <p className="notice error">{error}</p>}
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route
            path="/products/:id"
            element={<Detail commerce={commerce} />}
          />
          <Route path="/login" element={<AuthPage key="login" />} />
          <Route path="/register" element={<AuthPage key="register" register />} />
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
      {!isAuthPage && (
      <footer>
        <div>
          <strong>TechNest</strong>
          <p>Công nghệ vừa vặn với cuộc sống của bạn.</p>
        </div>
        <p className="footer-copyright">
          © {new Date().getFullYear()} TechNest. Hãy đến với chúng tôi.
        </p>
        <p>
          Đồ án học tập • Node.js / Express / MySQL
        </p>
        
      </footer>
      )}
    </div>
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