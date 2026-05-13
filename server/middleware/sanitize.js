import xss from "xss";

// sanitize string fields ใน req.body ทั้งหมด
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      result[key] = xss(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map((item) =>
        typeof item === "object"
          ? sanitizeObject(item)
          : typeof item === "string"
            ? xss(item)
            : item,
      );
    } else if (typeof val === "object" && val !== null) {
      result[key] = sanitizeObject(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}
