// ❌ NEVER — string concatenation
query := "SELECT * FROM users WHERE email = '" + userInput + "'"

// ✅ ALWAYS — parameterised ($1 is the slot)
row := db.QueryRow(ctx,
    "SELECT id, name FROM users WHERE email = $1",
    userInput,  // passed separately — treated purely as data
)

// With an ORM (GORM) — parameterised automatically
db.Where("email = ?", userInput).First(&user)
