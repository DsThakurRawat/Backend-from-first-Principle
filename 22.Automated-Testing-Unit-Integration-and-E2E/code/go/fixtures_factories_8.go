// Go favors explicit helpers over magic. t.Helper() keeps failure line numbers useful.
// A "factory" with functional options: specify only the fields that matter to the test.
func newUser(t *testing.T, opts ...func(*User)) User {
    t.Helper()
    u := User{ID: "u1", Email: "default@x.com", Active: true} // sensible defaults
    for _, o := range opts { o(&u) }
    return u
}
func withEmail(e string) func(*User) { return func(u *User) { u.Email = e } }

// A "fixture" via t.Cleanup: setup returns the thing + auto-teardown.
func newTempStore(t *testing.T) *Store {
    t.Helper()
    dir := t.TempDir()                 // auto-removed after the test
    s := OpenStore(dir)
    t.Cleanup(func() { s.Close() })    // teardown runs even if the test fails
    return s
}

func TestSignup(t *testing.T) {
    store := newTempStore(t)
    u := newUser(t, withEmail("ada@x.com")) // only the relevant field is stated
    _ = store.Save(u)
    // ...assert...
}
