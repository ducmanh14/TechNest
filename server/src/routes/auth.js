const router = require("express").Router(),
 c = require("../controllers/auth");
const { requireAuth } = require("../middlewares/security");
const { rateLimit } = require("express-rate-limit");
const limit = rateLimit({
 windowMs: 10 * 60 * 1000,
 limit: 30,
 standardHeaders: "draft-8",
 legacyHeaders: false,
 message: {
 success: false,
 message: "Thử đăng nhập quá nhiều. Chờ 10 phút.",
 code: "RATE_LIMIT",
 },
});
router.post("/register", limit, c.register);
router.post("/login", limit, c.login);
router.get("/me", requireAuth, c.me);
router.post("/logout", requireAuth, c.logout);
module.exports = router;