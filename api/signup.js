const {
  createSession,
  ensureDb,
  getBody,
  getSql,
  hashPassword,
  makeSessionCookie,
  methodNotAllowed,
  sendJson
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

    if (!email.includes("@") || password.length < 8) {
      sendJson(res, 400, { error: "Use a valid email and at least 8 password characters." });
      return;
    }

    const rows = await db`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hashPassword(password)})
      RETURNING id, email
    `;
    const user = rows[0];
    const token = await createSession(user.id);

    sendJson(res, 200, { user }, { "Set-Cookie": makeSessionCookie(token) });
  } catch (error) {
    if (error.code === "23505") {
      sendJson(res, 409, { error: "That email already has an account." });
      return;
    }

    sendJson(res, 500, { error: "Could not create account." });
  }
};
