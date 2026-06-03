// Depend on an INTERFACE, not a concrete type — that interface is the seam.
type OrderRepo interface{ Save(o Order) error }

type OrderService struct{ repo OrderRepo } // injected, not constructed inside

func NewOrderService(r OrderRepo) *OrderService { return &OrderService{repo: r} }

func (s *OrderService) Place(o Order) error {
    if o.Total <= 0 { return errors.New("invalid total") } // pure logic, easily tested
    return s.repo.Save(o)
}

// In tests: a FAKE in-memory repo (no real DB needed)
type fakeRepo struct{ saved []Order }
func (f *fakeRepo) Save(o Order) error { f.saved = append(f.saved, o); return nil }

func TestPlace_RejectsInvalidTotal(t *testing.T) {
    svc := NewOrderService(&fakeRepo{})
    if err := svc.Place(Order{Total: 0}); err == nil {
        t.Error("expected error for non-positive total")
    }
}
// In production:  NewOrderService(postgresRepo)  — same code, real dependency.
