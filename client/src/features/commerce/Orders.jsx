import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, money } from "../../services/api";
export const labels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};
export function Orders({ admin = false }) {
  const [result, setResult] = useState(null),
    [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const prefix = admin ? "/admin/orders" : "/orders";
  useEffect(() => {
    let live = true;
    setResult(null);
    setError("");
    api(prefix + "?page=" + page + "&status=" + status)
      .then((r) => {
        if (live) setResult(r);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [prefix, page, status]);
  return (
    <>
      <span className="eyebrow">
        {admin ? "QUẢN TRỊ TECHNEST" : "TÀI KHOẢN CỦA BẠN"}
      </span>
      <h1>{admin ? "Quản lý đơn hàng" : "Đơn hàng của tôi"}</h1>
      <label>
        Lọc theo trạng thái
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tất cả</option>
          {Object.entries(labels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
               </option>
          ))}
        </select>
      </label>
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : !result ? (
        <p>Đang tải…</p>
      ) : !result.data.length ? (
        <p className="notice">Chưa có đơn hàng.</p>
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Người nhận</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_code}</td>
                  <td>{o.recipient_name}</td>
                  <td>{money(o.total_amount)}</td>
                  <td>{labels[o.status]}</td>
                  <td>
                    <Link to={prefix + "/" + o.id}>Xem đơn →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result && (
        <div className="actions">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Trang trước
          </button>
          <span>
            {page}/{Math.max(1, result.meta.totalPages)}
          </span>
          <button
            disabled={page >= result.meta.totalPages}
             onClick={() => setPage(page + 1)}
          >
            Trang sau
          </button>
        </div>
      )}
    </>
  );
}
export function OrderDetail({ admin = false }) {
  const { id } = useParams(),
    [order, setOrder] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const prefix = admin ? "/admin/orders" : "/orders";
  useEffect(() => {
    let live = true;
    setOrder(null);
    setError("");
    api(prefix + "/" + id)
      .then((r) => {
        if (live) setOrder(r.data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [id, prefix]);
  async function change(next) {
    if (
      next === "cancelled" &&
      !window.confirm("Xác nhận hủy đơn và hoàn tồn kho?")
    )
      return;
    setBusy(true);
    setError("");
    try {
      const r = await api(
        admin ? prefix + "/" + id + "/status" : prefix + "/" + id + "/cancel",
        {
          method: admin ? "PATCH" : "POST",
          body: admin ? { status: next } : {},
        },
      );
      setOrder(r.data);
    } catch (e) {
      setError(e.message);
    } finally {
         setBusy(false);
    }
  }
  const nexts = order
    ? {
        pending: ["confirmed", "cancelled"],
        confirmed: ["shipping", "cancelled"],
        shipping: ["delivered"],
      }[order.status] || []
    : [];
  return (
    <>
      <Link to={prefix}>← Danh sách đơn</Link>
      <h1>Chi tiết đơn hàng</h1>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {!order ? (
        !error && <p>Đang tải…</p>
      ) : (
        <>
          <div className="panel">
            <strong>{order.order_code}</strong>
            <p>
              Trạng thái: <strong>{labels[order.status]}</strong> •{" "}
              {order.payment_status === "paid"
                ? "Đã thu tiền"
                : "Chưa thu tiền"}{" "}
              (COD)
            </p>
            <p>
              Người nhận: {order.recipient_name} • {order.phone}
              <br />
              {order.shipping_address}
            </p>
            <p className="muted">
              Tạo lúc {new Date(order.created_at).toLocaleString("vi-VN")}
            </p>
            <div className="actions">
              {admin
                ? nexts.map((s) => (
                    <button key={s} disabled={busy} onClick={() => change(s)}>
                      {s === "delivered"
                        ? "Xác nhận đã giao và thu tiền"
                        : labels[s]}
                    </button>
                  ))
                : order.status === "pending" && (
                     <button
                      disabled={busy}
                      className="secondary"
                      onClick={() => change("cancelled")}
                    >
                      Hủy đơn
                    </button>
                  )}
            </div>
          </div>
          <div className="table-wrap panel">
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm tại thời điểm mua</th>
                  <th>SKU</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.product_name}</td>
                    <td>{i.sku}</td>
                    <td>{money(i.unit_price)}</td>
                    <td>{i.quantity}</td>
                    <td>{money(i.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Giao hàng: {money(order.shipping_fee)}</p>
          <p className="price">Tổng: {money(order.total_amount)}</p>
        </>
      )}
    </>
  );
}