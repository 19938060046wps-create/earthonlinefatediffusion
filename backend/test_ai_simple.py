import os
import google.generativeai as genai
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
print(f"Loading env from: {env_path}")
load_dotenv(env_path)

KEY = os.getenv("GEMINI_API_KEY")
print(f"Key loaded: {'YES' if KEY else 'NO'}")

if not KEY:
    print("Error: No key found")
    exit(1)

genai.configure(api_key=KEY)
try:
    print("Attempting to connect to Gemini...")
    # Using the exact model from the codebase
    model = genai.GenerativeModel('gemini-3-flash-preview') 
    
    response = model.generate_content("Respond with 'OK' if you receive this.")
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Failed: {e}")
