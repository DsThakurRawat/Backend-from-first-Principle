// ❌ VULNERABLE: attacker sends {"$ne": null} as email
db.users.find({ email: req.body.email })
// Becomes: { email: { $ne: null } }  → returns ALL users

// ✅ FIX: validate that email is a plain string, not an object
if (typeof req.body.email !== 'string') {
  return res.status(400).json({ error: 'Invalid email' })
}
db.users.find({ email: req.body.email })
