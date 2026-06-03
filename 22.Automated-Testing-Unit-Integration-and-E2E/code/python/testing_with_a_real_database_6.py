import pytest
from testcontainers.postgres import PostgresContainer

# A fixture spins up a REAL Postgres once per module, then tears it down.
@pytest.fixture(scope="module")
def db_url():
    with PostgresContainer("postgres:16") as pg:   # throwaway container
        url = pg.get_connection_url()
        run_migrations(url)                         # same schema as production
        yield url
        # container stopped automatically on exit

@pytest.fixture
def repo(db_url):
    # function-scoped: clean state per test (truncate / rollback)
    r = UserRepo(db_url)
    yield r
    r.truncate_all()                                # keep tests independent (§8)

@pytest.mark.integration            # marker: pytest -m integration
def test_save_and_find(repo):
    repo.save(User(id="u1", email="a@x.com"))       # act through REAL SQL
    got = repo.find_by_id("u1")
    assert got.email == "a@x.com"                   # round-trips correctly
