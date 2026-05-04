const { sendJson } = require("./_lib");

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" }, { Allow: "GET" });
    return;
  }

  sendJson(res, 200, { ok: true });
};
