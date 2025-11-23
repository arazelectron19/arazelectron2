import requests
import logging

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = "7599107546:AAHqhn-Fj4dQm-d8baGlqfvyFuaxj6CSDqs"
TELEGRAM_CHAT_ID = "1809057644"

async def send_telegram_message(text: str):
    """Send message to Telegram"""
    try:
        url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
        
        payload = {
            'chat_id': TELEGRAM_CHAT_ID,
            'text': text
        }
        
        response = requests.post(url, json=payload)
        data = response.json()
        
        logger.info(f'Telegram response: {data}')
        
        if not data.get('ok'):
            raise Exception(f'Telegram error: {data}')
            
        return data
    except Exception as e:
        logger.error(f'Telegram notification failed: {e}')
        # Don't fail the order if Telegram fails
        return None
