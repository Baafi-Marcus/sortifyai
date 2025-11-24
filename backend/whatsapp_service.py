import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Twilio credentials
ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM")
WHATSAPP_TO = os.getenv("TWILIO_WHATSAPP_TO")

def send_feedback_notification(name, email, rating, message):
    """
    Send WhatsApp notification when feedback is received
    """
    try:
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        
        # Format the message
        stars = "⭐" * rating
        feedback_text = f"""🔔 *New Feedback Received!*

{stars} *Rating:* {rating}/5
👤 *Name:* {name or 'Anonymous'}
📧 *Email:* {email or 'Not provided'}

💬 *Message:*
{message}

---
_SortifyAI Feedback System_"""
        
        # Send WhatsApp message
        whatsapp_message = client.messages.create(
            from_=WHATSAPP_FROM,
            body=feedback_text,
            to=WHATSAPP_TO
        )
        
        print(f"WhatsApp notification sent! SID: {whatsapp_message.sid}")
        return True
        
    except Exception as e:
        print(f"Failed to send WhatsApp notification: {e}")
        return False
