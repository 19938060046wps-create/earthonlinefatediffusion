"""
聊天相关 Pydantic 模型
定义 AI 对话和好友聊天的请求和响应格式
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChatMessageRequest(BaseModel):
    """发送聊天消息请求"""
    history_id: str = Field(..., description="历史记录 ID")
    text: str = Field(..., min_length=1, max_length=2000, description="消息内容")


class ChatMessageResponse(BaseModel):
    """聊天消息响应"""
    id: str
    text: str
    is_user: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """聊天历史响应"""
    messages: List[ChatMessageResponse]


class AIResponse(BaseModel):
    """AI 回复响应"""
    message: ChatMessageResponse
    balance: int  # 剩余余额
