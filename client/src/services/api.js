export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...options.headers };
  if (!["GET", "HEAD"].includes(method)) {
    headers["Content-Type"] = "application/json";
    headers["X-TechNest-Client"] = "web";
  }
  const response = await fetch("/api" + path, {
    ...options,
    method,
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(
      "Máy chủ không trả JSON. Kiểm tra API và proxy.",
      response.status,
    );
  }
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("auth-expired"));
    throw new ApiError(
      result.message || "Yêu cầu thất bại.",
      response.status,
      result.code,
    );
  }
  return result;
}
export const money = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";