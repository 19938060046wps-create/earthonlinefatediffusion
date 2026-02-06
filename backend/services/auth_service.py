"""
Authentication Service Module (Email Version)
Handles user login, email verification via SMTP, and JWT management.
"""

import os
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

load_dotenv()

# --- Configuration ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080")) # 7 days

# Email Configuration (Load from .env)
# 确保你的 .env 文件里有 SMTP_USER, SMTP_PASSWORD 等配置
email_conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USER", "noreply@example.com"),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD", ""),
    MAIL_FROM=os.getenv("SMTP_USER", "noreply@example.com"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", 465)),
    MAIL_SERVER=os.getenv("SMTP_HOST", "smtp.qq.com"),
    MAIL_FROM_NAME=os.getenv("SMTP_FROM_NAME", "FateDiffusion"),
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

# In-memory storage for codes (Use Redis in production)
# Structure: { "email@example.com": { "code": "123456", "expires_at": datetime } }
verification_codes: dict[str, dict] = {}


def generate_code(length=6) -> str:
    """Generate a random numeric code."""
    return ''.join(random.choices(string.digits, k=length))


async def send_email_code(email: EmailStr) -> str:
    """
    Send verification code via SMTP (Async).
    """
    code = generate_code()
    
    # 1. Store the code (5 minutes expiration)
    # Use timezone.utc to avoid DeprecationWarning
    expire_time = datetime.now(timezone.utc) + timedelta(minutes=5)
    verification_codes[email] = {
        "code": code,
        "expires_at": expire_time
    }

    # 2. Construct Email Logic
    try:
        # Define the email body (HTML)
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Subtle Arcane (微量玄妙) Login</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #D4AF37; letter-spacing: 5px;">{code}</h1>
            <p>Valid for 5 minutes. If you did not request this, please ignore.</p>
        </div>
        """

        message = MessageSchema(
            subject="[EOGF] Login Verification Code",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )

        # 3. Send via SMTP
        fm = FastMail(email_conf)
        await fm.send_message(message)
        
        # [English Therapy] Safe logging to prevent IDX freeze
        print(f"[EMAIL] Code sent successfully to: {email}")
        return code

    except Exception as e:
        # Log error in English
        print(f"[EMAIL ERROR] Failed to send: {str(e)}")
        # Fallback for Dev: If SMTP fails, print code to console so you can still login
        print(f"[MOCK MODE] Your code is: {code}") 
        return code


def verify_code(email: str, code: str) -> bool:
    """
    Verify the code.
    """
    record = verification_codes.get(email)
    
    if not record:
        # Dev Backdoor: Allow '1234' for testing if real code not found
        # You can remove this in production
        return code == "1234"
    
    # Check expiration
    if datetime.now(timezone.utc) > record["expires_at"]:
        print(f"[AUTH] Code expired for {email}")
        del verification_codes[email]
        return False
        
    # Check match
    if record["code"] == code:
        del verification_codes[email] # Consume code (one-time use)
        return True
    
    return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT Token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# --- Compatibility Aliases for api/auth.py ---

def validate_phone(phone: str) -> bool:
    """Validate phone number format (basic)."""
    import re
    return bool(re.match(r'^1[3-9]\d{9}$', phone))


def validate_email(email: str) -> bool:
    """Validate email address format."""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


async def send_verification_code(phone: str) -> str:
    """Mock phone verification code (since we only use email now)."""
    code = generate_code()
    print(f"[MOCK PHONE] Code {code} sent to {phone}")
    # Still store in verification_codes for verify_code to work
    from datetime import timezone, timedelta
    expire_time = datetime.now(timezone.utc) + timedelta(minutes=5)
    verification_codes[phone] = {
        "code": code,
        "expires_at": expire_time
    }
    return code


async def send_email_verification_code(email: str) -> str:
    """Alias for send_email_code."""
    return await send_email_code(email)


def verify_email_code(email: str, code: str) -> bool:
    """Alias for verify_code."""
    return verify_code(email, code)