const {
  createSession,
  ensureDb,
  getBody,
  getSql,
  makeSessionCookie,
  methodNotAllowed,
  sendJson,
  verifyPassword
} = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res, ["POST"]);
    return;
  }

  try {
    await ensureDb();
    const db = getSql();
    const payload = getBody(req);
    const email = String(payload.email || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const rows = await db`
      SELECT id, email, password_hash
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;
    const user = rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      sendJson(res, 401, { error: "Email or password is incorrect." });
      return;
    }

    const token = await createSession(user.id);
    sendJson(res, 200, { user: { id: user.id, email: user.email } }, { "Set-Cookie": makeSessionCookie(token) });
  } catch {
    sendJson(res, 500, { error: "Could not log in." });
  }
};
