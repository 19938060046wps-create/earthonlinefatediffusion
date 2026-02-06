"""
捕获完整的 Gemini API 错误信息
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key: {api_key}")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content('你好')
    print(f"SUCCESS: {response.text[:100]}")
except Exception as e:
    print(f"ERROR TYPE: {type(e).__name__}")
    print(f"ERROR MESSAGE: {e}")
    import traceback
    traceback.print_exc()
