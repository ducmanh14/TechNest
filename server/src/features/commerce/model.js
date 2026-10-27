const { createHash } = require("node:crypto");
function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
async function lockUser(c, id) {
  await c.execute("SELECT id FROM users WHERE id=? FOR UPDATE", [id]);
}
async function getCart(c, userId, lock = false) {
  const [items] = await c.execute(
    `SELECT ci.id,ci.product_id,ci.quantity,p.name,p.sku,p.price,p.stock,p.image_path,
 (p.is_active AND cat.is_active AND b.is_active) AS sellable
 FROM cart_items ci JOIN products p ON p.id=ci.product_id JOIN categories cat ON cat.id=p.category_id
 JOIN brands b ON b.id=p.brand_id WHERE ci.user_id=? ORDER BY p.id${lock ? " FOR UPDATE" : ""}`,
    [userId],
  );
  const subtotal = items.reduce((n, i) => n + Number(i.price) * i.quantity, 0);
  return {
    items,
    subtotal: String(subtotal),
    shipping_fee: items.length ? "30000" : "0",
    total_amount: String(subtotal + (items.length ? 30000 : 0)),
    cart_signature: digest(
      items.map((i) => [
        i.id,
        i.product_id,
        i.quantity,
        String(i.price),
        Number(i.sellable),
      ]),
    ),
  };
}
async function detail(c, id, userId, admin = false) {
  const [rows] = await c.execute(
    "SELECT * FROM orders WHERE id=?" + (admin ? "" : " AND user_id=?"),
    admin ? [id] : [id, userId],
  );
  if (!rows[0]) return null;
  const [items] = await c.execute(
    "SELECT * FROM order_items WHERE order_id=? ORDER BY id",
    [id],
  );
  return { ...rows[0], items };
}
module.exports = { digest, lockUser, getCart, detail };