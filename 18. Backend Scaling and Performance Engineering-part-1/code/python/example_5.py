from sqlalchemy import create_engine

engine = create_engine(
    "postgresql://user:pass@host/db",
    pool_size=20,          # number of persistent connections
    max_overflow=10,       # extra connections allowed during spikes
    pool_timeout=30,       # seconds to wait for a free connection
    pool_recycle=1800,     # recycle connections every 30 minutes
    pool_pre_ping=True,    # test connection health before use
)
