"""
AI 服务模块
集成 MiniMax API (使用 direct HTTP 请求，绕过 openai 库潜在的路径冲突)
"""

import os
import httpx
import json
from typing import Optional, List, Dict
from utils.supabase_client import get_supabase
from utils.prompts import EOGF_SYSTEM_PROMPT

# 配置 MiniMax API
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY")
BASE_URL = "https://api.minimax.io/v1/chat/completions"

# 安全日志
if MINIMAX_API_KEY:
    print(f"[AI_SERVICE] MINIMAX_API_KEY loaded: YES")
else:
    print("[AI_SERVICE] WARNING: MINIMAX_API_KEY is NOT set")

# 系统提示词 (System Prompt)
SYSTEM_PROMPT = EOGF_SYSTEM_PROMPT

def generate_ai_response(chart_data: Optional[dict], user_message: str) -> str:
    """
    生成 AI 回复 (使用 Direct HTTP)
    """
    if not MINIMAX_API_KEY:
        print("[AI_SERVICE] ERROR: MINIMAX_API_KEY not found")
        raise ValueError("SYSTEM_CONFIG_ERROR: 403")

    try:
        # 构造复杂的 Prompt
        is_benchmark = "分析命盘" in user_message
        
        if chart_data:
            chart_str = f"""
            性别：{'男' if chart_data.get('gender') == 'male' else '女'}
            年柱：{chart_data.get('year')} ({chart_data.get('yearShen')})
            月柱：{chart_data.get('month')} ({chart_data.get('monthShen')})
            日柱：{chart_data.get('day')} ({chart_data.get('dayShen')})
            时柱：{chart_data.get('hour')} ({chart_data.get('hourShen')})
            """
            
            if is_benchmark:
                full_prompt = f"{SYSTEM_PROMPT}\n\n**用户命盘信息**：\n{chart_str}\n\n**指令**：请根据 EOGF 协议生成完整的《生物计算硬件性能基准测试报告》。\n\n**用户输入**：{user_message}"
            else:
                light_prompt = """
                你是由 EarthOnline Team 开发的 EOGF (Earth Online Generative Fate) 智能引擎。
                
                **交互原则**：
                1. 保持"高维生物计算机"的冷峻、理性、科技感人设。
                2. 使用物理学、计算机科学、博弈论术语解释玄学现象。
                3. **回答需要详细、深入分析**，不要敷衍。
                4. 聚焦于针对用户的问题进行深度逻辑推演。
                5. 语气格式示例："System Alert: 检测到情感模块波动..." 或 "Logic Kernel: 深度扫描显示..."
                """
                full_prompt = f"{light_prompt}\n\n**当前用户命盘上下文**：\n{chart_str}\n\n**用户提问**：{user_message}\n\n**IMPORTANT**：回答结束时，必须基于当前命盘格局和对话，猜测用户最想知道的 3 个问题，引导用户继续提问。"
        else:
            full_prompt = f"{SYSTEM_PROMPT}\n\n**用户提问**：{user_message}"

        # 准备 HTTP 请求
        headers = {
            "Authorization": f"Bearer {MINIMAX_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "MiniMax-M2.5",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT if is_benchmark else "你是由 EarthOnline Team 开发的 EOGF 智能引擎。"},
                {"role": "user", "content": full_prompt}
            ],
            "temperature": 0.7
        }

        # 调用 MiniMax API
        with httpx.Client(timeout=60.0) as client:
            response = client.post(BASE_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            # 解析响应 (OpenAI 兼容格式)
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                print(f"[AI_SERVICE] Unexpected Response Structure: {result}")
                raise ValueError("API_RESPONSE_ERROR")
        
    except Exception as e:
        error_str = str(e)
        print(f"[AI_SERVICE] API Error: {error_str}")
        
        if "401" in error_str or "403" in error_str:
            raise ValueError("AUTH_ERROR: 403")
        elif "429" in error_str:
            raise ValueError("RATE_LIMIT: 429")
        elif "timeout" in error_str.lower():
            raise ValueError("TIMEOUT: 504")
        else:
            raise ValueError(f"INTERNAL_ERROR: 500")

def save_chat_message(history_id: str, text: str, is_user: bool) -> dict:
    supabase = get_supabase()
    result = supabase.table("chat_messages").insert({
        "history_id": history_id,
        "text": text,
        "is_user": is_user
    }).execute()
    return result.data[0]

def get_chat_messages(history_id: str) -> List[Dict]:
    supabase = get_supabase()
    result = supabase.table("chat_messages").select("*").eq("history_id", history_id).order("created_at").execute()
    return result.data

def process_chat_message(user_id: str, history_id: str, message: str) -> dict:
    from services.user_service import get_user_by_id, update_user_balance
    
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError("用户不存在")
    if user["balance"] < 50:
        raise ValueError("余额不足")
        
    update_user_balance(user_id, -50)
    
    supabase = get_supabase()
    history = supabase.table("history_items").select("*").eq("id", history_id).execute()
    if not history.data:
        raise ValueError("记录不存在")
        
    history_data = history.data[0]
    chart_data = history_data.get("chart_data", {})
    chart_data['gender'] = history_data.get('gender', 'male')
    
    save_chat_message(history_id, message, True)
    
    try:
        ai_text = generate_ai_response(chart_data, message)
        updated_user = get_user_by_id(user_id) # 获取最新余额
    except ValueError as e:
        update_user_balance(user_id, 50)
        raise e

    ai_msg = save_chat_message(history_id, ai_text, False)
    
    return {
        "message": ai_msg,
        "balance": updated_user["balance"]
    }
