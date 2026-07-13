import { json, presign, requireAdmin } from "../_lib/r2.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  try {
    await requireAdmin(req);
    const { key, contentType, size } = req.body || {};
    if (!/^(website|gallery|website-videos|rooms)\/[a-zA-Z0-9._\/-]+$/.test(key || "") || key.includes("..")) throw new Error("Invalid media key");
    const url = await presign(req, key, contentType, Number(size));
    return res.status(200).json({ success: true, url });
  } catch (error) {
    return res.status(error.message === "Unauthorised" ? 401 : error.message === "Forbidden" ? 403 : 400).json({ success: false, message: error.message });
  }
}
