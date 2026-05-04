const { currentUser, ensureDb, getBody, getSql, methodNotAllowed, sendJson } = require("./_lib");

module.exports = async function handler(req, res) {
  if (!["GET", "PUT"].includes(req.method)) {
    methodNotAllowed(res, ["GET", "PUT"]);
    return;
  }

  try {
    await ensureDb();
    const user = await currentUser(req);
    if (!user) {
      sendJson(res, 401, { error: "Login required" });
      return;
    }

    const db = getSql();

    if (req.method === "GET") {
      const rows = await db`SELECT data FROM user_data WHERE user_id = ${user.id}`;
      sendJson(res, 200, { data: rows[0]?.data || null });
      return;
    }

    const payload = getBody(req);
    if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
      sendJson(res, 400, { error: "Data must be an object." });
      return;
    }

    await db`
      INSERT INTO user_data (user_id, data, updated_at)
      VALUES (${user.id}, ${JSON.stringify(payload.data)}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `;
    sendJson(res, 200, { ok: true });
  } catch {
    sendJson(res, 500, { error: "Could not load or save data." });
  }
};
