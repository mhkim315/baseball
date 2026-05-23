import os
import re
import logging
import httpx
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status, HTTPBasicCredentials, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import CommunityUser
from limiter import limiter

logger = logging.getLogger(__name__)
load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])

security = HTTPBearer(auto_error=False)

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET environment variable is required. "
        "Generate one with: openssl rand -hex 32"
    )
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "168"))

APPLE_SERVICE_ID = os.getenv("APPLE_SERVICE_ID", "kr.fullcount.app")
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


class LoginRequest(BaseModel):
    provider: str  # kakao | naver | google | apple
    access_token: str = ""
    authorization_code: str = ""


class RegisterRequest(BaseModel):
    provider: str
    access_token: str = ""
    authorization_code: str = ""
    nickname: str

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped or len(stripped) > 20:
            raise ValueError("Nickname must be 1-20 characters")
        if re.search(r"<[^>]*>", stripped):
            raise ValueError("Nickname cannot contain HTML tags")
        return stripped


class TokenResponse(BaseModel):
    token: str
    user_id: str
    provider: str
    nickname: str
    is_new: bool


class UserInfo(BaseModel):
    user_id: str
    provider: str
    nickname: str
    profile_type: str
    profile_value: str | None


# Redirect URI for mobile OAuth flow
MOBILE_REDIRECT_URI = os.getenv("MOBILE_REDIRECT_URI", "kr.fullcount.app://auth")


# --- Social token verification ---

async def exchange_kakao_code(authorization_code: str) -> str:
    """Exchange Kakao authorization code for access token."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": KAKAO_REST_API_KEY,
                "redirect_uri": MOBILE_REDIRECT_URI,
                "code": authorization_code,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to exchange Kakao code")
        return resp.json()["access_token"]


async def exchange_naver_code(authorization_code: str) -> str:
    """Exchange Naver authorization code for access token."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.post(
            "https://nid.naver.com/oauth2.0/token",
            data={
                "grant_type": "authorization_code",
                "client_id": NAVER_CLIENT_ID,
                "client_secret": NAVER_CLIENT_SECRET,
                "redirect_uri": MOBILE_REDIRECT_URI,
                "code": authorization_code,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to exchange Naver code")
        return resp.json()["access_token"]

async def verify_kakao(access_token: str) -> dict:
    """Verify Kakao access token and return user info."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            logger.warning("Kakao token verification failed: status=%s", resp.status_code)
            raise HTTPException(status_code=401, detail="Invalid Kakao token")
        data = resp.json()
        return {"id": str(data["id"]), "nickname": data["properties"].get("nickname", "user")}


async def verify_naver(access_token: str) -> dict:
    """Verify Naver access token and return user info."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            logger.warning("Naver token verification failed: status=%s", resp.status_code)
            raise HTTPException(status_code=401, detail="Invalid Naver token")
        data = resp.json()
        resp_body = data["response"]
        return {"id": resp_body["id"], "nickname": resp_body.get("nickname", "user")}


async def verify_google(access_token: str) -> dict:
    """Verify Google access token and return user info."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if resp.status_code != 200:
            logger.warning("Google token verification failed: status=%s", resp.status_code)
            raise HTTPException(status_code=401, detail="Invalid Google token")
        data = resp.json()
        return {"id": data["sub"], "nickname": data.get("name", "user")}


async def verify_apple(access_token: str) -> dict:
    """Verify Apple identity token and return user info."""
    # Apple returns an ID token (JWT) directly from the client
    try:
        # Apple's public keys
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
            keys_resp = await client.get("https://appleid.apple.com/auth/keys")
            keys = keys_resp.json()["keys"]

        # Decode and verify the JWT
        header = jwt.get_unverified_header(access_token)
        key = next(k for k in keys if k["kid"] == header["kid"])
        public_key = jwt.rsa_key_from_dict(key)
        payload = jwt.decode(access_token, public_key, algorithms=["RS256"],
                             audience=APPLE_SERVICE_ID)
        if payload.get("iss") != "https://appleid.apple.com":
            logger.warning("Apple token has unexpected issuer: %s", payload.get("iss"))
            raise HTTPException(status_code=401, detail="Invalid Apple token issuer")
        return {"id": payload["sub"], "nickname": payload.get("email", "user")}
    except (JWTError, StopIteration) as e:
        logger.warning("Apple token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid Apple token")


async def verify_social_token(provider: str, token: str) -> dict:
    """Route verification to the correct provider."""
    if provider == "kakao":
        return await verify_kakao(token)
    elif provider == "naver":
        return await verify_naver(token)
    elif provider == "google":
        return await verify_google(token)
    elif provider == "apple":
        return await verify_apple(token)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


async def verify_social(provider: str, access_token: str = "", authorization_code: str = "") -> dict:
    """Verify social token, exchanging auth code for access token if needed."""
    token = access_token
    if not token and authorization_code:
        if provider == "kakao":
            token = await exchange_kakao_code(authorization_code)
        elif provider == "naver":
            token = await exchange_naver_code(authorization_code)
        else:
            raise HTTPException(status_code=400, detail=f"Authorization code not supported for {provider}")
    if not token:
        raise HTTPException(status_code=400, detail="Either access_token or authorization_code required")
    return await verify_social_token(provider, token)


# --- JWT helpers ---

def create_jwt(user_id: str) -> str:
    """Create a JWT for the given user ID."""
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    """Decode and verify a JWT, returning the payload."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning("JWT decode failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    credentials: HTTPBasicCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> CommunityUser:
    """Dependency: extract the current user from a Bearer token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization required")
    payload = decode_jwt(credentials.credentials)
    user_id = payload.get("sub")
    result = await db.execute(select(CommunityUser).where(
        CommunityUser.user_id == user_id,
        CommunityUser.deleted_at.is_(None),
    ))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# --- Routes ---

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with a social access token. Returns JWT on success."""
    social_info = await verify_social(req.provider, req.access_token, req.authorization_code)
    user_id = f"{req.provider}_{social_info['id']}"

    result = await db.execute(select(CommunityUser).where(CommunityUser.user_id == user_id))
    user = result.scalar_one_or_none()

    if user and user.deleted_at:
        # Reactivate deleted account
        user.deleted_at = None
        await db.commit()

    if not user:
        # First login: create user with default nickname
        user = CommunityUser(
            user_id=user_id,
            provider=req.provider,
            nickname=social_info["nickname"],
        )
        db.add(user)
        await db.commit()
        token = create_jwt(user_id)
        return TokenResponse(token=token, user_id=user_id, provider=req.provider,
                             nickname=user.nickname, is_new=True)

    token = create_jwt(user_id)
    return TokenResponse(token=token, user_id=user_id, provider=req.provider,
                         nickname=user.nickname, is_new=False)


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
async def register(request: Request, req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register with a social token and custom nickname."""
    social_info = await verify_social(req.provider, req.access_token, req.authorization_code)
    user_id = f"{req.provider}_{social_info['id']}"

    result = await db.execute(select(CommunityUser).where(CommunityUser.user_id == user_id))
    existing = result.scalar_one_or_none()

    if existing:
        if existing.deleted_at:
            existing.deleted_at = None
        existing.nickname = req.nickname.strip()
        await db.commit()
        token = create_jwt(user_id)
        return TokenResponse(token=token, user_id=user_id, provider=req.provider,
                             nickname=existing.nickname, is_new=False)

    user = CommunityUser(
        user_id=user_id,
        provider=req.provider,
        nickname=req.nickname.strip(),
    )
    db.add(user)
    await db.commit()
    token = create_jwt(user_id)
    return TokenResponse(token=token, user_id=user_id, provider=req.provider,
                         nickname=user.nickname, is_new=True)


@router.get("/me", response_model=UserInfo)
async def get_my_info(user: CommunityUser = Depends(get_current_user)):
    """Get current user info. Requires Authorization: Bearer <token> header."""
    return UserInfo(
        user_id=user.user_id,
        provider=user.provider,
        nickname=user.nickname,
        profile_type=user.profile_type or "character",
        profile_value=user.profile_value,
    )


class NicknameUpdate(BaseModel):
    nickname: str

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped or len(stripped) > 20:
            raise ValueError("Nickname must be 1-20 characters")
        if re.search(r"<[^>]*>", stripped):
            raise ValueError("Nickname cannot contain HTML tags")
        return stripped


@router.put("/nickname")
async def update_nickname(
    body: NicknameUpdate,
    user: CommunityUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update own nickname. Requires JWT."""
    user.nickname = body.nickname
    await db.commit()
    return {"nickname": body.nickname, "message": "Nickname updated"}
