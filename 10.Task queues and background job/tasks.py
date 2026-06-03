# tasks.py — Define the task (consumer side)
from celery import Celery
import resend

# Connect Celery to Redis broker
app = Celery('tasks', broker='redis://localhost:6379/0')

# Decorate the function as a Celery task
@app.task(bind=True, max_retries=5, default_retry_delay=60)
def send_verification_email(self, user_id: str, email: str, token: str):
    """
    Called by the worker process.
    self.retry() implements exponential backoff automatically.
    """
    try:
        params = {
            "from": "noreply@myapp.com",
            "to": [email],
            "subject": "Verify your email",
            "html": build_email_template(token),
        }
        resend.Emails.send(params)
    except Exception as exc:
        # Exponential backoff: 60s, 120s, 240s, 480s, 960s
        countdown = 60 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)
