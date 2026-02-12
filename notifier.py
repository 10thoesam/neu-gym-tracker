import requests
import os

RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
NOTIFY_TO = os.environ.get('NOTIFY_TO', '')
DISCORD_WEBHOOK = os.environ.get('DISCORD_WEBHOOK', '')

def send_alert(location, count):
    send_email_alert(location, count)
    send_discord_alert(location, count)

def send_email_alert(location, count):
    if not RESEND_API_KEY:
        return
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
            print(f"Email alert sent for {location}: {count} people")
        else:
            print(f"Failed to send email: {response.text}")
    except Exception as e:
        print(f"Failed to send email: {e}")

def send_discord_alert(location, count):
    if not DISCORD_WEBHOOK:
        return
    try:
        short_name = '1st Floor' if '1st Floor' in location else '3rd Floor'
        response = requests.post(DISCORD_WEBHOOK, json={
            'embeds': [{
                'title': '🏋️ Gym Alert!',
                'description': f'**{short_name} Weight Room** has only **{count}** people right now. Great time to go!',
                'color': 3066993,
                'footer': {'text': 'NEU Gym Tracker · neu-gym-tracker.onrender.com'}
            }]
        })
        if response.status_code == 204:
            print(f"Discord alert sent for {location}: {count} people")
        else:
            print(f"Failed to send Discord: {response.text}")
    except Exception as e:
        print(f"Failed to send Discord: {e}")