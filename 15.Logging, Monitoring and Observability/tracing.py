# tracing.py — OTel setup for FastAPI
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

def setup_tracing(app):
    # Tracer provider — sends spans to OTel Collector via gRPC
    provider = TracerProvider()
    exporter = OTLPSpanExporter(endpoint="http://otel-collector:4317")
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    # Auto-instrument FastAPI — all routes get spans automatically
    FastAPIInstrumentor.instrument_app(app)

    # Auto-instrument SQLAlchemy — all DB queries get spans automatically
    SQLAlchemyInstrumentor().instrument(engine=engine)

# main.py — wire it all up
from fastapi import FastAPI
from tracing import setup_tracing
from logging_config import configure_logging, log

configure_logging()
app = FastAPI()
setup_tracing(app)
