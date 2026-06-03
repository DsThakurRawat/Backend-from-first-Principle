import pytest

# pytest FIXTURES: setup before `yield`, teardown after. Injected by parameter name.
@pytest.fixture
def temp_store(tmp_path):           # tmp_path is a built-in fixture (auto-cleaned dir)
    store = Store(tmp_path)
    yield store                     # the test runs here
    store.close()                   # teardown — runs even if the test fails

# A FACTORY: defaults + overrides, so tests state only what they care about.
def make_user(**overrides):
    return User(**{"id": "u1", "email": "default@x.com", "active": True, **overrides})

def test_signup(temp_store):
    user = make_user(email="ada@x.com")   # only the relevant field is stated
    temp_store.save(user)
    # ...assert...

# Libraries like factory_boy / model_bakery scale this up for complex object graphs.
