class HttpError extends Error {
 constructor(status, message, code = "REQUEST_ERROR") {
 super(message);
 this.status = status;
 this.code = code;
 }
}
function int(value, min = 1, max = 2147483647, label = "ID") {
 const raw = String(value ?? "");
 if (!/^\d+$/.test(raw))
 throw new HttpError(400, `${label} phải là số nguyên hợp lệ.`);
 const n = Number(raw);
 if (!Number.isSafeInteger(n) || n < min || n > max)
 throw new HttpError(400, `${label} phải từ ${min} đến ${max}.`);
 return n;
}
function str(value, min, max, label) {
 if (typeof value !== "string")
 throw new HttpError(400, `${label} không hợp lệ.`);
 const text = value.trim();
 if (text.length < min || text.length > max)
 throw new HttpError(400, `${label} cần ${min} đến ${max} ký tự.`);
 return text;
}
function ok(res, data, meta) {
 return res.json({ success: true, data, ...(meta ? { meta } : {}) });
}
module.exports = { HttpError, int, str, ok };