import { json, removeObject, requireAdmin } from "../_lib/r2.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  try {
    await requireAdmin(req);
    const { key } = req.body || {};
    if (!key || key.includes("..") || key.startsWith("/")) throw new Error("Invalid media key");
    await removeObject(key);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(error.message === "Unauthorised" ? 401 : error.message === "Forbidden" ? 403 : 400).json({ success: false, message: error.message });
  }
}
