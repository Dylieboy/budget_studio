const { clearSessionCookie, ensureDb, getSql, methodNotAllowed, sendJson } = require("./_lib");

function getSessionToken(req) {
  const cookie = String(req.headers.cookie || "")
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("budget_session="));
  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  try {
    await ensureDb();
    const token = getSessionToken(req);
    if (token) {
      const db = getSql();
      await db`DELETE FROM sessions WHERE token = ${token}`;
    }
  } catch {
    // Clearing the browser cookie is still the most important logout step.
  }

  sendJson(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
};
