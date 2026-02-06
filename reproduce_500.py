import requests
import json

def test_send_email_code():
    url = "http://localhost:8000/api/auth/send-email-code"
    payload = {"email": "test@example.com"}
    headers = {"Content-Type": "application/json"}
    
    print(f"Testing POST {url} with {payload}...")
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_send_email_code()
