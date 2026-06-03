from celery import Celery

app = Celery("tasks", broker="redis://localhost:6379/0")

@app.task(bind=True, max_retries=3)
def send_invitation_email(self, email: str, invite_url: str):
    try:
        email_provider.send(
            to=email,
            subject="You've been invited!",
            template="invite",
            context={"url": invite_url},
        )
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)

# In your API handler — returns instantly to the user
send_invitation_email.delay("user@example.com", "https://app.co/invite/abc")
