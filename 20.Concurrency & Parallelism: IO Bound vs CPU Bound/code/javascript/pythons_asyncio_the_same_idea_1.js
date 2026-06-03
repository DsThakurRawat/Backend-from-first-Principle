// Stage 1: Raw callbacks (pre-ES6)
db.query("SELECT * FROM users WHERE id = ?", [userId],
  function(err, result) {
    if (err) return sendError(res, err);
    // Nested callback for second query
    db.query("SELECT * FROM orders WHERE user_id = ?", [userId],
      function(err, orders) {
        if (err) return sendError(res, err);
        // Another level of nesting...
        sendResponse(res, { user: result, orders: orders });
      }
    );
  }
);
