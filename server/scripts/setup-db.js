const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const config = require("../src/config");
async function main() {
  const db = config.db.database;
  if (!/^[a-zA-Z0-9_]+$/.test(db))
    throw new Error("DB_NAME chỉ gồm chữ, số và _.");
  const { database, ...connection } = config.db;
  const conn = await mysql.createConnection({
    ...connection,
    multipleStatements: true,
  });
  try {
    await conn.query("SET time_zone = '+00:00'");
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await conn.changeUser({ database: db });
    await conn.query(
      fs.readFileSync(
        path.resolve(__dirname, "../../database/schema.sql"),
        "utf8",
      ),
    );
    for (const [username, role, fullname] of [
      ["admin", "admin", "Quản trị TechNest"],
      ["khach", "customer", "Khách demo"],
    ]) {
      const [[user]] = await conn.execute(
        "SELECT id FROM users WHERE username=?",
        [username],
      );
      if (!user)
        await conn.execute(
          "INSERT INTO users(username,fullname,password_hash,role) VALUES(?,?,?,?)",
          [username, fullname, await bcrypt.hash("TechNest@123", 12), role],
        );
    }
    const categories = ["Laptop", "Điện thoại", "Phụ kiện"];
    const brands = ["TechNest", "Nova", "Pulse"];
    for (const [i, name] of categories.entries())
      await conn.execute(
        "INSERT IGNORE INTO categories(name,slug) VALUES(?,?)",
        [name, "category-" + i],
      );
    for (const [i, name] of brands.entries())
      await conn.execute("INSERT IGNORE INTO brands(name,slug) VALUES(?,?)", [
        name,
        "brand-" + i,
      ]);
    const [cats] = await conn.query(
      "SELECT id FROM categories ORDER BY id LIMIT 3",
    );
    const [bs] = await conn.query("SELECT id FROM brands ORDER BY id LIMIT 3");
    for (let i = 0; i < 24; i++) {
      const kind = i % 3;
      const name = [
        `Laptop Nova ${14 + (i % 3)} • Core i5`,
        `Điện thoại Pulse ${i + 1} • 128GB`,
        `Tai nghe Air ${i + 1} • Bluetooth`,
      ][kind];
      await conn.execute(
        `INSERT IGNORE INTO products
 (category_id,brand_id,sku,name,description,specs_json,price,stock,image_path)
 VALUES(?,?,?,?,?,?,?,?,?)`,
        [
          cats[kind].id,
          bs[kind].id,
          "TN-" + String(i + 1).padStart(3, "0"),
          name,
          "Sản phẩm minh họa cho đồ án TechNest. Bảo hành 12 tháng.",
          JSON.stringify({
            Bảo_hành: "12 tháng",
            Kết_nối: kind === 2 ? "Bluetooth" : "USB-C",
          }),
          [15990000, 7990000, 590000][kind] + Math.floor(i / 3) * 100000,
          10,
          ["/images/laptop.svg", "/images/phone.svg", "/images/headphones.svg"][
          kind
          ],
        ],
      );
    }
    console.log(
      `Đã tạo schema và seed trong ${db}. ` +
      "Không xóa dữ liệu cũ. Demo: admin / khach; password: TechNest@123",
    );
  } finally {
    await conn.end();
  }
}
main().catch((e) => {
  console.error("Không tạo được DB:", e.code || e.message);
  process.exitCode = 1;
});