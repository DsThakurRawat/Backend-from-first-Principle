import (
    "crypto/rand"
    "golang.org/x/crypto/argon2"
    "encoding/base64"
)

func HashPassword(password string) (string, error) {
    // Generate cryptographically random 16-byte salt
    salt := make([]byte, 16)
    rand.Read(salt)

    // Argon2id params: time=1, memory=64MB, threads=4, keyLen=32
    hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)

    // Store: $argon2id$salt$hash (both needed to verify)
    encoded := base64.RawStdEncoding.EncodeToString(salt) +
               "$" + base64.RawStdEncoding.EncodeToString(hash)
    return encoded, nil
}

func VerifyPassword(password, stored string) bool {
    // Re-hash with stored salt, compare — never compare raw hashes with ==
    parts := strings.Split(stored, "$")
    salt, _ := base64.RawStdEncoding.DecodeString(parts[0])
    newHash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
    return subtle.ConstantTimeCompare(newHash,
        mustDecode(parts[1])) == 1
}
