const router = require("express").Router();
const { pool } = require("../../db");
const { int, ok, HttpError } = require("../../utils");
const { requireAuth, requireAdmin } = require("../../middlewares/security");
const { getCart, detail } = require("./model");
const service = require("./service");
router.use(["/cart", "/orders", "/admin/orders"], requireAuth);
router.get("/cart", async (req, res) =>
  ok(res, await getCart(pool, req.user.id)),
);
router.post("/cart/items", async (req, res) => {
  res.status(201);
  ok(res, await service.changeCart(req.user.id, req.body, "add"));
});
router.put("/cart/items/:id", async (req, res) =>
  ok(
    res,
    await service.changeCart(
      req.user.id,
      req.body,
      "update",
      int(req.params.id),
    ),
  ),
);
router.delete("/cart/items/:id", async (req, res) =>
  ok(
    res,
    await service.changeCart(
      req.user.id,
      req.body,
      "delete",
      int(req.params.id),
    ),
  ),
);
router.post("/orders", async (req, res) => {
  const r = await service.checkout(req.user.id, req.body);
  res.status(r.replayed ? 200 : 201);
  ok(res, r.order);
});
async function list(req, res, admin = false) {
  const page = int(req.query.page ?? 1, 1, 100000, "Trang"),
    limit = int(req.query.limit ?? 10, 1, 50, "Số dòng");
  const terms = admin ? [] : ["user_id=?"],
    args = admin ? [] : [req.user.id];
  if (req.query.status) {
    if (
      !["pending", "confirmed", "shipping", "delivered", "cancelled"].includes(
        req.query.status,
         )
    )
      throw new HttpError(400, "Bộ lọc trạng thái sai.");
    terms.push("status=?");
    args.push(req.query.status);
  }
  const where = terms.length ? " WHERE " + terms.join(" AND ") : "";
  const [[n]] = await pool.execute(
    "SELECT COUNT(*) n FROM orders" + where,
    args,
  );
  const [rows] = await pool.query(
    "SELECT * FROM orders" + where + " ORDER BY id DESC LIMIT ? OFFSET ?",
    [...args, limit, (page - 1) * limit],
  );
  ok(res, rows, {
    page,
    limit,
    total: Number(n.n),
    totalPages: Math.ceil(n.n / limit),
  });
}
router.get("/orders", (req, res) => list(req, res));
router.get("/orders/:id", async (req, res) => {
  const row = await detail(pool, int(req.params.id), req.user.id);
  if (!row) throw new HttpError(404, "Không tìm thấy đơn.");
  ok(res, row);
});
router.post("/orders/:id/cancel", async (req, res) =>
  ok(
    res,
    await service.changeStatus(req.user, int(req.params.id), "cancelled"),
  ),
);
router.use("/admin/orders", requireAdmin);
router.get("/admin/orders", (req, res) => list(req, res, true));
router.get("/admin/orders/:id", async (req, res) => {
  const row = await detail(pool, int(req.params.id), req.user.id, true);
  if (!row) throw new HttpError(404, "Không tìm thấy đơn.");
  ok(res, row);
});
router.patch("/admin/orders/:id/status", async (req, res) =>
  ok(
    res,
    await service.changeStatus(req.user, int(req.params.id), req.body.status),
  ),
);
module.exports = router;