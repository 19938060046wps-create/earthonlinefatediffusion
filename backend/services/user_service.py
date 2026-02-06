"""
用户服务模块
处理用户数据的 CRUD 操作
"""

from typing import Optional
from utils.supabase_client import get_supabase


def get_user_by_phone(phone: str) -> Optional[dict]:
    """
    根据手机号获取用户
    
    :param phone: 手机号
    :return: 用户数据或 None
    """
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("phone", phone).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def get_user_by_id(user_id: str) -> Optional[dict]:
    """
    根据 ID 获取用户
    
    :param user_id: 用户 ID
    :return: 用户数据或 None
    """
    supabase = get_supabase()
    # 优化：不返回 avatar_url (可能是 Base64 大图)，避免阻塞网络。需要头像时单独获取或使用 CDN URL。
    result = supabase.table("users").select("id, uid, phone, email, username, balance, has_agreed_privacy, theme, invite_code, created_at").eq("id", user_id).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def get_user_full_details(user_id: str) -> Optional[dict]:
    """
    获取用户完整信息（包含 avatar_url 等大字段）
    用于后台加载
    """
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def create_user(phone: str) -> dict:
    """
    创建新用户（通过手机号）
    
    :param phone: 手机号
    :return: 新用户数据
    """
    import random
    
    supabase = get_supabase()
    
    # 生成随机用户名
    username = f"User_{random.randint(10000, 99999)}"
    
    result = supabase.table("users").insert({
        "phone": phone,
        "username": username,
        "balance": 88,  # 初始赠送 88 算力
        "has_agreed_privacy": False,
        "theme": "light"
    }).execute()
    
    return result.data[0]


def get_user_by_email(email: str) -> Optional[dict]:
    """
    根据邮箱获取用户
    
    :param email: 邮箱
    :return: 用户数据或 None
    """
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("email", email).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None


def create_user_by_email(email: str) -> dict:
    """
    创建新用户（通过邮箱）
    
    :param email: 邮箱
    :return: 新用户数据
    """
    import random
    
    supabase = get_supabase()
    
    # 生成随机用户名
    username = f"User_{random.randint(10000, 99999)}"
    
    result = supabase.table("users").insert({
        "email": email,
        "username": username,
        "balance": 88,  # 初始赠送 88 算力
        "has_agreed_privacy": False,
        "theme": "light"
    }).execute()
    
    return result.data[0]


def create_user_combined(phone: str, email: str) -> dict:
    """
    创建新用户（同时包含手机号和邮箱）
    
    :param phone: 手机号
    :param email: 邮箱
    :return: 新用户数据
    """
    import random
    
    supabase = get_supabase()
    
    # 生成随机用户名
    username = f"User_{random.randint(10000, 99999)}"
    
    result = supabase.table("users").insert({
        "phone": phone,
        "email": email,
        "username": username,
        "balance": 88,  # 初始赠送 88 算力
        "has_agreed_privacy": False,
        "theme": "light"
    }).execute()
    
    return result.data[0]


def update_user_profile(user_id: str, username: Optional[str] = None, 
                        avatar_url: Optional[str] = None) -> dict:
    """
    更新用户资料
    
    :param user_id: 用户 ID
    :param username: 新用户名
    :param avatar_url: 新头像 URL
    :return: 更新后的用户数据
    """
    supabase = get_supabase()
    
    update_data = {}
    if username is not None:
        update_data["username"] = username
    if avatar_url is not None:
        update_data["avatar_url"] = avatar_url
    
    if not update_data:
        return get_user_by_id(user_id)
    
    result = supabase.table("users").update(update_data).eq("id", user_id).execute()
    return result.data[0]


def update_user_balance(user_id: str, amount: int) -> dict:
    """
    更新用户余额
    
    :param user_id: 用户 ID
    :param amount: 变化量（正数为充值，负数为扣除）
    :return: 更新后的用户数据
    """
    supabase = get_supabase()
    
    # 先获取当前余额
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError("用户不存在")
    
    new_balance = user["balance"] + amount
    if new_balance < 0:
        raise ValueError("余额不足")
    
    result = supabase.table("users").update({
        "balance": new_balance
    }).eq("id", user_id).execute()
    
    return result.data[0]


def update_user_theme(user_id: str, theme: str) -> dict:
    """
    更新用户主题设置
    
    :param user_id: 用户 ID
    :param theme: 主题 ('dark' 或 'light')
    :return: 更新后的用户数据
    """
    supabase = get_supabase()
    
    result = supabase.table("users").update({
        "theme": theme
    }).eq("id", user_id).execute()
    
    return result.data[0]


def update_user_privacy(user_id: str, has_agreed: bool) -> dict:
    """
    更新用户隐私设置
    
    :param user_id: 用户 ID
    :param has_agreed: 是否同意隐私政策
    :return: 更新后的用户数据
    """
    supabase = get_supabase()

    result = supabase.table("users").update({
        "has_agreed_privacy": has_agreed
    }).eq("id", user_id).execute()
    
    return result.data[0]


def generate_invite_code() -> str:
    """生成唯一的 6 位邀请码"""
    import random
    import string
    
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(6))


def get_user_invite_code(user_id: str) -> str:
    """获取用户的邀请码，如果不存在则创建"""
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError("用户不存在")
    
    if user.get("invite_code"):
        return user["invite_code"]
    
    # 生成并保存新邀请码
    supabase = get_supabase()
    while True:
        new_code = generate_invite_code()
        # 检查是否重复
        check = supabase.table("users").select("id").eq("invite_code", new_code).execute()
        if not check.data:
            break
            
    supabase.table("users").update({"invite_code": new_code}).eq("id", user_id).execute()
    return new_code


def apply_invite_code(user_id: str, invite_code: str) -> dict:
    """
    填写邀请码，发放奖励
    :return: 结果信息
    """
    import datetime
    from datetime import timezone
    import logging

    # 设置日志
    logger = logging.getLogger("auth")
    logger.setLevel(logging.INFO)
    
    supabase = get_supabase()
    
    # 1. 检查当前用户
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError("用户不存在")
    
    # 检查用户注册时间是否超过 24 小时
    created_at_str = user.get("created_at")
    if created_at_str:
        # Supabase 返回的时间字符串通常包含时区，例如 "2023-10-27T10:00:00+00:00"
        # 简单处理：解析字符串并比较
        try:
            # 处理 ISO 格式时间
            created_at = datetime.datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            now = datetime.datetime.now(timezone.utc)
            
            # 如果 create_at 没有时区信息，给它加上 UTC
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
                
            delta = now - created_at
            if delta.total_seconds() > 24 * 3600:
                 raise ValueError("仅限新用户（注册24小时内）填写邀请码")
        except Exception as e:
            logger.warning(f"解析注册时间失败: {e}, 忽略时间限制检查")

    
    # 检查是否已经填写过邀请码（已经在 referrals 表中作为 referee 存在）
    existing_ref = supabase.table("referrals").select("id").eq("referee_id", user_id).execute()
    if existing_ref.data:
        raise ValueError("您已经填写过邀请码，无法重复填写")
    
    # 2. 检查邀请码有效性
    referrer_result = supabase.table("users").select("id").eq("invite_code", invite_code).execute()
    if not referrer_result.data:
        raise ValueError("无效的邀请码")
        
    referrer_id = referrer_result.data[0]["id"]
    
    # 3. 检查是否邀请自己
    if referrer_id == user_id:
        raise ValueError("不能填写自己的邀请码")
        
    # 4. 记录邀请关系
    supabase.table("referrals").insert({
        "referrer_id": referrer_id,
        "referee_id": user_id,
        "status": "completed"
    }).execute()
    
    # 5. 发放奖励（双方各加 58 算力）
    try:
        # 给邀请人加奖励
        logger.info(f"Adding reward to referrer {referrer_id}")
        update_user_balance(referrer_id, 58)
        
        # 给被邀请人加奖励
        logger.info(f"Adding reward to referee {user_id}")
        updated_user = update_user_balance(user_id, 58)
        
        return {
            "success": True, 
            "message": "邀请码填写成功，获得 58 算力奖励",
            "balance": updated_user["balance"]
        }
    except Exception as e:
        logger.error(f"Error adding rewards: {e}")
        # 即使奖励发放失败，邀请关系已记录，避免重复领奖
        # 这里可以选择回滚（删除 referral 记录）或者人工补偿，简单起见暂时仅记录日志
        raise e

