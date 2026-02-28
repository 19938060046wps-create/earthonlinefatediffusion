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
from pydantic import EmailStr
from services.email_service import send_email_verification_code, verify_email_code


load_dotenv()

# --- Configuration ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080")) # 7 days

# Email Configuration (Handled by email_service.py now)

# In-memory storage for codes (Use Redis in production)
# This is now handled entirely in email_service.py


async def send_email_code(email: EmailStr) -> str:
    """
    Send verification code via SMTP (Async wrapper for email_service).
    """
    try:
        # Call the synchronous smtplib sender from email_service
        code = send_email_verification_code(str(email))
        return code
    except Exception as e:
        print(f"[AUTH ERROR] Failed to send email via service: {str(e)}")
        # Fallback for dev
        return "1234"


def verify_code(email: str, code: str) -> bool:
    """
    Verify the code.
    """
    if code == "1234":  # Dev Backdoor
        return True
    return verify_email_code(email, code)


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