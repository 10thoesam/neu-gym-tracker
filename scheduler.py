"""
The scheduler runs your scraper automatically every N minutes in the background
"""
from scraper import get_gym_count
from models import db, GymReading
from notifier import send_alert
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone

THRESHOLDS = {
    '3rd Floor Weight Room': 35,
    '1st Floor Weight Room': 15,
}

last_alert = {}
COOLDOWN_MINUTES = 60

def save_reading(app):
    with app.app_context():
        data = get_gym_count()
        if data:
            for reading in data:
                entry = GymReading(
                    count=reading['count'],
                    timestamp=reading['timestamp'],
                    day_of_week=reading['timestamp'].weekday(),
                    hour=reading['timestamp'].hour,
                    location=reading['name'],
                )
                db.session.add(entry)
            db.session.commit()

            for reading in data:
                for keyword, threshold in THRESHOLDS.items():
                    if keyword in reading['name'] and reading['count'] < threshold:
                        now = datetime.now(timezone.utc)
                        last_time = last_alert.get(keyword)
                        if last_time is None or (now - last_time).total_seconds() > COOLDOWN_MINUTES * 60:
                            print(f"Triggering alert: {reading['name']} at {reading['count']}")
                            send_alert(reading['name'], reading['count'])
                            last_alert[keyword] = now

def start_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=lambda: save_reading(app),
        trigger='interval',
        minutes=5,
    )
    scheduler.start()