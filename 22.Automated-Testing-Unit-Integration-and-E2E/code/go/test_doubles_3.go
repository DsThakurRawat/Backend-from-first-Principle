// The unit depends on an interface — the seam that lets us substitute a double (§6).
type UserRepo interface{ FindByID(id string) (*User, error) }

type Notifier interface{ Send(to, msg string) error }

func Greet(repo UserRepo, n Notifier, id string) error {
    u, err := repo.FindByID(id)        // collaborator 1
    if err != nil { return err }
    return n.Send(u.Email, "Hi "+u.Name) // collaborator 2 (interaction we care about)
}

// STUB: returns a canned user. SPY: also records what Send received.
type stubRepo struct{ user *User }
func (s stubRepo) FindByID(string) (*User, error) { return s.user, nil }

type spyNotifier struct{ calls int; lastTo string }
func (s *spyNotifier) Send(to, msg string) error { s.calls++; s.lastTo = to; return nil }

func TestGreet_SendsEmail(t *testing.T) {
    repo := stubRepo{user: &User{Email: "a@x.com", Name: "Ada"}} // arrange (stub)
    spy := &spyNotifier{}

    _ = Greet(repo, spy, "u1")                                   // act

    if spy.calls != 1 || spy.lastTo != "a@x.com" {               // assert the interaction
        t.Errorf("expected one email to a@x.com, got %d to %q", spy.calls, spy.lastTo)
    }
}
