"""
AI 服务模块
集成 Google Gemini API 进行命盘分析和对话
"""

import os
import google.generativeai as genai
from typing import Optional
from utils.supabase_client import get_supabase

from utils.prompts import EOGF_SYSTEM_PROMPT

# 配置 Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 安全日志
if GEMINI_API_KEY:
    print(f"[AI_SERVICE] GEMINI_API_KEY loaded: {'YES' if GEMINI_API_KEY else 'NO'}")
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("[AI_SERVICE] WARNING: GEMINI_API_KEY is NOT set")

# 系统提示词 (System Prompt)
SYSTEM_PROMPT = EOGF_SYSTEM_PROMPT

def get_gemini_model():
    """获取配置好的 Gemini 模型实例"""
    if not GEMINI_API_KEY:
        # 如果没有配置 key，返回 None，调用方应处理
        return None
    
    # 使用 gemini-3-flash-preview 模型
    model = genai.GenerativeModel('gemini-3-flash-preview')
    return model

def generate_ai_response(chart_data: Optional[dict], user_message: str) -> str:
    """
    生成 AI 回复
    
    :param chart_data: 八字命盘数据 (字典)
    :param user_message: 用户消息
    :return: AI 回复文本
    """
    try:
        model = get_gemini_model()
        if not model:
            # Mask the error for the user, but log it
            print("[AI_SERVICE] CRITICAL: GEMINI_API_KEY missing")
            raise ValueError("SYSTEM_CONFIG_ERROR: 403") # Signal 403/401
        
        # 构造完整的 Prompt
        is_benchmark = "分析命盘" in user_message
        
        if chart_data:
            # 将命盘数据格式化为字符串
            chart_str = f"""
            性别：{'男' if chart_data.get('gender') == 'male' else '女'}
            年柱：{chart_data.get('year')} ({chart_data.get('yearShen')})
            月柱：{chart_data.get('month')} ({chart_data.get('monthShen')})
            日柱：{chart_data.get('day')} ({chart_data.get('dayShen')})
            时柱：{chart_data.get('hour')} ({chart_data.get('hourShen')})
            """
            
            if is_benchmark:
                # 基准测试：使用完整的 EOGF 系统提示词，生成详细报告
                full_prompt = f"{SYSTEM_PROMPT}\n\n**用户命盘信息**：\n{chart_str}\n\n**指令**：请根据 EOGF 协议生成完整的《生物计算硬件性能基准测试报告》。\n\n**用户输入**：{user_message}"
            else:
                # 后续对话：使用轻量级提示词，保持人设但更对话化
                light_prompt = """
                你是由 EarthOnline Team 开发的 EOGF (Earth Online Generative Fate) 智能引擎。
                
                **交互原则**：
                1. 保持"高维生物计算机"的冷峻、理性、科技感人设。
                2. 使用物理学、计算机科学、博弈论术语解释玄学现象。
                3. **回答需要详细、深入分析**，不要敷衍，但请**不要**重新输出《五行能量矢量表》(Five Element Energy Vector Table) 或《双重评级》(Dual Rating)，也不要输出长篇的硬件规格扫描。
                4. 聚焦于针对用户的问题进行深度逻辑推演。
                5. 语气格式示例："System Alert: 检测到情感模块波动..." 或 "Logic Kernel: 深度扫描显示..."
                """
                full_prompt = f"{light_prompt}\n\n**当前用户命盘上下文**：\n{chart_str}\n\n**用户提问**：{user_message}\n\n**IMPORTANT**：回答结束时，必须基于当前命盘格局和对话，**猜测用户最想知道的 3 个问题**，以列表形式列出，引导用户继续提问。"
        else:
            full_prompt = f"{SYSTEM_PROMPT}\n\n**用户提问**：{user_message}"

        # 调用 Gemini API
        response = model.generate_content(full_prompt)
        return response.text
        
    except Exception as e:
        error_str = str(e)
        print(f"[AI_SERVICE] Gemini API Error: {error_str}") # Log the error but ensure no key leak naturally
        
        if "401" in error_str or "403" in error_str:
            raise ValueError("AUTH_ERROR: 403")
        elif "429" in error_str:
            raise ValueError("RATE_LIMIT: 429")
        elif "504" in error_str or "timed out" in error_str.lower():
            raise ValueError("TIMEOUT: 504")
        else:
            raise ValueError(f"INTERNAL_ERROR: 500")

def save_chat_message(history_id: str, text: str, is_user: bool) -> dict:
    """
    保存聊天消息到数据库
    
    :param history_id: 历史记录 ID
    :param text: 消息内容
    :param is_user: 是否为用户消息
    :return: 保存的消息数据
    """
    supabase = get_supabase()
    
    result = supabase.table("chat_messages").insert({
        "history_id": history_id,
        "text": text,
        "is_user": is_user
    }).execute()
    
    return result.data[0]

def get_chat_messages(history_id: str) -> list:
    """
    获取历史记录的所有聊天消息
    
    :param history_id: 历史记录 ID
    :return: 消息列表
    """
    supabase = get_supabase()
    
    result = supabase.table("chat_messages")\
        .select("*")\
        .eq("history_id", history_id)\
        .order("created_at")\
        .execute()
    
    return result.data

def process_chat_message(user_id: str, history_id: str, message: str) -> dict:
    """
    处理用户聊天消息，返回 AI 回复
    
    :param user_id: 用户 ID
    :param history_id: 历史记录 ID
    :param message: 用户消息
    :return: 包含 AI 回复和最新余额的字典
    """
    from services.user_service import get_user_by_id, update_user_balance
    
    # 1. 检查并扣除余额
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError("用户不存在")
    
    if user["balance"] < 50:
        raise ValueError("余额不足，每次对话消耗 50 算力")
        
    # 扣除余额 (先扣费，再服务)
    updated_user = update_user_balance(user_id, -50)
    
    # 2. 获取当次会话的命盘信息的上下文
    supabase = get_supabase()
    history = supabase.table("history_items").select("*").eq("id", history_id).execute()
    
    if not history.data:
        raise ValueError("未找到对应的历史记录")
        
    history_data = history.data[0]
    chart_data = history_data.get("chart_data", {})
    # 补充性别信息
    chart_data['gender'] = history_data.get('gender', 'male')
    
    # 3. 保存用户消息
    save_chat_message(history_id, message, True)
    
    # 4. 生成 AI 回复
    try:
        ai_text = generate_ai_response(chart_data, message)
    except ValueError as e:
        # 5. 检测 AI 调用失败，返还用户算力
        # 捕获 generate_ai_response 抛出的明确错误
        updated_user = update_user_balance(user_id, 50)
        print(f"[REFUND] 用户 {user_id} 因 AI 调用失败 ({str(e)}) 已返还 50 算力")
        raise e  # Re-raise to let API layer handle status code

    # 6. 保存 AI 回复 (只有成功时才保存)
    ai_msg = save_chat_message(history_id, ai_text, False)
    
    return {
        "message": ai_msg,
        "balance": updated_user["balance"]
    }
