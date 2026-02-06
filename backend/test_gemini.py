
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {bool(api_key)}")
if api_key:
    # masking key for log safety
    print(f"API Key: {api_key[:5]}...{api_key[-5:]}")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')
    print("Sending test request to Gemini...")
    response = model.generate_content("Hello, are you operational?")
    print("Response received!")
    print(f"Content: {response.text}")
except Exception as e:
    print(f"Gemini Error: {e}")
