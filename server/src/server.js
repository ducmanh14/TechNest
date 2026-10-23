const config = require("./config");
if (Buffer.byteLength(config.jwtSecret, "utf8") < 32)
 throw new Error("JWT_SECRET cần ít nhất 32 byte. Xem hướng dẫn tạo .env.");
const { createApp } = require("./app");
const { pool } = require("./db");
const server = createApp().listen(config.port, "127.0.0.1", () =>
 console.log(`TechNest API: http://localhost:${config.port}`),
);
async function shutdown() {
 server.close(async () => {
 await pool.end();
 process.exit(0);
 });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);