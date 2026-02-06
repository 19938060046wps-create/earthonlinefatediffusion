"""
用户相关 Pydantic 模型
定义用户数据的请求和响应格式
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SendCodeRequest(BaseModel):
    """发送手机验证码请求"""
    phone: str = Field(..., min_length=11, max_length=11, description="手机号码")


class SendEmailCodeRequest(BaseModel):
    """发送邮箱验证码请求"""
    email: str = Field(..., description="邮箱地址")


class LoginRequest(BaseModel):
    """手机登录请求"""
    phone: str = Field(..., min_length=11, max_length=11, description="手机号码")
    code: str = Field(..., min_length=4, max_length=6, description="验证码")
    invite_code: Optional[str] = Field(None, description="邀请码")


class EmailLoginRequest(BaseModel):
    """邮箱登录请求"""
    email: str = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=4, max_length=6, description="验证码")
    invite_code: Optional[str] = Field(None, description="邀请码")


class CombinedLoginRequest(BaseModel):
    """手机+邮箱登录请求（邮箱验证码）"""
    phone: str = Field(..., min_length=11, max_length=11, description="手机号码")
    email: str = Field(..., description="邮箱地址")
    code: str = Field(..., min_length=4, max_length=6, description="邮箱验证码")
    invite_code: Optional[str] = Field(None, description="邀请码")


class LoginResponse(BaseModel):
    """登录响应"""
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    """用户信息响应"""
    id: str
    uid: Optional[int] = None  # 纯数字 UID，显示用
    phone: Optional[str] = None
    email: Optional[str] = None
    username: str
    avatar_url: Optional[str] = None
    balance: int
    has_agreed_privacy: bool
    theme: str
    invite_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    """更新个人资料请求"""
    username: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None


class RechargeRequest(BaseModel):
    """充值请求"""
    amount: int = Field(..., gt=0, description="充值算力点数")


class UpdateThemeRequest(BaseModel):
    """更新主题请求"""
    theme: str = Field(..., pattern="^(dark|light)$", description="主题")


class UpdatePrivacyRequest(BaseModel):
    """更新隐私设置请求"""
    has_agreed_privacy: bool


class InviteCodeRequest(BaseModel):
    """填写邀请码请求"""
    invite_code: str = Field(..., min_length=6, max_length=6, description="邀请码")

