const { pool, transaction } = require("../db");
const { HttpError, int, str } = require("../utils");
async function list(query, admin = false) {
 const page = int(query.page ?? 1, 1, 100000, "Trang"),
 limit = int(query.limit ?? 12, 1, 50, "Số dòng");
 const terms = admin
 ? []
 : ["p.is_active=1", "c.is_active=1", "b.is_active=1"];
 const args = [];
 if (query.q) {
 terms.push("p.name LIKE ?");
 args.push("%" + str(query.q, 1, 100, "Từ khóa") + "%");
 }
 for (const key of ["category", "brand"])
 if (query[key]) {
 terms.push(`p.${key}_id=?`);
 args.push(int(query[key]));
 }
 for (const [key, op] of [
 ["minPrice", ">="],
 ["maxPrice", "<="],
 ])
 if (query[key] !== undefined && query[key] !== "") {
 terms.push(`p.price${op}?`);
 args.push(int(query[key], 0, 100000000, "Giá"));
 }
 const where = terms.length ? " WHERE " + terms.join(" AND ") : "";
 const join =
 " FROM products p JOIN categories c ON c.id=p.category_id JOIN brands b ON b.id=p.brand_id";
 const [[count]] = await pool.execute(
 "SELECT COUNT(*) AS total" + join + where,
 args,
 );
 const sorts = {
 newest: "p.id DESC",
 price_asc: "p.price ASC,p.id ASC",
 price_desc: "p.price DESC,p.id ASC",
 };
 const sort = sorts[query.sort || "newest"];
 if (!sort) throw new HttpError(400, "Cách sắp xếp không hợp lệ.");
 const [rows] = await pool.query(
 "SELECT p.*,c.name AS category_name,b.name AS brand_name" +
 join +
 where +
 " ORDER BY " +
 sort +
 " LIMIT ? OFFSET ?",
 [...args, limit, (page - 1) * limit],
 );
 return {
  data: rows,
 meta: {
 page,
 limit,
 total: Number(count.total),
 totalPages: Math.ceil(count.total / limit),
 },
 };
}
async function product(id) {
 const [rows] = await pool.execute(
 `SELECT p.*,c.name category_name,b.name brand_name FROM products p
 JOIN categories c ON c.id=p.category_id JOIN brands b ON b.id=p.brand_id
 WHERE p.id=? AND p.is_active=1 AND c.is_active=1 AND b.is_active=1`,
 [id],
 );
 return rows[0];
}
function lookupType(type) {
 if (!["categories", "brands"].includes(type))
 throw new Error("Invalid internal lookup type");
 return type;
}
async function lookups(type, admin = false) {
 const [rows] = await pool.query(
 `SELECT * FROM ${lookupType(type)}${admin ? "" : " WHERE is_active=1"} ORDER BY name`,
 );
 return rows;
}
async function createLookup(type, name, slug) {
 const [r] = await pool.execute(
 `INSERT INTO ${lookupType(type)}(name,slug) VALUES(?,?)`,
 [name, slug],
 );
 return r.insertId;
}
async function updateLookup(type, id, name, active) {
 const [r] = await pool.execute(
 `UPDATE ${lookupType(type)} SET name=?,is_active=? WHERE id=?`,
 [name, active, id],
 );
 if (!r.affectedRows) throw new HttpError(404, "Không tìm thấy bản ghi.");
}
async function createProduct(v) {
 const [r] = await pool.execute(
 `INSERT INTO products
 (category_id,brand_id,sku,name,description,specs_json,price,stock,is_active,image_path)
 VALUES(?,?,?,?,?,?,?,?,?,?)`,
 v,
 );
 return r.insertId;
}
async function updateProduct(id, v, expected) {
 await transaction(async (c) => {
 const [[old]] = await c.execute(
 "SELECT stock FROM products WHERE id=? FOR UPDATE",
 [id],
 );
 if (!old) throw new HttpError(404, "Sản phẩm không tồn tại.");
 if (Number(old.stock) !== expected)
 throw new HttpError(
 409,
 "Tồn kho vừa thay đổi. Tải lại rồi sửa.",
 "STOCK_CHANGED",
 );
 await c.execute(
 `UPDATE products SET category_id=?,brand_id=?,sku=?,name=?,description=?,
 specs_json=?,price=?,stock=?,is_active=?,image_path=? WHERE id=?`,
 [...v, id],
 );
 });
}
async function status(id, active) {
 const [r] = await pool.execute("UPDATE products SET is_active=? WHERE id=?", [
 active,
 id,
 ]);
 if (!r.affectedRows) throw new HttpError(404, "Không tìm thấy sản phẩm.");
}
module.exports = {
 list,
 product,
 lookups,
 createLookup,
 updateLookup,
 createProduct,
 updateProduct,
 status,
};