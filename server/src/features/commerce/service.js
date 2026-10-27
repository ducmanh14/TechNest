const { randomUUID } = require("node:crypto");
const { pool, transaction } = require("../../db");
const { HttpError, int, str } = require("../../utils");
const { digest, lockUser, getCart, detail } = require("./model");
async function changeCart(userId, body, mode, itemId) {
  return transaction(async (c) => {
    await lockUser(c, userId);
    if (mode === "delete") {
      const [r] = await c.execute(
        "DELETE FROM cart_items WHERE id=? AND user_id=?",
        [itemId, userId],
      );
      if (!r.affectedRows) throw new HttpError(404, "Không có dòng giỏ này.");
      return getCart(c, userId);
    }
    const quantity = int(body.quantity, 1, 99, "Số lượng");
    let productId;
    if (mode === "update") {
      const [[item]] = await c.execute(
        "SELECT product_id FROM cart_items WHERE id=? AND user_id=?",
        [itemId, userId],
      );
      if (!item) throw new HttpError(404, "Không có dòng giỏ này.");
      productId = item.product_id;
    } else productId = int(body.product_id);
    const [[p]] = await c.execute(
      `SELECT p.stock,(p.is_active AND cat.is_active AND b.is_active) AS sellable FROM products p
   JOIN categories cat ON cat.id=p.category_id JOIN brands b ON b.id=p.brand_id
   WHERE p.id=? FOR UPDATE`,
      [productId],
    );
    if (!p || !p.sellable)
      throw new HttpError(409, "Sản phẩm hiện không được bán.");
    const [[old]] = await c.execute(
      "SELECT quantity FROM cart_items WHERE user_id=? AND product_id=?",
      [userId, productId],
    );
    const next = mode === "add" ? quantity + (old?.quantity || 0) : quantity;
    if (next > 99 || next > p.stock)
      throw new HttpError(409, "Số lượng vượt tồn kho hoặc giới hạn 99.");
    if (!old) {
      const [[n]] = await c.execute(
        "SELECT COUNT(*) n FROM cart_items WHERE user_id=?",
        [userId],
      );
      if (n.n >= 50) throw new HttpError(400, "Giỏ tối đa 50 sản phẩm.");
    }
    await c.execute(
      `INSERT INTO cart_items(user_id,product_id,quantity) VALUES(?,?,?)
   ON DUPLICATE KEY UPDATE quantity=?`,
     [userId, productId, next, next],
    );
    return getCart(c, userId);
  });
}
function checkoutInput(body) {
  const key = str(body.checkout_key, 36, 36, "checkout_key");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      key,
    )
  )
    throw new HttpError(400, "checkout_key phải là UUID v4.");
  const name = str(body.recipient_name, 2, 150, "Người nhận"),
    phone = str(body.phone, 10, 15, "Số điện thoại"),
    address = str(body.shipping_address, 10, 500, "Địa chỉ");
  if (!/^\+?\d{10,14}$/.test(phone))
    throw new HttpError(400, "Số điện thoại không đúng định dạng.");
  if (body.payment_method !== "COD")
    throw new HttpError(400, "Bản đầu chỉ hỗ trợ COD.");
  const signature = str(body.cart_signature, 64, 64, "cart_signature");
  if (!/^[a-f0-9]{64}$/.test(signature))
    throw new HttpError(400, "Chữ ký giỏ không hợp lệ.");
  return { key, name, phone, address, signature };
}
async function checkout(userId, body) {
  const v = checkoutInput(body),
    hash = digest([v.name, v.phone, v.address, "COD", v.signature]);
  return transaction(async (c) => {
    // Lock the buyer row first. Cart writes and checkout use the same ordering.
    await lockUser(c, userId);
    const [[existing]] = await c.execute(
      "SELECT id,request_hash FROM orders WHERE user_id=? AND checkout_key=?",
      [userId, v.key],
    );
    if (existing) {
      if (existing.request_hash !== hash)
        throw new HttpError(
          409,
          "Khóa đặt hàng đã dùng với nội dung khác.",
          "CHECKOUT_KEY_REUSED",
        );
      return { order: await detail(c, existing.id, userId), replayed: true };
    }
    const cart = await getCart(c, userId, true);
    if (!cart.items.length) throw new HttpError(400, "Giỏ hàng đang trống.");
    if (cart.cart_signature !== v.signature)
      throw new HttpError(
        409,
        "Giỏ hoặc giá vừa thay đổi. Hãy mở lại checkout.",
         "CART_CHANGED",
      );
    if (cart.items.some((i) => !i.sellable || i.quantity > i.stock))
      throw new HttpError(
        409,
        "Sản phẩm hết hàng, bị ẩn hoặc không đủ tồn.",
        "OUT_OF_STOCK",
      );
    const [r] = await c.execute(
      `INSERT INTO orders
      (order_code,user_id,recipient_name,phone,shipping_address,subtotal,
       shipping_fee,total_amount,checkout_key,request_hash)
   VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [
        "TN-" + randomUUID(),
        userId,
        v.name,
        v.phone,
        v.address,
        cart.subtotal,
        cart.shipping_fee,
        cart.total_amount,
        v.key,
        hash,
      ],
    );
    for (const item of cart.items) {
      const [stock] = await c.execute(
        "UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",
        [item.quantity, item.product_id, item.quantity],
      );
      if (stock.affectedRows !== 1)
        throw new HttpError(409, "Không đủ tồn kho.");
      await c.execute(
        `INSERT INTO order_items
        (order_id,product_id,product_name,sku,unit_price,quantity,line_total)
        VALUES(?,?,?,?,?,?,?)`,
        [
          r.insertId,
          item.product_id,
          item.name,
          item.sku,
          item.price,
          item.quantity,
          String(Number(item.price) * item.quantity),
        ],
      );
    }
    await c.execute("DELETE FROM cart_items WHERE user_id=?", [userId]);
    return { order: await detail(c, r.insertId, userId), replayed: false };
     });
}
async function changeStatus(actor, id, next) {
  if (!["confirmed", "shipping", "delivered", "cancelled"].includes(next))
    throw new HttpError(400, "Trạng thái không hợp lệ.");
  const [[owner]] = await pool.execute(
    "SELECT user_id FROM orders WHERE id=?",
    [id],
  );
  if (!owner) throw new HttpError(404, "Không tìm thấy đơn.");
  if (actor.role !== "admin" && owner.user_id !== actor.id)
    throw new HttpError(404, "Không tìm thấy đơn.");
  return transaction(async (c) => {
    await lockUser(c, owner.user_id);
    const [[order]] = await c.execute(
      "SELECT * FROM orders WHERE id=? FOR UPDATE",
      [id],
    );
    if (next === "cancelled" && order.status === "cancelled")
      return detail(c, id, actor.id, actor.role === "admin");
    const transitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipping", "cancelled"],
      shipping: ["delivered"],
    };
    if (
      actor.role !== "admin" &&
      !(next === "cancelled" && order.status === "pending")
    )
      throw new HttpError(403, "Khách chỉ được hủy đơn đang chờ xác nhận.");
    if (!transitions[order.status]?.includes(next))
      throw new HttpError(409, "Không thể chuyển trạng thái theo thứ tự này.");
    if (next === "cancelled") {
      const [items] = await c.execute(
        "SELECT product_id,quantity FROM order_items WHERE order_id=? ORDER BY product_id",
        [id],
      );
      for (const item of items)
        await c.execute("UPDATE products SET stock=stock+? WHERE id=?", [
          item.quantity,
          item.product_id,
        ]);
    }
    await c.execute(
      `UPDATE orders SET status=?,payment_status=?,delivered_at=? WHERE id=?`,
      [
        next,
        next === "delivered" ? "paid" : order.payment_status,
        next === "delivered" ? new Date() : order.delivered_at,
        id,
          ],
    );
    return detail(c, id, actor.id, actor.role === "admin");
  });
}
module.exports = { changeCart, checkout, changeStatus, checkoutInput };