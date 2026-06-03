import responses
from datetime import datetime, timezone

# 1) Injected clock — deterministic time (freezegun is a popular alternative).
def test_token_expiry():
    frozen = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
    tok = make_token(now=lambda: frozen, ttl=3600)  # clock injected as a callable
    assert tok.expires_at == frozen.timestamp() + 3600

# 2) Stub external HTTP with `responses` — patches the HTTP layer, no real network.
@responses.activate
def test_fetch_rate():
    responses.add(
        responses.GET, "https://api.rates.com/usd-inr",
        json={"usd_inr": 83.2}, status=200,           # canned response
    )
    client = RatesClient("https://api.rates.com")
    assert client.usd_inr() == 83.2
