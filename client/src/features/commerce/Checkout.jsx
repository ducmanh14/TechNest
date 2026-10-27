import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, money } from "../../services/api";
import { useAuth } from "../../auth";
export default function Checkout() {
  const { user } = useAuth(),
    navigate = useNavigate(),
    storageKey = "technest-pending-checkout-" + user.id;
  const [pending, setPending] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey) || "null");
    } catch {
      return null;
    }
  });
  const [form, setForm] = useState(
    () =>
      pending?.body || {
        recipient_name: user.fullname,
        phone: "",
        shipping_address: "",
      },
  );
  const [cart, setCart] = useState(pending?.cart || null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (pending) return;
    let live = true;
    api("/cart")
      .then((r) => {
        if (live) setCart(r.data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [pending]);
  async function submit(e) {
    e.preventDefault();
    if (busy || !cart?.items.length) return;
    setBusy(true);
    setError("");
    const request = pending || {
      body: {
        ...form,
        payment_method: "COD",
        checkout_key: crypto.randomUUID(),
         cart_signature: cart.cart_signature,
      },
      cart,
    };
    try {
      // Store the exact request before sending. A retry must keep both key and body.
      sessionStorage.setItem(storageKey, JSON.stringify(request));
      setPending(request);
      const r = await api("/orders", { method: "POST", body: request.body });
      sessionStorage.removeItem(storageKey);
      navigate("/orders/" + r.data.id, { replace: true });
    } catch (e) {
      setError(
        e.message +
          " Nếu chưa rõ kết quả, kiểm tra Đơn của tôi hoặc gửi lại cùng lần đặt bên dưới.",
      );
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    if (
      !window.confirm(
        "Đã kiểm tra Đơn của tôi và chắc chắn muốn bỏ lần gửi này? " +
          "Nếu đơn đã tạo, không đặt lại để tránh trùng.",
      )
    )
      return;
    sessionStorage.removeItem(storageKey);
    setPending(null);
    setCart(null);
    setError("");
  }
  return (
    <>
      <span className="eyebrow">CHỈ CÒN MỘT BƯỚC</span>
      <h1>Thông tin nhận hàng</h1>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <div className="notice">
          Đang giữ nguyên lần đặt {pending.body.checkout_key}.{" "}
          <Link to="/orders">Kiểm tra Đơn của tôi</Link> trước khi tạo lần khác.
        </div>
      )}
      {!cart ? (
        <p>Đang tải…</p>
         ) : !cart.items.length ? (
        <p className="notice">
          Giỏ trống. <Link to="/">Mua sắm tiếp</Link>
        </p>
      ) : (
        <div className="split">
          <form className="panel" onSubmit={submit}>
            <label>
              Họ tên người nhận
              <input
                required
                minLength={2}
                maxLength={150}
                disabled={!!pending}
                value={form.recipient_name}
                onChange={(e) =>
                  setForm({ ...form, recipient_name: e.target.value })
                }
              />
            </label>
            <label>
              Số điện thoại
              <input
                required
                pattern="\+?[0-9]{10,14}"
                maxLength={15}
                disabled={!!pending}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Địa chỉ nhận hàng
              <textarea
                required
                minLength={10}
                maxLength={500}
                disabled={!!pending}
                value={form.shipping_address}
                onChange={(e) =>
                  setForm({ ...form, shipping_address: e.target.value })
                }
              />
            </label>
            <p>
              Phương thức thanh toán: <strong>COD</strong> — trả tiền khi nhận
              hàng.
            </p>
            <button disabled={busy}>
              {busy
               ? "Đang xử lý…"
                : pending
                  ? "Gửi lại cùng lần đặt"
                  : "Xác nhận đặt hàng"}
            </button>
            {pending && (
              <button
                className="secondary"
                type="button"
                disabled={busy}
                onClick={reset}
              >
                Bỏ lần gửi và tải lại giỏ
              </button>
            )}
          </form>
          <aside className="panel summary">
            <h2>Đơn của bạn</h2>
            {cart.items.map((i) => (
              <p key={i.id}>
                {i.name} × {i.quantity}
                <br />
                <strong>{money(Number(i.price) * i.quantity)}</strong>
              </p>
            ))}
            <hr />
            <p>Giao hàng: {money(cart.shipping_fee)}</p>
            <p className="total">Tổng: {money(cart.total_amount)}</p>
            <p className="muted">Giá và tồn sẽ được kiểm tra lại ở máy chủ.</p>
          </aside>
        </div>
      )}
    </>
  );
}