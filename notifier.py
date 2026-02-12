import requests
import os

RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
NOTIFY_TO = os.environ.get('NOTIFY_TO', '')

def send_alert(location, count):
    try:
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {RESEND_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'from': 'NEU Gym Tracker <onboarding@resend.dev>',
                'to': [NOTIFY_TO],
                'subject': f'🏋️ Gym Alert: {location} is not busy!',
                'text': f'{location} currently has only {count} people. Great time to go!',
            }
        )
        if response.status_code == 200:
            print(f"Alert sent for {location}: {count} people")
        else:
            print(f"Failed to send alert: {response.text}")
    except Exception as e:
        print(f"Failed to send alert: {e}")