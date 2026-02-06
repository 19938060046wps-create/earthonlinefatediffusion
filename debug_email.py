import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.email_service import send_email_verification_code
from dotenv import load_dotenv

load_dotenv(os.path.join('backend', '.env'))

def test_send():
    test_email = "asd1009510609@icloud.com"
    print(f"Testing email send to {test_email}...")
    try:
        code = send_email_verification_code(test_email)
        print(f"Function returned code: {code}")
        print("Test completed.")
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_send()
