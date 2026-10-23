const router = require("express").Router(),
  c = require("../controllers/catalog");
const { requireAuth, requireAdmin } = require("../middlewares/security");
router.get("/products", c.list(false));
router.get("/products/:id", c.product);
for (const type of ["categories", "brands"]) {
  router.get("/" + type, c.lookups(type, false));
  router.get(
    "/admin/" + type,
    requireAuth,
    requireAdmin,
    c.lookups(type, true),
  );
  router.post(
    "/admin/" + type,
    requireAuth,
    requireAdmin,
    c.createLookup(type),
  );
  router.put(
    "/admin/" + type + "/:id",
    requireAuth,
    requireAdmin,
    c.updateLookup(type),
  );
}
router.get("/admin/products", requireAuth, requireAdmin, c.list(true));
router.post("/admin/products", requireAuth, requireAdmin, c.create);
router.put("/admin/products/:id", requireAuth, requireAdmin, c.update);
router.patch("/admin/products/:id/status", requireAuth, requireAdmin, c.status);
module.exports = router;