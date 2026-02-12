# NEU Gym Tracker 🏋️

Real-time gym occupancy tracking for Northeastern University's Marino Center. Scrapes live headcount data every 5 minutes, stores historical trends, and sends email alerts when the gym is empty.

**Live:** https://neu-gym-tracker.onrender.com

## Features

- Live occupancy count for 3rd Floor Weight Room and 1st Floor Weight Room
- Color-coded busyness indicator based on each floor's capacity
- Today's trend chart
- Weekly heatmap showing best times to go
- Email alerts when occupancy drops below threshold
- Auto-refreshes every 2 minutes

## Tech Stack

- **Backend:** Python, Flask, SQLAlchemy
- **Scraper:** Selenium (headless Chrome)
- **Scheduler:** APScheduler (runs every 5 minutes)
- **Database:** SQLite
- **Frontend:** HTML, CSS, JavaScript, Chart.js
- **Deployment:** Render

## How It Works
```
Browser → Flask API → SQLite Database
                ↑
          APScheduler (every 5 min)
                ↓
          Selenium Scraper → NEU Connect2Concepts Widget
                ↓
          Email Alerts (when gym is empty)
```

## Setup
```bash
git clone https://github.com/10thoesam/neu-gym-tracker.git
cd neu-gym-tracker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

## Author

Tenzin Thoesam Shrestha
M.S. Computer Science — Northeastern University, Khoury College