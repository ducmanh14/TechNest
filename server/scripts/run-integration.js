const path = require("node:path"),
  fs = require("node:fs"),
  { spawnSync } = require("node:child_process");
const envFile = path.resolve(__dirname, "../.env.test");
if (!fs.existsSync(envFile))
  throw new Error(
    "Tạo server/.env.test từ .env.test.example trước khi chạy test tích hợp.",
  );
require("dotenv").config({ path: envFile, override: true, quiet: true });
if (!/^[a-zA-Z0-9_]+_test$/.test(process.env.DB_NAME || ""))
  throw new Error("Test chỉ chạy với DB_NAME kết thúc _test.");
if (Buffer.byteLength(process.env.JWT_SECRET || "") < 32)
  throw new Error("Tạo JWT_SECRET riêng trong .env.test.");
process.env.TECHNEST_TEST = "1";
for (const args of [
  [path.resolve(__dirname, "setup-db.js")],
  ["--test", path.resolve(__dirname, "../test/integration.test.js")],
]) {
  const r = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}