# logging_config.py — structlog setup for Python
import logging
import os
import structlog

def configure_logging():
    env = os.getenv("APP_ENV", "development")

    if env == "production":
        # JSON renderer for production — parseable by Loki / ELK
        renderer = structlog.processors.JSONRenderer()
        level = logging.INFO
    else:
        # ColourfulConsole for local dev — human-readable
        renderer = structlog.dev.ConsoleRenderer(colors=True)
        level = logging.DEBUG

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,      # merge request-scoped context
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.ExceptionRenderer(),     # auto-renders exceptions
            renderer,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(level=level)

log = structlog.get_logger()
