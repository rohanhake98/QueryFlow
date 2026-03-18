import pytest
from app.utils.encryption import encrypt_password, decrypt_password
import os

# Override encryption key for tests
os.environ["DB_ENCRYPTION_KEY"] = "a" * 64  # 32-byte hex


def test_encrypt_decrypt_roundtrip():
    original = "super_secret_password_123!"
    encrypted = encrypt_password(original)
    decrypted = decrypt_password(encrypted)
    assert decrypted == original


def test_encrypted_is_different_from_original():
    original = "my_password"
    encrypted = encrypt_password(original)
    assert encrypted != original


def test_each_encryption_is_unique():
    """AES-GCM uses random nonces, so same plaintext → different ciphertext each time."""
    original = "same_password"
    enc1 = encrypt_password(original)
    enc2 = encrypt_password(original)
    assert enc1 != enc2


def test_decrypt_still_matches():
    original = "consistent_result"
    enc = encrypt_password(original)
    assert decrypt_password(enc) == original
