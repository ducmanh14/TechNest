const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const fs = require("node:fs");
const path = require("node:path");
const { pool } = require("./db");
const { writeGuard } = require("./middlewares/security");
function createApp() {
 const app = express();
 app.disable("x-powered-by");
 app.use(helmet());
 app.use(express.json({ limit: "100kb" }));
 app.use(cookieParser());
 app.use("/api", writeGuard);
 app.get("/api/health", async (req, res) => {
 await pool.query("SELECT 1");
 res.json({
 success: true,
 data: {
 database: "connected",
 commerce: fs.existsSync(
 path.join(__dirname, "features/commerce/index.js"),
 ),
 },
 });
 });
 app.use("/api/auth", require("./routes/auth"));
 app.use("/api", require("./routes/catalog"));
 const feature = path.join(__dirname, "features/commerce/index.js");
 if (fs.existsSync(feature)) app.use("/api", require(feature));
 app.use("/api", (req, res) =>
 res
 .status(404)
 .json({
 success: false,
 message: "API không tồn tại hoặc module Người 2 chưa được thêm.",
 }),
 );
 const dist = path.resolve(__dirname, "../../client/dist");
 if (fs.existsSync(dist)) {
 app.use(express.static(dist));
 app.get("/{*path}", (req, res) =>
 res.sendFile(path.join(dist, "index.html")),
 );
 }
 app.use((err, req, res, next) => {
 let status = err.status || 500,
 message = err.message,
 code = err.code || "INTERNAL_ERROR";
 if (err.code === "ER_DUP_ENTRY") {
  status = 409;
 message = "Tên đăng nhập hoặc SKU đã tồn tại.";
 }
 if (["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(err.code)) {
 status = 409;
 message = "Dữ liệu đang được cập nhật. Hãy thử lại cùng yêu cầu.";
 }
 if (err.code === "ER_NO_REFERENCED_ROW_2") {
 status = 400;
 message = "Danh mục hoặc thương hiệu không tồn tại.";
 }
 if (status >= 500) {
 message = "Lỗi máy chủ hoặc kết nối MySQL. Kiểm tra terminal backend.";
 console.error("Backend error:", err.code || err.name);
 }
 res.status(status).json({ success: false, message, code });
 });
 return app;
}
module.exports = { createApp };