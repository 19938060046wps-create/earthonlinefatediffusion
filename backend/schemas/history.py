"""
历史记录相关 Pydantic 模型
定义命盘历史记录的请求和响应格式
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


class BaZiData(BaseModel):
    """八字数据"""
    year: str
    month: str
    day: str
    hour: str
    yearShen: str
    monthShen: str
    dayShen: str
    hourShen: str


class CreateHistoryRequest(BaseModel):
    """创建历史记录请求"""
    title: str = Field(..., max_length=200)
    t_level: str = Field(..., max_length=10)
    birth_year: int = Field(..., ge=1900, le=2100)
    birth_month: int = Field(..., ge=1, le=12)
    birth_day: int = Field(..., ge=1, le=31)
    birth_hour: Optional[int] = Field(None, ge=0, le=23)
    gender: str = Field(..., pattern="^(male|female)$")
    name: Optional[str] = Field(None, max_length=100)
    chart_data: Optional[Dict[str, Any]] = None


class HistoryResponse(BaseModel):
    """历史记录响应"""
    id: str
    title: str
    t_level: str
    birth_year: int
    birth_month: int
    birth_day: int
    birth_hour: Optional[int] = None
    gender: str
    name: Optional[str] = None
    chart_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class HistoryListResponse(BaseModel):
    """历史记录列表响应"""
    items: List[HistoryResponse]
    total: int
