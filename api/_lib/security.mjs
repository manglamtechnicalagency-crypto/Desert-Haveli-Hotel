import crypto from "node:crypto";

const buckets = new Map();

const DEFAULTS = {
  windowSeconds: 60,
  max: 30,
};

function envNumber(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.min(Math.max(Math.floor(value), min), max) : fallback;
}

function configFor(category) {
  const prefix = String(category || "public").toUpperCase();
  return {
    windowSeconds: envNumber(`RATE_LIMIT_${prefix}_WINDOW_SECONDS`, DEFAULTS.windowSeconds, { max: 86_400 }),
    max: envNumber(`RATE_LIMIT_${prefix}_MAX`, DEFAULTS.max, { max: 10_000 }),
  };
}

function clientAddress(req) {
  // Vercel supplies x-real-ip. The first forwarded address is a fallback for
  // compatible proxies; deployments must only trust these headers from their
  // configured edge proxy.
  const real = req.headers["x-real-ip"];
  const forwarded = req.headers["x-forwarded-for"];
  return String(real || forwarded || "unknown").split(",")[0].trim().slice(0, 100) || "unknown";
}

export function requestId(req) {
  const supplied = String(req.headers["x-request-id"] || "");
  return /^[A-Za-z0-9._-]{1,80}$/.test(supplied) ? supplied : crypto.randomUUID();
}

export function rateLimitKey(req, accountKey = "") {
  const account = accountKey ? crypto.createHash("sha256").update(String(accountKey)).digest("hex").slice(0, 24) : "anonymous";
  return `${clientAddress(req)}:${account}`;
}

export function checkRateLimit(req, category, accountKey = "") {
  const { windowSeconds, max } = configFor(category);
  const now = Date.now();
  const key = `${category}:${rateLimitKey(req, accountKey)}`;
  const existing = buckets.get(key);
  const windowMs = windowSeconds * 1000;
  const current = !existing || now - existing.startedAt >= windowMs
    ? { startedAt: now, count: 0 }
    : existing;
  current.count += 1;
  buckets.set(key, current);

  // Bound local memory in development and on long-lived serverless workers.
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (now - bucket.startedAt >= windowMs) buckets.delete(bucketKey);
    }
  }

  const allowed = current.count <= max;
  return {
    allowed,
    retryAfter: Math.max(1, Math.ceil((current.startedAt + windowMs - now) / 1000)),
  };
}

export function rateLimitResponse(res, id, retryAfter) {
  return res
    .setHeader("Retry-After", String(retryAfter))
    .status(429)
    .json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later.", requestId: id } });
}

export function safeErrorResponse(res, error, id) {
  const message = error?.message || "Request could not be completed.";
  const status = message === "Unauthorised" ? 401 : message === "Forbidden" ? 403 : error?.statusCode || 500;
  const code = status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : status >= 500 ? "INTERNAL_ERROR" : "INVALID_REQUEST";
  if (status >= 500) {
    // Log only a request ID and category; provider/configuration details stay server-side.
    console.error("Media request failed", { requestId: id, status, errorType: error?.constructor?.name || "Error" });
  }
  return res.status(status).json({ success: false, error: { code, message: status >= 500 ? "The request could not be completed." : message, requestId: id } });
}

export function assertRequestBody(body, allowedFields) {
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.getPrototypeOf(body) !== Object.prototype) {
    const error = new Error("Invalid request body");
    error.statusCode = 400;
    throw error;
  }
  if (Object.keys(body).some((key) => !allowedFields.includes(key))) {
    const error = new Error("Invalid request body");
    error.statusCode = 422;
    throw error;
  }
  return body;
}

export function assertEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("Invalid request body");
    error.statusCode = 422;
    throw error;
  }
  return email;
}

export function assertMediaRequest({ key, contentType, size }) {
  if (typeof key !== "string" || key.length > 300 || key.startsWith("/") || key.includes("..") || key.includes("\\") || !/^(website|gallery|website-videos|rooms)\/[A-Za-z0-9._/-]+$/.test(key)) {
    const error = new Error("Invalid media key");
    error.statusCode = 422;
    throw error;
  }
  if (typeof contentType !== "string" || !/^(image\/(jpeg|jpg|png|webp)|video\/(mp4|webm|quicktime))$/.test(contentType)) {
    const error = new Error("Unsupported media type");
    error.statusCode = 415;
    throw error;
  }
  const numericSize = Number(size);
  const maxBytes = key.startsWith("website-videos/") ? 200 * 1024 * 1024 : key.startsWith("gallery/") ? 10 * 1024 * 1024 : 8 * 1024 * 1024;
  if (!Number.isSafeInteger(numericSize) || numericSize <= 0 || numericSize > maxBytes) {
    const error = new Error("Media payload is too large or invalid");
    error.statusCode = 413;
    throw error;
  }
  if (key.startsWith("website-videos/") && !contentType.startsWith("video/")) throw new Error("Media type does not match storage path");
  if (!key.startsWith("website-videos/") && !contentType.startsWith("image/")) throw new Error("Media type does not match storage path");
  return numericSize;
}

export function assertStorageKey(key) {
  if (typeof key !== "string" || key.length > 300 || key.startsWith("/") || key.includes("..") || key.includes("\\") || !/^(website|gallery|website-videos|rooms)\/[A-Za-z0-9._/-]+$/.test(key)) {
    const error = new Error("Invalid media key");
    error.statusCode = 422;
    throw error;
  }
}
