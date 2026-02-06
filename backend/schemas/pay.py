from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

class CreatePaymentRequest(BaseModel):
    """创建支付订单请求"""
    amount: float = Field(..., ge=0.01)
    points: int = Field(..., ge=1)

class CreatePaymentResponse(BaseModel):
    """创建支付订单响应"""
    order_id: str
    final_amount: float
    points: int
    expires_at: datetime

class PaymentStatusResponse(BaseModel):
    """支付状态响应"""
    order_id: str
    status: int  # 0: 待支付, 1: 已支付, 2: 已过期
    balance: Optional[int] = None

class SmsWebhookRequest(BaseModel):
    """SmsForwarder Webhook 请求格式"""
    content: Optional[str] = None
    amount: Optional[float] = None
    # 可以根据 SmsForwarder 的实际配置添加更多字段
