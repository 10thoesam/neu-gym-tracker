"""
The scheduler runs your scraper automatically every N minutes in the background
"""
from scraper import get_gym_count
from models import db, GymReading
from apscheduler.schedulers.background import BackgroundScheduler


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

def start_scheduler(app):
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=lambda: save_reading(app),
        trigger='interval',
        minutes=5,
    )
    scheduler.start()