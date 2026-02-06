"""
聊天 API 路由模块
处理 AI 对话功能
"""

from fastapi import APIRouter, HTTPException, Depends

from schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    AIResponse
)
from services.ai_service import process_chat_message, get_chat_messages
from api.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["AI 对话"])


@router.post("/message", response_model=AIResponse, summary="发送消息给 AI")
async def send_message(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    发送消息给 AI 并获取回复
    每次对话消耗 50 算力
    """
    try:
        result = process_chat_message(
            current_user["id"],
            request.history_id,
            request.text
        )
        
        return AIResponse(
            message=ChatMessageResponse(**result["message"]),
            balance=result["balance"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{history_id}/messages", response_model=ChatHistoryResponse, summary="获取对话历史")
async def get_messages(
    history_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    获取特定历史记录的所有对话消息
    """
    messages = get_chat_messages(history_id)
    
    return ChatHistoryResponse(
        messages=[ChatMessageResponse(**msg) for msg in messages]
    )
