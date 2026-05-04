const { currentUser, ensureDb, methodNotAllowed, sendJson } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res, ["GET"]);
    return;
  }

  try {
    await ensureDb();
    const user = await currentUser(req);
    if (!user) {
      sendJson(res, 401, { user: null });
      return;
    }

    sendJson(res, 200, { user });
  } catch {
    sendJson(res, 500, { error: "Could not check session." });
  }
};
