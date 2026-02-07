"""
认证 API 路由模块
处理用户登录、注册和验证码发送
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from schemas.user import (
    SendCodeRequest, 
    SendEmailCodeRequest,
    LoginRequest, 
    EmailLoginRequest,
    CombinedLoginRequest,
    LoginResponse, 
    UserResponse
)
from services.auth_service import (
    validate_phone,
    send_verification_code,
    verify_code,
    create_access_token,
    decode_access_token
)
from services.email_service import (
    validate_email,
    send_email_verification_code,
    verify_email_code
)
from services.user_service import (
    get_user_by_phone, 
    create_user, 
    get_user_by_id,
    get_user_by_email,
    create_user_by_email,
    create_user_combined,
    apply_invite_code
)
from utils.supabase_client import get_supabase

router = APIRouter(prefix="/api/auth", tags=["认证"])
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    获取当前登录用户
    通过 JWT 令牌验证用户身份
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="无效的令牌")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="无效的令牌")
    
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    
    return user


@router.post("/send-code", summary="发送手机验证码")
async def send_code(request: SendCodeRequest):
    """
    发送手机验证码
    开发环境使用固定验证码 1234
    """
    if not validate_phone(request.phone):
        raise HTTPException(status_code=400, detail="手机号格式错误")
    
    code = await send_verification_code(request.phone)
    
    # 开发环境返回验证码便于测试
    return {
        "message": "验证码已发送",
        "code": code  # NOTE: 生产环境应移除此字段
    }


@router.post("/send-email-code", summary="发送邮箱验证码")
async def send_email_code(request: SendEmailCodeRequest):
    """
    发送邮箱验证码
    通过 SMTP 发送验证码到用户邮箱
    """
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="邮箱格式错误")
    
    code = send_email_verification_code(request.email)
    
    # 生产环境不返回验证码
    return {
        "message": "验证码已发送到您的邮箱，请查收"
    }


@router.post("/login", response_model=LoginResponse, summary="手机号登录/注册")
async def login(request: LoginRequest):
    """
    使用手机号和验证码登录
    如果用户不存在则自动注册
    """
    if not validate_phone(request.phone):
        raise HTTPException(status_code=400, detail="手机号格式错误")
    
    if not verify_code(request.phone, request.code):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")
    
    # 查找或创建用户
    user = get_user_by_phone(request.phone)
    if not user:
        user = create_user(request.phone)
    
    # 创建访问令牌
    access_token = create_access_token({"sub": user["id"]})
    
    return LoginResponse(
        access_token=access_token,
        user=UserResponse(**user)
    )


@router.post("/email-login", response_model=LoginResponse, summary="邮箱登录/注册")
async def email_login(request: EmailLoginRequest):
    """
    使用邮箱和验证码登录
    如果用户不存在则自动注册
    """
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="邮箱格式错误")
    
    if not verify_email_code(request.email, request.code):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")
    
    # 查找或创建用户
    user = get_user_by_email(request.email)
    if not user:
        user = create_user_by_email(request.email)
    
    # 创建访问令牌
    access_token = create_access_token({"sub": user["id"]})
    
    return LoginResponse(
        access_token=access_token,
        user=UserResponse(**user)
    )


@router.post("/combined-login", response_model=LoginResponse, summary="手机+邮箱登录/注册")
async def combined_login(request: CombinedLoginRequest):
    """
    使用手机号+邮箱+邮箱验证码登录
    如果用户不存在则自动注册（同时保存手机号和邮箱）
    """
    if not validate_phone(request.phone):
        raise HTTPException(status_code=400, detail="手机号格式错误")
    
    if not validate_email(request.email):
        raise HTTPException(status_code=400, detail="邮箱格式错误")
    
    if not verify_email_code(request.email, request.code):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")
    
    try:
        # 优先按邮箱查找用户，若不存在则按手机号查找
        user = get_user_by_email(request.email)
        if not user:
            user = get_user_by_phone(request.phone)
        
        if not user:
            # 创建新用户（同时保存手机号和邮箱）
            user = create_user_combined(request.phone, request.email)
            is_new_user = True
        else:
            is_new_user = False
            # 更新现有用户信息（确保 phone 和 email 都有）
            supabase = get_supabase()
            update_data = {}
            if not user.get("phone"):
                update_data["phone"] = request.phone
            if not user.get("email"):
                update_data["email"] = request.email
            if update_data:
                result = supabase.table("users").update(update_data).eq("id", user["id"]).execute()
                user = result.data[0]
        
        if is_new_user and request.invite_code:
            try:
                apply_invite_code(user["id"], request.invite_code)
                # Re-fetch is not needed for avatar optimization, but we usually want latest balance.
                # However, to avoid sending avatar here, we should fetch "lite" details.
            except ValueError as e:
                print(f"[AUTH WARNING] Invite code failed: {e}")
                pass
                
    except Exception as e:
        print(f"[AUTH ERROR] Login failed: {e}")
        error_str = str(e).lower()
        if "unique constraint" in error_str or "duplicate key" in error_str:
            raise HTTPException(status_code=400, detail="该手机号或邮箱已被其他账号占用")
        if "connecterror" in error_str or "getaddrinfo" in error_str:
             raise HTTPException(status_code=503, detail="无法连接到服务器数据库，请检查网络或稍后重试")
        raise HTTPException(status_code=500, detail=f"登录处理失败: {str(e)}")
    
    # Create access token
    access_token = create_access_token({"sub": user["id"]})
    
    # 优化 Payload: explicitly fetch basic fields or strip avatar_url from the user dict
    # This ensures the 2MB+ base64 string is NOT sent in basic login response.
    # The frontend will fetch separate details later.
    if "avatar_url" in user and user["avatar_url"] and len(user["avatar_url"]) > 1000:
         user["avatar_url"] = None

    return LoginResponse(
        access_token=access_token,
        user=UserResponse(**user)
    )


@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    获取当前登录用户的信息
    """
    return UserResponse(**current_user)


