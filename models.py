from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class GymReading(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    count = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)
    hour = db.Column(db.Integer, nullable=False)
    location = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'count': self.count,
            'timestamp': self.timestamp.isoformat(),
            'day_of_week': self.day_of_week,
            'hour': self.hour,
            'location': self.location,
        }