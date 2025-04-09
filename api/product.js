const jsonServer = require("json-server");
const router = jsonServer.router("db.json");

module.exports = (req, res) => {
  // Handle CORS for development and production
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Pass the request to json-server router
  router.db.setState(require("../db.json")); // Reload db.json on each request
  router(req, res);
};