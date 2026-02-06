"""
测试完整的 AI 聊天流程
"""
import httpx

# 1. 首先创建一个历史记录
print("1. Creating history item...")
create_response = httpx.post(
    'http://localhost:8000/api/history/',
    json={
        "title": "测试命盘",
        "t_level": "T3",
        "birth_year": 1998,
        "birth_month": 1,
        "birth_day": 1,
        "birth_hour": 9,
        "gender": "male",
        "chart_data": {
            "year": "甲子",
            "month": "乙丑",
            "day": "丙寅",
            "hour": "丁卯"
        }
    },
    timeout=30
)
print(f"   Status: {create_response.status_code}")
print(f"   Response: {create_response.text[:300]}...")

if create_response.status_code != 200 and create_response.status_code != 201:
    print("   Failed to create history item")
    exit(1)

history_data = create_response.json()
history_id = history_data.get('id')
print(f"   History ID: {history_id}")

# 2. 发送聊天消息
print("\n2. Sending chat message...")
chat_response = httpx.post(
    'http://localhost:8000/api/chat/message',
    json={
        "history_id": history_id,
        "text": "你好，测试一下"
    },
    timeout=60
)
print(f"   Status: {chat_response.status_code}")
print(f"   Response: {chat_response.text[:500]}...")

if chat_response.status_code == 200:
    print("\n✅ 测试成功！")
else:
    print(f"\n❌ 测试失败！状态码: {chat_response.status_code}")
