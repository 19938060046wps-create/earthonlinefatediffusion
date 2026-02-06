"""
直接测试 AI 服务模块
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

print("=" * 50)
print("AI Service Direct Test")
print("=" * 50)

# 测试环境变量
api_key = os.getenv("GEMINI_API_KEY")
print(f"\n1. API Key: {api_key[:20] if api_key else 'NOT SET'}...")

# 直接导入并测试 ai_service
print("\n2. Importing ai_service module...")
from services.ai_service import generate_ai_response, GEMINI_API_KEY

print(f"   Module GEMINI_API_KEY: {GEMINI_API_KEY[:20] if GEMINI_API_KEY else 'NOT SET'}...")

# 测试生成响应
print("\n3. Testing generate_ai_response...")
test_chart = {
    "gender": "male",
    "year": "甲子",
    "month": "乙丑",
    "day": "丙寅",
    "hour": "丁卯",
    "yearShen": "子",
    "monthShen": "丑",
    "dayShen": "寅",
    "hourShen": "卯"
}

try:
    response = generate_ai_response(test_chart, "你好")
    print(f"   Response (first 200 chars): {response[:200]}...")
except Exception as e:
    print(f"   Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("Test Complete")
