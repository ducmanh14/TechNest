import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "./services/api";
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    api("/auth/me")
      .then((r) => {
        if (live) setUser(r.data);
      })
      .catch(() => { })
      .finally(() => {
        if (live) setLoading(false);
      });
    const expired = () => setUser(null);
    window.addEventListener("auth-expired", expired);
    return () => {
      live = false;
      window.removeEventListener("auth-expired", expired);
    };
  }, []);
  async function login(body) {
    const r = await api("/auth/login", { method: "POST", body });
    setUser(r.data);
    return r.data;
  }
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST", body: {} });
    } catch (e) {
      if (e.status !== 401) throw e;
    }
    setUser(null);
  }
  return (
    <Context.Provider value={{ user, loading, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
export function Guard({ children, admin = false }) {
  const { user, loading } = useAuth(),
    location = useLocation();
  if (loading) return <p>Đang kiểm tra đăng nhập…</p>;
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== "admin")
    return <div className="notice error">Bạn không có quyền quản trị.</div>;
  return children;
}