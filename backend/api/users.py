"""
用户 API 路由模块
处理用户资料更新、充值、邀请等操作
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File

from schemas.user import (
    UserResponse,
    UpdateProfileRequest,
    RechargeRequest,
    UpdateThemeRequest,
    UpdatePrivacyRequest,
    InviteCodeRequest
)
from services.user_service import (
    update_user_profile,
    update_user_balance,
    update_user_theme,
    update_user_privacy,
    get_user_invite_code,
    apply_invite_code
)
from api.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["用户"])


@router.put("/profile", response_model=UserResponse, summary="更新个人资料")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    更新用户名和头像
    """
    updated_user = update_user_profile(
        current_user["id"],
        username=request.username,
        avatar_url=request.avatar_url
    )
    return UserResponse(**updated_user)


@router.post("/recharge", response_model=UserResponse, summary="充值算力")
async def recharge(
    request: RechargeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    充值算力点数
    NOTE: 生产环境需要集成支付系统
    """
    updated_user = update_user_balance(current_user["id"], request.amount)
    return UserResponse(**updated_user)


@router.put("/theme", response_model=UserResponse, summary="切换主题")
async def change_theme(
    request: UpdateThemeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    切换深色/浅色主题
    """
    updated_user = update_user_theme(current_user["id"], request.theme)
    return UserResponse(**updated_user)


@router.put("/privacy", response_model=UserResponse, summary="更新隐私设置")
async def update_privacy(
    request: UpdatePrivacyRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    更新隐私协议同意状态
    """
    updated_user = update_user_privacy(current_user["id"], request.has_agreed_privacy)
    return UserResponse(**updated_user)


@router.get("/invite/code", summary="获取我的邀请码")
async def get_my_invite_code(
    current_user: dict = Depends(get_current_user)
):
    """
    获取当前用户的邀请码，如果不存在则自动生成
    """
    code = get_user_invite_code(current_user["id"])
    return {"invite_code": code}


@router.post("/invite/apply", summary="填写邀请码")
async def apply_invite(
    request: InviteCodeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    填写邀请码，获得算力奖励
    """
    try:
        result = apply_invite_code(current_user["id"], request.invite_code)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/avatar", response_model=UserResponse, summary="上传头像")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    上传用户头像 (本地存储)
    """
    import os
    import time
    import shutil
    
    # 验证文件类型
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只允许上传图片文件")
    
    # 生成文件名
    user_id = current_user["id"]
    timestamp = int(time.time() * 1000)
    # 获取文件扩展名
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    if not file_ext:
        file_ext = ".jpg"
        
    filename = f"{user_id}_{timestamp}{file_ext}"
    
    # 确保目录存在
    upload_dir = "uploads/avatars"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, filename)
    
    # 保存文件
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")
        
    # 构建 URL
    # 获取基础 URL (从环境变量或请求中)
    # 这里简单起见，假设后端和前端在同一域名或已配置好代理
    # 返回相对路径或完整路径
    avatar_url = f"/uploads/avatars/{filename}"
    
    # 更新用户信息
    updated_user = update_user_profile(
        current_user["id"],
        avatar_url=avatar_url
    )
    
    return UserResponse(**updated_user)


@router.get("/details", response_model=UserResponse, summary="获取用户详细信息")
async def get_details(
    current_user: dict = Depends(get_current_user)
):
    """
    获取包含大字段（如 avatar_url）的完整用户信息
    应在登录后延迟加载
    """
    from services.user_service import get_user_full_details
    details = get_user_full_details(current_user["id"])
    if not details:
        raise HTTPException(status_code=404, detail="用户不存在")
    return UserResponse(**details)
