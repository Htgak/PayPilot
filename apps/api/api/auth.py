import base64
import hashlib
import hmac
import json
import re
import secrets
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from apps.api.config import settings
from apps.api.db.database import get_db
from apps.api.db.models import AuthUserModel

router = APIRouter(prefix="/auth", tags=["Authentication"])
ITERATIONS = 310_000

class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=10, max_length=256)

def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")

def _password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${_b64(salt)}${_b64(digest)}"

def _password_matches(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds, salt, expected = encoded.split("$")
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), base64.urlsafe_b64decode(salt + "=="), int(rounds))
        return algorithm == "pbkdf2_sha256" and hmac.compare_digest(_b64(actual), expected)
    except (ValueError, TypeError):
        return False

def _make_token(user: AuthUserModel) -> str:
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64(json.dumps({"sub": user.id, "email": user.email, "uid": user.user_id, "exp": int(time.time()) + 43_200}, separators=(",", ":")).encode())
    unsigned = f"{header}.{payload}"
    signature = _b64(hmac.new(settings.jwt_secret.encode(), unsigned.encode(), hashlib.sha256).digest())
    return f"{unsigned}.{signature}"

def verify_access_token(token: str) -> bool:
    try:
        header, payload, signature = token.split(".")
        unsigned = f"{header}.{payload}"
        expected = _b64(hmac.new(settings.jwt_secret.encode(), unsigned.encode(), hashlib.sha256).digest())
        claims = json.loads(base64.urlsafe_b64decode(payload + "=="))
        return hmac.compare_digest(signature, expected) and int(claims["exp"]) > int(time.time())
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return False

def _session(user: AuthUserModel) -> dict:
    return {"access_token": _make_token(user), "token_type": "bearer", "email": user.email}

@router.get("/status")
def auth_status(db: Session = Depends(get_db)):
    return {"account_exists": db.query(AuthUserModel.id).first() is not None}

@router.post("/signup")
def signup(credentials: Credentials, db: Session = Depends(get_db)):
    email = credentials.email.strip().lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    if db.query(AuthUserModel.id).first() is not None:
        raise HTTPException(status_code=403, detail="The workspace is already set up. Sign in instead.")
    user = AuthUserModel(id=str(uuid.uuid4()), email=email, password_hash=_password_hash(credentials.password), user_id="default_merchant")
    db.add(user)
    db.commit()
    db.refresh(user)
    return _session(user)

@router.post("/login")
def login(credentials: Credentials, db: Session = Depends(get_db)):
    email = credentials.email.strip().lower()
    user = db.query(AuthUserModel).filter_by(email=email).first()
    if not user or not _password_matches(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return _session(user)
