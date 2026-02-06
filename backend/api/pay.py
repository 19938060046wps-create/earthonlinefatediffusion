import os
import random
import re
import hashlib
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from datetime import datetime, timedelta

from schemas.pay import CreatePaymentRequest, CreatePaymentResponse, PaymentStatusResponse, SmsWebhookRequest
from utils.supabase_client import get_supabase
from api.auth import get_current_user

router = APIRouter(prefix="/api/pay", tags=["支付"])

# 密钥通常从环境变量读取
PAY_WEBHOOK_TOKEN = os.getenv("PAY_WEBHOOK_TOKEN", "fate_diffusion_secret_2024")

@router.post("/create_order", response_model=CreatePaymentResponse, summary="创建支付订单")
async def create_order(
    request: CreatePaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    创建支付订单并生成唯一负向偏差金额
    """
    supabase = get_supabase()
    
    # 尝试生成不冲突的最终金额 (偏差范围扩大到 0.01 - 0.50，支持更高并发)
    max_retries = 30
    final_amount = request.amount
    
    for _ in range(max_retries):
        # 产生 0.01 到 0.50 之间的随机偏差，共 50 档
        offset = round(random.uniform(0.01, 0.50), 2)
        candidate_amount = round(request.amount - offset, 2)
        if candidate_amount <= 0:
            candidate_amount = 0.01
            
        # 检查当前待支付订单中是否存在完全相同的金额
        res = supabase.table("payment_orders")\
            .select("id")\
            .eq("final_amount", candidate_amount)\
            .eq("status", 0)\
            .execute()
            
        if not res.data:
            final_amount = candidate_amount
            break
    else:
        raise HTTPException(status_code=500, detail="当前充值人数较多，请稍后再试")

    # 插入订单
    res = supabase.table("payment_orders").insert({
        "user_id": current_user["id"],
        "base_amount": request.amount,
        "final_amount": final_amount,
        "points": request.points,
        "status": 0,
        "expires_at": (datetime.now() + timedelta(minutes=5)).isoformat()
    }).execute()
    
    if not res.data:
        raise HTTPException(status_code=500, detail="创建订单失败")
        
    order = res.data[0]
    return CreatePaymentResponse(
        order_id=order["id"],
        final_amount=order["final_amount"],
        points=order["points"],
        expires_at=datetime.fromisoformat(order["expires_at"].replace('Z', '+00:00'))
    )

@router.post("/webhook", summary="SmsForwarder Webhook 回调")
async def pay_webhook(
    request: SmsWebhookRequest,
    x_sms_token: Optional[str] = Header(None)
):
    """
    处理手机通知回调，执行金额匹配逻辑
    """
    # 1. 验证 Token
    if x_sms_token != PAY_WEBHOOK_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # 2. 提取金额
    amount = request.amount
    if amount is None and request.content:
        # 从文本提取，例如 "您尾号1234卡2月4日22:00支付宝入账(收入)19.88元"
        match = re.search(r"(?:成功收款|到账|入账).*?(\d+(?:\.\d+)?)", request.content)
        if match:
            amount = float(match.group(1))
            
    if amount is None:
        return {"status": "ignored", "reason": "No amount found"}
        
    # 3. 匹配订单 (金额吻合 + 待支付 + 未过期)
    supabase = get_supabase()
    res = supabase.table("payment_orders")\
        .select("*")\
        .eq("final_amount", amount)\
        .eq("status", 0)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
        
    if not res.data:
        return {"status": "not_found", "amount": amount}
        
    order = res.data[0]
    
    # 4. 校验过期 (服务器端逻辑)
    # 此处假设 DB 已经按 expires_at 过滤，或在这里手动补
    
    # 5. 更新状态并加款 (事务操作在 Supabase 环境通常由 RPC 或分步完成)
    # 我们这里通过客户端分步模拟
    
    # 更新订单为成功
    supabase.table("payment_orders")\
        .update({"status": 1})\
        .eq("id", order["id"])\
        .execute()
        
    # 获取当前用户余额
    user_res = supabase.table("users")\
        .select("balance")\
        .eq("id", order["user_id"])\
        .execute()
        
    if user_res.data:
        new_balance = user_res.data[0]["balance"] + order["points"]
        supabase.table("users")\
            .update({"balance": new_balance})\
            .eq("id", order["user_id"])\
            .execute()
            
    return {"status": "success", "order_id": order["id"], "points_added": order["points"]}

@router.get("/check_status/{order_id}", response_model=PaymentStatusResponse, summary="查询订单状态")
async def check_status(order_id: str):
    """
    前端轮询订单支付状态
    """
    supabase = get_supabase()
    res = supabase.table("payment_orders")\
        .select("*")\
        .eq("id", order_id)\
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=404, detail="订单不存在")
        
    order = res.data[0]
    
    balance = None
    if order["status"] == 1:
        user_res = supabase.table("users")\
            .select("balance")\
            .eq("id", order["user_id"])\
            .execute()
        if user_res.data:
            balance = user_res.data[0]["balance"]
            
    return PaymentStatusResponse(
        order_id=order["id"],
        status=order["status"],
        balance=balance
    )
