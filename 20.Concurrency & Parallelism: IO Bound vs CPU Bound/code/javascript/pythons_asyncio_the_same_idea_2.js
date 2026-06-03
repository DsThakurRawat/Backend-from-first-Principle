// Stage 2: async/await (modern — syntactic sugar over callbacks)
async function handleRequest(req, res) {
  const user  = await db.query("SELECT * FROM users WHERE id = ?", [req.userId]);
  const orders = await db.query("SELECT * FROM orders WHERE user_id = ?", [req.userId]);
  sendResponse(res, { user, orders });
}
