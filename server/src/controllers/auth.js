const bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken"),
  model = require("../models/user");
const { str, HttpError, ok } = require("../utils");
const { tokenFor, cookieOptions } = require("../middlewares/security");
function safe(u) {
  return { id: u.id, username: u.username, fullname: u.fullname, role: u.role };
}
function credentials(body) {
  const username = str(body.username, 3, 40, "Tên đăng nhập"),
    password = body.password;
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    throw new HttpError(400, "Tên đăng nhập chỉ gồm chữ, số và _.");
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  )
    throw new HttpError(400, "Mật khẩu từ 8 ký tự và tối đa 72 byte UTF-8.");
  return { username, password };
}
exports.register = async (req, res) => {
  const { username, password } = credentials(req.body);
  const fullname = str(req.body.fullname, 2, 150, "Họ tên");
  await model.create(username, fullname, await bcrypt.hash(password, 12));
  res.status(201);
  ok(res, { message: "Đăng ký thành công. Hãy đăng nhập." });
};
exports.login = async (req, res) => {
  const { username, password } = credentials(req.body),
    user = await model.byUsername(username);
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    throw new HttpError(401, "Sai tên đăng nhập hoặc mật khẩu.");
  const token = tokenFor(user),
    exp = jwt.decode(token).exp;
  res.cookie("tn_access", token, {
    ...cookieOptions,
    maxAge: Math.max(0, exp * 1000 - Date.now()),
  });
  res.set("Cache-Control", "no-store");
  ok(res, safe(user));
};
exports.me = (req, res) => {
  res.set("Cache-Control", "no-store");
  ok(res, safe(req.user));
};
exports.logout = async (req, res) => {
  await model.revoke(req.user.id);
  res.clearCookie("tn_access", cookieOptions);
  ok(res, { message: "Đã đăng xuất trên mọi thiết bị." });
};