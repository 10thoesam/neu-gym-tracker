import smtplib
from email.mime.text import MIMEText
import os

GMAIL_ADDRESS = os.environ.get('GMAIL_ADDRESS', '')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD', '')
NOTIFY_TO = os.environ.get('NOTIFY_TO', '')

def send_alert(location, count):
    print(f"Email config - FROM: {GMAIL_ADDRESS}, TO: {NOTIFY_TO}, PASSWORD length: {len(GMAIL_APP_PASSWORD)}")
    subject = f"🏋️ Gym Alert: {location} is empty!"
    body = f"{location} currently has only {count} people. Great time to go!"

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = GMAIL_ADDRESS
    msg['To'] = NOTIFY_TO

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        print(f"Alert sent for {location}: {count} people")
    except Exception as e:
        print(f"Failed to send alert: {e}")