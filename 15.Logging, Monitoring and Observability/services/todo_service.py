# services/todo_service.py
from opentelemetry import trace
import structlog

tracer = trace.get_tracer("todo-service")
log = structlog.get_logger()

async def create_todo(user_id: str, req: CreateTodoRequest) -> Todo:
    # 1. Start child span
    with tracer.start_as_current_span("TodoService.create_todo") as span:
        span.set_attribute("user.id", user_id)
        span.set_attribute("todo.title", req.title)

        # 2. INFO log — business event start
        log.info("creating_todo", user_id=user_id, title=req.title)

        try:
            todo = await repo.create_todo(user_id, req)

            # 3. Business event log — audit trail
            log.info("todo_created",
                todo_id=todo.id,
                user_id=user_id,
                title=todo.title,
                priority=todo.priority,
            )
            return todo

        except Exception as e:
            # 4. ERROR log + span error recording
            log.error("todo_creation_failed", user_id=user_id, error=str(e))
            span.record_exception(e)
            span.set_status(trace.StatusCode.ERROR, str(e))
            raise
