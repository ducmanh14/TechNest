const model = require("../models/catalog");
const productImagePaths = new Set(
  require("../../../shared/product-images.json").products.map((image) => image.path),
);
const { HttpError, int, str, ok } = require("../utils");
const { randomUUID } = require("node:crypto");
function values(body) {
 let specs = {};
 if (body.specs_json) {
 try {
 specs =
 typeof body.specs_json === "string"
 ? JSON.parse(body.specs_json)
 : body.specs_json;
 } catch {
 throw new HttpError(400, "Thông số phải là JSON hợp lệ.");
 }
 }
 if (
 !specs ||
 typeof specs !== "object" ||
 Array.isArray(specs) ||
 JSON.stringify(specs).length > 5000
 )
 throw new HttpError(
 400,
 "Thông số phải là object JSON, tối đa 5.000 ký tự.",
 );
 const image = String(body.image_path || "/images/laptop.svg");
 if (!/^\/images\/[a-zA-Z0-9_-]+\.svg$/.test(image) && !productImagePaths.has(image))
 throw new HttpError(400, "Chọn ảnh trong danh sách sản phẩm hoặc ảnh SVG hợp lệ.");
 return [
 int(body.category_id),
 int(body.brand_id),
 str(body.sku, 2, 64, "SKU"),
 str(body.name, 2, 255, "Tên"),
 str(body.description || "Sản phẩm công nghệ", 0, 5000, "Mô tả"),
 JSON.stringify(specs),
 int(body.price, 0, 100000000, "Giá"),
 int(body.stock, 0, 100000, "Tồn"),
 int(body.is_active ?? 1, 0, 1, "Trạng thái"),
 image,
 ];
}
exports.list = (admin) => async (req, res) => {
 const r = await model.list(req.query, admin);
 ok(res, r.data, r.meta);
};
exports.product = async (req, res) => {
 const p = await model.product(int(req.params.id));
 if (!p) throw new HttpError(404, "Không tìm thấy sản phẩm.");
 ok(res, p);
 };
exports.lookups = (type, admin) => async (req, res) =>
 ok(res, await model.lookups(type, admin));
exports.createLookup = (type) => async (req, res) => {
 const id = await model.createLookup(
 type,
 str(req.body.name, 2, 150, "Tên"),
 "item-" + randomUUID(),
 );
 res.status(201);
 ok(res, { id });
};
exports.updateLookup = (type) => async (req, res) => {
 await model.updateLookup(
 type,
 int(req.params.id),
 str(req.body.name, 2, 150, "Tên"),
 int(req.body.is_active, 0, 1, "Trạng thái"),
 );
 ok(res, { message: "Đã lưu." });
};
exports.create = async (req, res) => {
 const id = await model.createProduct(values(req.body));
 res.status(201);
 ok(res, { id });
};
exports.update = async (req, res) => {
 const id = int(req.params.id);
 await model.updateProduct(
 id,
 values(req.body),
 int(req.body.expected_stock, 0, 100000, "Tồn trước khi sửa"),
 );
 ok(res, { id });
};
exports.status = async (req, res) => {
 await model.status(
 int(req.params.id),
 int(req.body.is_active, 0, 1, "Trạng thái"),
 );
 ok(res, { message: "Đã đổi trạng thái." });
};
