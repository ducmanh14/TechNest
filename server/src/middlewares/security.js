const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const config = require("../config");
const userModel = require("../models/user");
const { HttpError } = require("../utils");
function writeGuard(req, res, next) {
 if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
 if (
 req.get("Origin") !== config.origin ||
 req.get("X-TechNest-Client") !== "web"
 )
 throw new HttpError(
 403,
 "Origin hoặc header chống CSRF không hợp lệ.",
 "CSRF_REJECTED",
 );
 if (!req.is("application/json"))
 throw new HttpError(415, "API ghi yêu cầu Content-Type application/json.");
 if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
 throw new HttpError(400, "Body phải là một JSON object.");
 next();
}
async function requireAuth(req, res, next) {
 try {
 const token = req.cookies.tn_access;
 if (!token) throw new Error("missing");
 const p = jwt.verify(token, config.jwtSecret, {
 algorithms: ["HS256"],
 issuer: config.issuer,
 audience: config.audience,
 });
 if (
 typeof p.sub !== "string" ||
 !/^\d+$/.test(p.sub) ||
 !Number.isSafeInteger(p.ver) ||
 p.ver < 0 ||
 typeof p.jti !== "string" ||
 p.jti.length < 16 ||
 !Number.isInteger(p.exp) ||
 !Number.isInteger(p.iat)
 )
 throw new Error("claims");
 const user = await userModel.byId(p.sub);
 if (!user || Number(user.auth_version) !== p.ver)
 throw new Error("revoked");
 req.user = user;
 req.auth = p;
 } catch (err) {
 if (err.code && /^ER_|^ECONN/.test(err.code)) return next(err);
 return next(new HttpError(401, "Vui lòng đăng nhập lại.", "AUTH_REQUIRED"));
 }
 next();
}
function requireAdmin(req, res, next) {
 if (req.user.role !== "admin")
 throw new HttpError(403, "Chức năng dành cho admin.", "FORBIDDEN");
 next();
}
function tokenFor(user) {
 return jwt.sign({ ver: Number(user.auth_version) }, config.jwtSecret, {
 algorithm: "HS256",
 subject: String(user.id),
 jwtid: crypto.randomUUID(),
 expiresIn: config.jwtExpires,
 issuer: config.issuer,
 audience: config.audience,
 });
}
const cookieOptions = {
 httpOnly: true,
 sameSite: "lax",
 secure: config.production,
 path: "/",
};
module.exports = {
 writeGuard,
 requireAuth,
 requireAdmin,
 tokenFor,
 cookieOptions,
};