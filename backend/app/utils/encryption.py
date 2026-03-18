from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
import base64
from app.config import get_settings

settings = get_settings()


def _get_key() -> bytes:
    return bytes.fromhex(settings.DB_ENCRYPTION_KEY)


def encrypt_password(plain_password: str) -> str:
    """Encrypt a password using AES-256-GCM. Returns base64-encoded nonce+ciphertext."""
    aesgcm = AESGCM(_get_key())
    nonce = os.urandom(12)  # 96-bit nonce
    ciphertext = aesgcm.encrypt(nonce, plain_password.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt_password(encrypted: str) -> str:
    """Decrypt a password previously encrypted with encrypt_password."""
    aesgcm = AESGCM(_get_key())
    data = base64.b64decode(encrypted)
    nonce, ciphertext = data[:12], data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()
