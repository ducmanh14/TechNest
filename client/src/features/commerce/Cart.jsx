import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../../services/api";
export default function Cart() {
  const [cart, setCart] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
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
  }, []);
  async function update(id, quantity) {
    setBusy(true);
    setError("");
    try {
      const r = await api("/cart/items/" + id, {
        method: quantity === 0 ? "DELETE" : "PUT",
        body: quantity === 0 ? {} : { quantity },
      });
      setCart(r.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <span className="eyebrow">CHUẨN BỊ CHO TRẢI NGHIỆM MỚI</span>
      <h1>Giỏ hàng của bạn</h1>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {!cart ? (
        !error && <p>Đang tải giỏ…</p>
      ) : !cart.items.length ? (
        <div className="panel">
          <p>Giỏ đang trống.</p>
          <Link className="button" to="/">
           Chọn sản phẩm
          </Link>
        </div>
      ) : (
        <div className="split">
          <div className="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Link to={"/products/" + i.product_id}>{i.name}</Link>
                      {!i.sellable && (
                        <p className="error">Sản phẩm ngừng bán</p>
                      )}
                      <small className="muted"> Còn {i.stock}</small>
                    </td>
                    <td>{money(i.price)}</td>
                    <td>
                      <div className="actions">
                        <button
                          aria-label={"Giảm " + i.name}
                          disabled={busy || i.quantity <= 1}
                          onClick={() => update(i.id, i.quantity - 1)}
                        >
                          −
                        </button>
                        <span>{i.quantity}</span>
                        <button
                          aria-label={"Tăng " + i.name}
                          disabled={busy || i.quantity >= Math.min(i.stock, 99)}
                          onClick={() => update(i.id, i.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => update(i.id, 0)}
                         >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="panel summary">
            <h2>Tóm tắt đơn</h2>
            <p>Tạm tính: {money(cart.subtotal)}</p>
            <p>Giao hàng: {money(cart.shipping_fee)}</p>
            <p className="total">{money(cart.total_amount)}</p>
            <Link className="button" to="/checkout">
              Tiến hành đặt hàng
            </Link>
            <p className="muted">Thanh toán khi nhận hàng • COD</p>
          </aside>
        </div>
      )}
    </>
  );
}
