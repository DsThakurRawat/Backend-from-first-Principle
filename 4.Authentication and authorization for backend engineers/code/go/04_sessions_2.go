import (
    "crypto/hmac"
    "crypto/rand"
    "crypto/sha256"
    "crypto/subtle"
    "encoding/base64"
    "fmt"
    "golang.org/x/crypto/argon2"
)

var pepper = []byte(os.Getenv("PASSWORD_PEPPER")) // secret, NOT in DB

// cost parameters — tune so one hash ~250ms
const (
    aTime    = 3         // iterations
    aMemory  = 64 * 1024 // 64 MB, memory-hard
    aThreads = 4
    aKeyLen  = 32
)

func peppered(pw string) []byte {
    m := hmac.New(sha256.New, pepper)
    m.Write([]byte(pw))
    return m.Sum(nil)
}

// returns an encoded string: salt + params + hash
func HashArgon(pw string) string {
    salt := make([]byte, 16)
    rand.Read(salt) // unique per password
    h := argon2.IDKey(peppered(pw), salt, aTime, aMemory, aThreads, aKeyLen)
    return fmt.Sprintf("argon2id$%d$%d$%d$%s$%s", aTime, aMemory, aThreads,
        base64.RawStdEncoding.EncodeToString(salt),
        base64.RawStdEncoding.EncodeToString(h))
}

// re-derive with the SAME salt+params, then constant-time compare
func VerifyArgon(encoded, pw string) bool {
    var t, mem, th uint32
    var b64salt, b64hash string
    fmt.Sscanf(encoded, "argon2id$%d$%d$%d$%s$%s", &t, &mem, &th, &b64salt, &b64hash)
    salt, _ := base64.RawStdEncoding.DecodeString(b64salt)
    want, _ := base64.RawStdEncoding.DecodeString(b64hash)
    got := argon2.IDKey(peppered(pw), salt, t, mem, uint8(th), uint32(len(want)))
    return subtle.ConstantTimeCompare(got, want) == 1
}
