import useCartCount from "../hooks/useCartCount";
import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Header({ commerce, onError = () => { } }) {
  const { user, loading, logout } = useAuth();
  const cartCount = useCartCount(commerce, user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const currentQuery =
    location.pathname === "/"
      ? new URLSearchParams(location.search).get("q") || ""
      : "";

  function search(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = String(data.get("q") || "").trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    navigate(query ? "/?" + params.toString() : "/");
  }

  async function signOut() {
    setBusy(true);
    onError("");
    try {
      await logout();
      navigate("/");
    } catch (error) {
      onError(error.message || "Không đăng xuất được. Anh thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="tn-header">
      <div className="tn-announcement">
        TECHNEST — SHOP KHÁC CÓ GÌ ? CHÚNG TÔI CŨNG CÓ
      </div>
      <div className="tn-header-main">
        <Link className="tn-brand" to="/" aria-label="TechNest — Trang chủ">
          technest<span>.</span>
        </Link>
        <form
          className="tn-header-search"
          role="search"
          aria-label="Tìm kiếm sản phẩm"
          key={location.pathname + location.search}
          onSubmit={search}
        >
          <input
            type="search"
            name="q"
            aria-label="Tên sản phẩm cần tìm"
            placeholder="Bạn đang tìm sản phẩm gì?"
            defaultValue={currentQuery}
            maxLength={100}
          />
          <button type="submit">Tìm</button>
        </form>
        <div className="tn-account">
          {loading ? (
            <span className="tn-account-loading">Đang tải…</span>
          ) : user ? (
            <>
              <span className="tn-user-name" title={user.fullname}>
                {user.fullname}
              </span>
              <button
                className="tn-logout"
                type="button"
                onClick={signOut}
                disabled={busy}
              >
                {busy ? "Đang thoát…" : "Đăng xuất"}
              </button>
            </>
          ) : (
            <Link className="button tn-login" to="/login">Đăng nhập</Link>
          )}
        </div>
      </div>
      <nav className="tn-main-nav" aria-label="Điều hướng chính">
        <NavLink to="/" end>Sản phẩm</NavLink>
        {commerce && (
          <>
            <NavLink
              to="/cart"
              className="tn-cart-link"
              aria-label={
                cartCount === null
                  ? "Giỏ hàng, chưa có số lượng"
                  : `Giỏ hàng, ${cartCount} sản phẩm`
              }
            >
              Giỏ hàng

              <span className="tn-cart-count" aria-hidden="true">
                {cartCount === null ? "…" : cartCount}
              </span>
            </NavLink>
            <NavLink to="/orders">Đơn của tôi</NavLink>
          </>
        )}
        {user?.role === "admin" && (
          <>
            <NavLink to="/admin/catalog">Quản lý sản phẩm</NavLink>
            {commerce && (
              <NavLink to="/admin/orders">Quản lý đơn hàng</NavLink>
            )}
          </>
        )}
      </nav>
    </header>
  );
}

