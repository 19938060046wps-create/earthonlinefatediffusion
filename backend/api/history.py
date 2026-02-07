"""
历史记录 API 路由模块
处理命盘历史记录的增删查改
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from schemas.history import (
    CreateHistoryRequest,
    HistoryResponse,
    HistoryListResponse,
    UpdateHistoryTitleRequest
)
from utils.supabase_client import get_supabase
from api.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["历史记录"])


@router.get("", response_model=HistoryListResponse, summary="获取历史记录列表")
async def get_history_list(current_user: dict = Depends(get_current_user)):
    """
    获取当前用户的所有历史记录
    按创建时间倒序排列
    """
    supabase = get_supabase()
    
    result = supabase.table("history_items")\
        .select("*")\
        .eq("user_id", current_user["id"])\
        .order("created_at", desc=True)\
        .execute()
    
    items = [HistoryResponse(**item) for item in result.data]
    
    return HistoryListResponse(items=items, total=len(items))


@router.post("", response_model=HistoryResponse, summary="创建历史记录")
async def create_history(
    request: CreateHistoryRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    创建新的命盘历史记录
    """
    supabase = get_supabase()
    
    result = supabase.table("history_items").insert({
        "user_id": current_user["id"],
        "title": request.title,
        "t_level": request.t_level,
        "birth_year": request.birth_year,
        "birth_month": request.birth_month,
        "birth_day": request.birth_day,
        "birth_hour": request.birth_hour,
        "gender": request.gender,
        "name": request.name,
        "chart_data": request.chart_data
    }).execute()
    
    return HistoryResponse(**result.data[0])


@router.get("/{history_id}", response_model=HistoryResponse, summary="获取历史详情")
async def get_history_detail(
    history_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    获取特定历史记录的详细信息
    """
    supabase = get_supabase()
    
    result = supabase.table("history_items")\
        .select("*")\
        .eq("id", history_id)\
        .eq("user_id", current_user["id"])\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="历史记录不存在")
    
    return HistoryResponse(**result.data[0])


@router.delete("/{history_id}", summary="删除历史记录")
async def delete_history(
    history_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    删除特定历史记录
    """
    supabase = get_supabase()
    
    # 验证记录存在且属于当前用户
    existing = supabase.table("history_items")\
        .select("id")\
        .eq("id", history_id)\
        .eq("user_id", current_user["id"])\
        .execute()
    
    if not existing.data:
        raise HTTPException(status_code=404, detail="历史记录不存在")
    
    # 删除记录
    supabase.table("history_items").delete().eq("id", history_id).execute()
    
    return {"message": "删除成功"}


@router.put("/{history_id}/title", response_model=HistoryResponse, summary="重命名历史记录")
async def rename_history(
    history_id: str,
    request: UpdateHistoryTitleRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    更新历史记录标题
    """
    supabase = get_supabase()
    
    # 验证记录存在且属于当前用户
    existing = supabase.table("history_items")\
        .select("id")\
        .eq("id", history_id)\
        .eq("user_id", current_user["id"])\
        .execute()
    
    if not existing.data:
        raise HTTPException(status_code=404, detail="历史记录不存在")
    
    # 更新标题
    result = supabase.table("history_items")\
        .update({"title": request.title})\
        .eq("id", history_id)\
        .execute()
        
    return HistoryResponse(**result.data[0])
