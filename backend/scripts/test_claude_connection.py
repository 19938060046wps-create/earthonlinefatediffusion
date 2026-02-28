import os
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
CLAUDE_BASE_URL = os.getenv("CLAUDE_BASE_URL")

print(f"Testing connection to: {CLAUDE_BASE_URL}...")

if not CLAUDE_API_KEY:
    print("Error: CLAUDE_API_KEY is missing.")
    exit(1)

headers = {
    "Authorization": f"Bearer {CLAUDE_API_KEY}",
    "Content-Type": "application/json"
}

payload = {
    "model": "claude-opus-4-6-thinking",
    "messages": [
        {"role": "user", "content": "你好，请用一句话证明你在线并且可以正常回复。"}
    ]
}

try:
    with httpx.Client(timeout=300.0) as client:
        response = client.post(
            f"{CLAUDE_BASE_URL.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        result = response.json()
        
        reply = result.get("choices", [{}])[0].get("message", {}).get("content", "Empty reply")
        print("\n=== Connection Successful ===")
        print(f"Claude Reply: {reply}")
        
except httpx.HTTPStatusError as e:
    print(f"\nHTTP Error: {e.response.status_code}")
    print(e.response.text)
except Exception as e:
    print(f"\nConnection Error: {e}")
