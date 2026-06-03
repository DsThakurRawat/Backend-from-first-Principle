# celery_config.py — Celery Beat schedule
from celery.schedules import crontab

CELERYBEAT_SCHEDULE = {
    # Send weekly report every Sunday midnight
    'weekly-report': {
        'task': 'tasks.send_weekly_report',
        'schedule': crontab(hour=0, minute=0, day_of_week='sunday'),
    },
    # Cleanup orphan sessions on the 1st of each month
    'session-cleanup': {
        'task': 'tasks.cleanup_orphan_sessions',
        'schedule': crontab(hour=3, minute=0, day_of_month='1'),
    },
}
