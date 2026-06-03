# Accept the collaborator as a constructor argument — that parameter is the seam.
class OrderService:
    def __init__(self, repo):        # injected, not created inside
        self.repo = repo

    def place(self, order):
        if order.total <= 0:
            raise ValueError("invalid total")   # pure logic, easily tested
        self.repo.save(order)

# In tests: a FAKE in-memory repo (no real DB needed)
class FakeRepo:
    def __init__(self): self.saved = []
    def save(self, order): self.saved.append(order)

def test_place_rejects_invalid_total():
    svc = OrderService(FakeRepo())
    with pytest.raises(ValueError):
        svc.place(Order(total=0))

# In production:  OrderService(postgres_repo)  — same code, real dependency.
