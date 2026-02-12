from flask import Flask, render_template, jsonify, request
from models import db, GymReading
from scheduler import start_scheduler
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gym.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

start_scheduler(app)

@app.route('/')
def dashboard():
    return render_template('index.html')

@app.route('/api/current')
def current_count():
    locations = ['Marino Center - 3rd Floor Weight Room', 'Marino Center- 1st Floor Weight Room']
    results = []
    for loc in locations:
        latest = GymReading.query.filter_by(location=loc).order_by(GymReading.timestamp.desc()).first()
        if latest:
            results.append(latest.to_dict())
    if results:
        return jsonify(results)
    return jsonify({'error': 'No data yet'}), 404

@app.route('/api/today')
def today_readings():
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    readings = GymReading.query.filter(
        GymReading.timestamp >= today_start
    ).order_by(GymReading.timestamp).all()
    return jsonify([r.to_dict() for r in readings])

@app.route('/api/history')
def history():
    days = request.args.get('days', 7, type=int)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    readings = GymReading.query.filter(
        GymReading.timestamp >= since
    ).order_by(GymReading.timestamp).all()
    return jsonify([r.to_dict() for r in readings])

@app.route('/api/average')
def average():
    readings = GymReading.query.all()
    data = {}
    for r in readings:
        day = str(r.day_of_week)
        hour = str(r.hour)
        if day not in data:
            data[day] = {}
        if hour not in data[day]:
            data[day][hour] = []
        data[day][hour].append(r.count)

    result = {}
    for day in data:
        result[day] = {}
        for hour in data[day]:
            counts = data[day][hour]
            result[day][hour] = round(sum(counts) / len(counts), 1)

    return jsonify(result)

@app.route('/api/predict')
def predict():
    day = request.args.get('day', type=int)
    hour = request.args.get('hour', type=int)

    if day is None or hour is None:
        return jsonify({'error': 'Provide ?day=0&hour=14'}), 400
    if not (0 <= day <= 6) or not (0 <= hour <= 23):
        return jsonify({'error': 'day must be 0-6, hour must be 0-23'}), 400

    readings = GymReading.query.filter_by(day_of_week=day, hour=hour).all()
    if not readings:
        return jsonify({'error': 'Not enough data'}), 404

    counts = [r.count for r in readings]
    avg = round(sum(counts) / len(counts), 1)

    return jsonify({
        'day_of_week': day,
        'hour': hour,
        'predicted_count': avg,
        'based_on_readings': len(counts),
    })


@app.route('/api/stats')
def stats():
    total = GymReading.query.count()
    if total == 0:
        return jsonify({'total_readings': 0, 'message': 'No data yet'})

    all_readings = GymReading.query.all()
    counts = [r.count for r in all_readings]

    return jsonify({
        'total_readings': total,
        'average_count': round(sum(counts) / len(counts), 1),
        'max_count': max(counts),
        'min_count': min(counts),
    })


if __name__ == '__main__':
    app.run(debug=True)